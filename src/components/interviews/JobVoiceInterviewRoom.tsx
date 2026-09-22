"use client";

import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  ShieldCheck,
  Volume2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { JobInterviewVoiceSessionState } from "@/lib/interviews";

type JobVoiceInterviewRoomProps = {
  initialState: JobInterviewVoiceSessionState;
};

type VoiceStatus =
  | "idle"
  | "connecting"
  | "audio-blocked"
  | "listening"
  | "interviewer"
  | "processing"
  | "ending"
  | "saving"
  | "failed"
  | "completed";

type RealtimeEvent = {
  type?: string;
  name?: string;
  response_id?: string;
  call_id?: string;
  arguments?: string;
  transcript?: string;
  response?: {
    id?: string;
    usage?: Record<string, unknown>;
    metadata?: { purpose?: string };
  };
};

type CompletedTranscriptTurn = {
  question?: string;
  answer?: string;
};

type TranscriptPayloadTurn = {
  turnId: string;
  question: string;
  answer: string;
};

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function numericUsage(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : undefined;
}

function normalizeTranscript(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function JobVoiceInterviewRoom({
  initialState,
}: JobVoiceInterviewRoomProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [status, setStatus] = useState<VoiceStatus>(
    initialState.progress.isComplete ? "completed" : "idle",
  );
  const [error, setError] = useState("");
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraNotice, setCameraNotice] = useState("");
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialState.session.durationLimitSeconds,
  );
  const [finalizationRetryToken, setFinalizationRetryToken] = useState(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const cameraRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelReadyRef = useRef(false);
  const audioReadyRef = useRef(false);
  const interviewStartedRef = useRef(false);
  const completingRef = useRef(false);
  const finalizingRef = useRef(false);
  const mountedRef = useRef(true);
  const hardStopTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pendingInputTranscriptsRef = useRef<string[]>([]);
  const candidateTranscriptsRef = useRef(
    initialState.turns
      .map((turn) => turn.answer)
      .filter((answer): answer is string => Boolean(answer)),
  );
  const questionTranscriptsRef = useRef(
    initialState.turns.map((turn) => turn.question),
  );
  const completionReasonRef = useRef("complete_interview_tool");
  const providerUsageRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // The WebRTC connection is owned by this room instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (finalizationRetryToken <= 0 || finalizingRef.current) return;
    setError("");
    void finalizeInterview();
    // Retry is intentionally explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizationRetryToken]);

  function send(event: Record<string, unknown>) {
    if (channelRef.current?.readyState === "open") {
      channelRef.current.send(JSON.stringify(event));
    }
  }

  function clearTimers() {
    if (hardStopTimerRef.current !== null) {
      window.clearTimeout(hardStopTimerRef.current);
      hardStopTimerRef.current = null;
    }
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  function disconnect(preserveStatus = false) {
    channelRef.current?.close();
    channelRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    microphoneRef.current?.getTracks().forEach((track) => track.stop());
    microphoneRef.current = null;
    cameraRef.current?.getTracks().forEach((track) => track.stop());
    cameraRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current.remove();
    }
    audioRef.current = null;
    channelReadyRef.current = false;
    audioReadyRef.current = false;
    interviewStartedRef.current = false;
    clearTimers();
    if (mountedRef.current) {
      setCameraOn(false);
      if (!preserveStatus) setStatus("idle");
    }
  }

  function beginInterviewWhenReady() {
    if (
      interviewStartedRef.current ||
      !channelReadyRef.current ||
      !audioReadyRef.current
    ) {
      return;
    }

    interviewStartedRef.current = true;
    startedAtRef.current = Date.now();
    setStatus("processing");
    setSoundBlocked(false);
    setRemainingSeconds(state.session.durationLimitSeconds);
    hardStopTimerRef.current = window.setTimeout(() => {
      hardStopTimerRef.current = null;
      requestCompletion("duration_limit");
    }, state.session.durationLimitSeconds * 1000);
    countdownTimerRef.current = window.setInterval(() => {
      if (!startedAtRef.current) return;
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setRemainingSeconds(state.session.durationLimitSeconds - elapsed);
    }, 1000);
    const selectedQuestion =
      state.currentTurn?.question ?? state.turns[0]?.question ?? "";
    const companyContext = state.context.company
      ? ` at ${state.context.company}`
      : "";
    const isFirstOpening =
      state.progress.answeredTurns === 0 && !state.session.startedAt;
    const openingInstruction = isFirstOpening
      ? `Start with exactly this brief greeting: "Welcome to your ${state.context.role} interview${companyContext}." Then use a natural transition and ask exactly this selected interview question: "${selectedQuestion}" Do not ask any additional question.`
      : `Welcome the candidate back briefly, then ask exactly this selected interview question: "${selectedQuestion}" Do not ask any additional question.`;

    send({
      type: "response.create",
      response: {
        instructions: openingInstruction,
        output_modalities: ["audio"],
        tool_choice: "none",
        metadata: { purpose: "spoken_opening" },
      },
    });
  }

  async function enableInterviewAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      audioReadyRef.current = true;
      beginInterviewWhenReady();
    } catch {
      setSoundBlocked(true);
      setStatus("audio-blocked");
    }
  }

  async function connect() {
    if (!["idle", "failed"].includes(status)) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setError("Voice interviews are not supported in this browser.");
      setStatus("failed");
      return;
    }

    setError("");
    setStatus("connecting");
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      microphoneRef.current = microphone;
      microphone.getAudioTracks().forEach((track) => {
        track.enabled = !microphoneMuted;
      });

      const peer = new RTCPeerConnection();
      peerRef.current = peer;
      microphone.getAudioTracks().forEach((track) => peer.addTrack(track, microphone));

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.muted = false;
      audio.volume = 1;
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("aria-hidden", "true");
      audio.className = "fixed h-px w-px opacity-0 pointer-events-none";
      document.body.appendChild(audio);
      audioRef.current = audio;

      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        void audio
          .play()
          .then(() => {
            audioReadyRef.current = true;
            beginInterviewWhenReady();
          })
          .catch(() => {
            setSoundBlocked(true);
            setStatus("audio-blocked");
          });
      };
      peer.onconnectionstatechange = () => {
        if (
          ["failed", "disconnected", "closed"].includes(peer.connectionState) &&
          !finalizingRef.current &&
          !completingRef.current
        ) {
          disconnect(true);
          setStatus("failed");
          setError("The voice connection dropped. Reconnect to continue.");
        }
      };

      const channel = peer.createDataChannel("jobready-voice-events");
      channelRef.current = channel;
      channel.addEventListener("message", (message) => {
        try {
          void handleRealtimeEvent(JSON.parse(message.data) as RealtimeEvent);
        } catch {
          // Ignore malformed non-critical provider events.
        }
      });
      const open = new Promise<void>((resolve, reject) => {
        channel.addEventListener("open", () => resolve(), { once: true });
        channel.addEventListener(
          "error",
          () => reject(new Error("The voice interview channel failed.")),
          { once: true },
        );
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const response = await fetch(
        `/api/job-interviews/${state.session.id}/voice/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        },
      );
      const answerSdp = await response.text();
      if (!response.ok) {
        let message = "Could not start the voice interviewer.";
        try {
          message = JSON.parse(answerSdp).error || message;
        } catch {}
        throw new Error(message);
      }
      await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
      await open;
      channelReadyRef.current = true;
      beginInterviewWhenReady();
    } catch (caught) {
      disconnect(true);
      setStatus("failed");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not start the voice interviewer.",
      );
    }
  }

  function appendCandidateTranscript(transcript: string) {
    const normalized = normalizeTranscript(transcript);
    if (!normalized) return;
    if (candidateTranscriptsRef.current.at(-1) !== normalized) {
      candidateTranscriptsRef.current.push(normalized);
    }
  }

  function appendQuestionTranscript(transcript: string) {
    const normalized = normalizeTranscript(transcript);
    if (!normalized) return;
    const existingIndex = questionTranscriptsRef.current.findIndex(
      (question) => question === normalized,
    );
    if (existingIndex === -1) {
      questionTranscriptsRef.current.push(normalized);
    }
  }

  function applyCompletedTranscript(turns: CompletedTranscriptTurn[]) {
    const normalized = turns
      .map((turn) => ({
        question: normalizeTranscript(turn.question),
        answer: normalizeTranscript(turn.answer),
      }))
      .filter((turn) => turn.question && turn.answer);
    if (normalized.length < candidateTranscriptsRef.current.length) return false;

    questionTranscriptsRef.current = normalized.map((turn, index) =>
      turn.question || state.turns[index]?.question || "",
    );
    candidateTranscriptsRef.current = normalized.map((turn) => turn.answer);
    return normalized.length > 0;
  }

  async function latestCapturedAnswer(fallback?: string) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (pendingInputTranscriptsRef.current.length > 0) break;
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    const captured = pendingInputTranscriptsRef.current.join(" ").trim();
    pendingInputTranscriptsRef.current = [];
    return captured || normalizeTranscript(fallback);
  }

  function requestCompletion(reason: string) {
    if (!interviewStartedRef.current || finalizingRef.current) return;
    completionReasonRef.current = reason;
    completingRef.current = true;
    clearTimers();
    microphoneRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    stopCamera();
    setStatus("ending");
    send({ type: "response.cancel" });
    send({ type: "output_audio_buffer.clear" });
    send({
      type: "response.create",
      response: {
        instructions:
          "Call complete_interview now. Include the ordered transcript for each answered selected question. Do not speak, coach, score, or ask another question.",
        tool_choice: "required",
        metadata: { purpose: "manual_completion_transcript" },
      },
    });
  }

  async function finalizeInterview() {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    setStatus("saving");
    disconnect(true);

    const turns: TranscriptPayloadTurn[] = candidateTranscriptsRef.current
      .map((answer, index) => {
        const persistedTurn = state.turns[index];
        if (!persistedTurn) return null;

        return {
          turnId: persistedTurn.id,
          question: questionTranscriptsRef.current[index] || persistedTurn.question,
          answer,
        };
      })
      .filter((turn): turn is TranscriptPayloadTurn => Boolean(turn));
    if (turns.length === 0) {
      finalizingRef.current = false;
      completingRef.current = false;
      setStatus("failed");
      setError("No spoken answers were captured. Reconnect and answer at least one question.");
      return;
    }

    const elapsedSeconds = startedAtRef.current
      ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
      : undefined;
    const usage = providerUsageRef.current ?? {};

    try {
      const response = await fetch(
        `/api/job-interviews/${state.session.id}/voice/transcript`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName: "complete_interview",
            completionReason: completionReasonRef.current,
            durationSeconds: elapsedSeconds,
            providerUsage: {
              inputTokens: numericUsage(usage.input_tokens ?? usage.inputTokens),
              outputTokens: numericUsage(usage.output_tokens ?? usage.outputTokens),
              cachedInputTokens: numericUsage(
                usage.cached_input_tokens ?? usage.cachedInputTokens,
              ),
              audioSeconds: elapsedSeconds,
            },
            turns,
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "Could not save the voice transcript.",
        );
      }

      if (body.state) setState(body.state as JobInterviewVoiceSessionState);
      setStatus("completed");
      router.push(`/interviews/${state.session.id}/report`);
    } catch (caught) {
      finalizingRef.current = false;
      completingRef.current = false;
      setStatus("failed");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the voice transcript.",
      );
    }
  }

  async function interruptInterview() {
    const elapsedSeconds = startedAtRef.current
      ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
      : undefined;
    disconnect(true);
    setStatus("idle");
    try {
      const response = await fetch(
        `/api/job-interviews/${state.session.id}/voice/interrupt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Candidate paused the voice interview.",
            durationSeconds: elapsedSeconds,
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.state) {
        setState(body.state as JobInterviewVoiceSessionState);
      }
    } catch {
      setError("The interview paused locally. Reconnect when you are ready.");
    }
  }

  function toggleMicrophone() {
    const nextMuted = !microphoneMuted;
    microphoneRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMicrophoneMuted(nextMuted);
    if (nextMuted && status === "listening") setStatus("processing");
  }

  function stopCamera() {
    cameraRef.current?.getTracks().forEach((track) => track.stop());
    cameraRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function toggleCamera() {
    if (cameraOn) {
      stopCamera();
      setCameraNotice("");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraNotice("Camera preview is not supported in this browser.");
      return;
    }

    try {
      const camera = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      cameraRef.current = camera;
      if (videoRef.current) videoRef.current.srcObject = camera;
      setCameraOn(true);
      setCameraNotice("");
    } catch {
      setCameraOn(false);
      setCameraNotice("Camera permission was not granted. Your initials remain visible.");
    }
  }

  async function handleRealtimeEvent(event: RealtimeEvent) {
    if (event.type === "input_audio_buffer.speech_started") {
      if (!completingRef.current) setStatus("listening");
      return;
    }
    if (event.type === "input_audio_buffer.speech_stopped") {
      if (!completingRef.current) setStatus("processing");
      return;
    }
    if (event.type === "response.created") {
      providerUsageRef.current = event.response?.usage ?? providerUsageRef.current;
      if (!completingRef.current) setStatus("processing");
      return;
    }
    if (
      event.type === "response.output_audio.delta" ||
      event.type === "response.audio.delta" ||
      event.type === "output_audio_buffer.started"
    ) {
      if (!completingRef.current) setStatus("interviewer");
      return;
    }
    if (
      event.type === "output_audio_buffer.stopped" ||
      event.type === "output_audio_buffer.cleared"
    ) {
      if (!completingRef.current) setStatus("listening");
      return;
    }
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      const transcript = normalizeTranscript(event.transcript);
      if (!transcript || finalizingRef.current) return;
      if (pendingInputTranscriptsRef.current.at(-1) !== transcript) {
        pendingInputTranscriptsRef.current.push(transcript);
      }
      appendCandidateTranscript(transcript);
      return;
    }
    if (
      event.type === "response.output_audio_transcript.done" ||
      event.type === "response.audio_transcript.done"
    ) {
      if (completingRef.current) return;
      appendQuestionTranscript(event.transcript ?? "");
      return;
    }
    if (
      event.type === "response.function_call_arguments.done" &&
      event.name === "complete_interview"
    ) {
      completingRef.current = true;
      try {
        const args = JSON.parse(event.arguments || "{}") as {
          reason?: string;
          final_candidate_answer?: string;
          transcript?: CompletedTranscriptTurn[];
        };
        if (args.reason) completionReasonRef.current = args.reason;
        const usedCompletedTranscript = Array.isArray(args.transcript)
          ? applyCompletedTranscript(args.transcript)
          : false;
        const finalAnswer = await latestCapturedAnswer(args.final_candidate_answer);
        if (!usedCompletedTranscript && finalAnswer) {
          appendCandidateTranscript(finalAnswer);
        }
      } catch {
        const finalAnswer = await latestCapturedAnswer();
        if (finalAnswer) appendCandidateTranscript(finalAnswer);
      }

      if (event.call_id) {
        send({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify({ completed: true }),
          },
        });
      }
      void finalizeInterview();
      return;
    }
    if (event.type === "response.done") {
      providerUsageRef.current = event.response?.usage ?? providerUsageRef.current;
    }
  }

  const statusLabel =
    status === "connecting"
      ? "Connecting"
      : status === "audio-blocked"
        ? "Enable interviewer audio"
        : status === "listening"
          ? "Listening"
          : status === "interviewer"
            ? "Interviewer speaking"
            : status === "processing"
              ? "Preparing next turn"
              : status === "ending"
                ? "Ending interview"
                : status === "saving"
                  ? "Saving transcript"
                  : status === "failed"
                    ? "Reconnect needed"
                    : status === "completed"
                      ? "Interview complete"
                      : "Ready";

  const interviewerSpeaking = status === "interviewer";
  const candidateSpeaking = status === "listening" && !microphoneMuted;
  const interviewLive = ["listening", "interviewer", "processing"].includes(
    status,
  );
  const controlsLocked = ["connecting", "ending", "saving", "completed"].includes(
    status,
  );
  const elapsedSeconds = Math.max(
    0,
    state.session.durationLimitSeconds - remainingSeconds,
  );

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#eef1ee] p-3 text-[#10251f] sm:p-5 lg:p-7">
      <section className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-[1500px] flex-col overflow-hidden rounded-[1.75rem] border border-black/8 bg-[#faf9f6] shadow-[0_30px_90px_rgba(18,50,41,0.14)]">
        <header className="flex flex-col gap-4 border-b border-[#dfe3df] px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-9">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5f706a]">
                Mock interview room
              </p>
              <span className="h-1 w-1 rounded-full bg-[#aab4b0]" aria-hidden="true" />
              <p className="truncate text-xs font-medium text-[#66756f]">
                {state.context.market}
              </p>
            </div>
            <h1 className="mt-1 truncate text-[clamp(1.35rem,3vw,2rem)] font-semibold tracking-[-0.035em] text-[#071512]">
              {state.context.role}
              {state.context.company ? ` at ${state.context.company}` : ""}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4" aria-live="polite">
            <span
              className={`inline-flex items-center gap-2 font-semibold ${
                interviewLive ? "text-[#ad2727]" : "text-[#5d6c67]"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {interviewLive ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d43838] opacity-50" />
                ) : null}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    interviewLive ? "bg-[#d43838]" : "bg-[#9ca8a4]"
                  }`}
                />
              </span>
              {interviewLive ? "Live" : statusLabel}
            </span>
            <span className="h-5 w-px bg-[#d7ddda]" aria-hidden="true" />
            <span className="font-mono font-semibold tabular-nums text-[#152a23]">
              {formatClock(elapsedSeconds)}
            </span>
            <span className="h-5 w-px bg-[#d7ddda]" aria-hidden="true" />
            <span className="text-[#66756f]">
              {state.progress.answeredTurns} of {state.progress.totalTurns}
            </span>
            {!interviewLive && !controlsLocked ? (
              <Link
                href={`/interviews/${state.session.id}/prepare`}
                className="ml-auto font-semibold text-[#173a32] underline decoration-[#9aaba5] underline-offset-4 transition hover:decoration-[#173a32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7a84f] lg:ml-1"
              >
                Back to prep
              </Link>
            ) : null}
            {interviewLive ? (
              <button
                type="button"
                onClick={() => void interruptInterview()}
                className="font-semibold text-[#5d6c67] underline decoration-[#aeb8b4] underline-offset-4 transition hover:text-[#173a32] hover:decoration-[#173a32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7a84f]"
              >
                Pause
              </button>
            ) : null}
          </div>
        </header>

        <div className="relative flex flex-1 flex-col overflow-hidden bg-[#073d34] px-3 pb-5 pt-4 sm:px-5 sm:pb-6 lg:px-7 lg:pb-7 lg:pt-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(116,163,145,0.24), transparent 40%), radial-gradient(circle at 8% 100%, rgba(215,168,79,0.10), transparent 34%)",
            }}
            aria-hidden="true"
          />

          <div className="relative grid flex-1 gap-3 md:grid-cols-2 lg:gap-5">
            <article
              className={`relative min-h-[290px] overflow-hidden rounded-[1.35rem] border bg-[#17352e] transition-[border-color,box-shadow,transform] duration-300 md:min-h-[420px] ${
                interviewerSpeaking
                  ? "border-[#d4eea8] shadow-[0_0_0_3px_rgba(212,238,168,0.24),0_0_48px_rgba(185,224,132,0.34)]"
                  : "border-white/16 shadow-[0_20px_55px_rgba(0,22,19,0.3)]"
              }`}
            >
              <Image
                src="/officer-avatar-realistic.png"
                alt="AI mock interviewer in a professional office"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />

              {interviewerSpeaking ? (
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#e2f2c8] px-3 py-2 text-xs font-bold text-[#173a24] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                  <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                    {[6, 11, 8].map((height) => (
                      <span
                        key={height}
                        className="w-0.5 animate-pulse rounded-full bg-[#285c38]"
                        style={{ height }}
                      />
                    ))}
                  </span>
                  Speaking
                </div>
              ) : null}

              <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-white backdrop-blur-md">
                <p className="font-semibold">AI interviewer</p>
                <p className="mt-0.5 truncate text-xs text-white/72">
                  {state.context.title}
                </p>
              </div>

              {(status === "idle" || status === "failed") && !state.progress.isComplete ? (
                <div className="absolute inset-0 grid place-items-center bg-[#061d19]/34 px-6 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={() => void connect()}
                    disabled={!state.progress.canConnect}
                    className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-[#f4f1e8] py-2 pl-6 pr-2 text-sm font-bold text-[#10251f] shadow-[0_16px_40px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7a84f]"
                  >
                    {status === "failed" ? "Reconnect interview" : "Enter interview"}
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0b4b40] text-white transition group-hover:bg-[#073d34]">
                      {status === "failed" ? (
                        <RotateCcw className="h-4 w-4" strokeWidth={1.9} />
                      ) : (
                        <Volume2 className="h-4 w-4" strokeWidth={1.9} />
                      )}
                    </span>
                  </button>
                </div>
              ) : null}
            </article>

            <article
              className={`relative min-h-[290px] overflow-hidden rounded-[1.35rem] border bg-[#dce6e0] transition-[border-color,box-shadow,transform] duration-300 md:min-h-[420px] ${
                candidateSpeaking
                  ? "border-[#d4eea8] shadow-[0_0_0_3px_rgba(212,238,168,0.24),0_0_48px_rgba(185,224,132,0.34)]"
                  : "border-white/16 shadow-[0_20px_55px_rgba(0,22,19,0.3)]"
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="Your private camera preview"
                className={
                  cameraOn
                    ? "h-full w-full object-cover [transform:scaleX(-1)]"
                    : "hidden"
                }
              />
              {!cameraOn ? (
                <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,#edf2ee,#cddbd4)]">
                  <div className="text-center">
                    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#0b4b40] text-white shadow-[0_20px_48px_rgba(7,61,52,0.26)]">
                      <CameraOff className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#385048]">Camera off</p>
                  </div>
                </div>
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />

              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/38 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.7} />
                Local preview only
              </div>

              {candidateSpeaking ? (
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#e2f2c8] px-3 py-2 text-xs font-bold text-[#173a24] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                  <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                    {[6, 11, 8].map((height) => (
                      <span
                        key={height}
                        className="w-0.5 animate-pulse rounded-full bg-[#285c38]"
                        style={{ height }}
                      />
                    ))}
                  </span>
                  Speaking
                </div>
              ) : null}

              <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-white backdrop-blur-md">
                <p className="font-semibold">You</p>
                <p className="mt-0.5 text-xs text-white/72">
                  {microphoneMuted
                    ? "Microphone muted"
                    : cameraOn
                      ? "Camera on"
                      : "Camera off"}
                </p>
              </div>
            </article>
          </div>

          {error || cameraNotice ? (
            <div
              role={error ? "alert" : "status"}
              className={`relative mx-auto mt-4 flex w-full max-w-2xl items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
                error
                  ? "border-[#ffb4a8]/35 bg-[#491711]/70 text-[#ffe4df]"
                  : "border-white/12 bg-black/24 text-white/78"
              }`}
            >
              {error ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.8} />
              ) : (
                <CameraOff className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.8} />
              )}
              <span>{error || cameraNotice}</span>
              {error && status === "failed" && candidateTranscriptsRef.current.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setFinalizationRetryToken((token) => token + 1)}
                  className="ml-auto flex-none font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Retry save
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="relative mt-5 flex items-start justify-center gap-3 sm:gap-5">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleMicrophone}
                disabled={!interviewLive || controlsLocked}
                className={`grid h-14 w-14 place-items-center rounded-full border text-white transition duration-200 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7a84f] ${
                  microphoneMuted
                    ? "border-[#f09a8f]/45 bg-[#9d332b]"
                    : "border-white/18 bg-white/10 hover:bg-white/16"
                }`}
                aria-label={microphoneMuted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={microphoneMuted}
              >
                {microphoneMuted ? (
                  <MicOff className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <Mic className="h-5 w-5" strokeWidth={1.8} />
                )}
              </button>
              <span className="text-xs font-medium text-white/72">
                {microphoneMuted ? "Unmute" : "Mute"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleCamera()}
                disabled={controlsLocked}
                className="grid h-14 w-14 place-items-center rounded-full border border-white/18 bg-white/10 text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/16 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7a84f]"
                aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
                aria-pressed={cameraOn}
              >
                {cameraOn ? (
                  <CameraOff className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <Camera className="h-5 w-5" strokeWidth={1.8} />
                )}
              </button>
              <span className="text-xs font-medium text-white/72">
                {cameraOn ? "Stop video" : "Start video"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setEndDialogOpen(true)}
                disabled={!interviewLive || controlsLocked}
                className="grid h-14 w-14 place-items-center rounded-full bg-[#e24d47] text-white shadow-[0_13px_28px_rgba(226,77,71,0.32)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#cf403b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd0cb]"
                aria-label="End interview"
              >
                <PhoneOff className="h-5 w-5" strokeWidth={2} />
              </button>
              <span className="text-xs font-medium text-white/72">End interview</span>
            </div>
          </div>

          <div className="relative mx-auto mt-4 flex w-full max-w-3xl items-center gap-3 text-xs text-white/58">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[#d7a84f] transition-[width] duration-500"
                style={{ width: `${state.progress.percent}%` }}
              />
            </div>
            <span className="whitespace-nowrap">{formatClock(remainingSeconds)} left</span>
          </div>
        </div>
      </section>

      {endDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-interview-title"
          className="fixed inset-0 z-50 grid place-items-center bg-[#071512]/48 px-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/70 bg-[#faf9f6] p-6 shadow-[0_28px_90px_rgba(7,21,18,0.28)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6420]">
                  Leave interview room
                </p>
                <h2 id="end-interview-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                  End this interview?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEndDialogOpen(false)}
                className="grid h-10 w-10 flex-none place-items-center rounded-full border border-[#d9dfdc] transition hover:bg-[#eef1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b4b40]"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#5a6a64]">
              Your microphone and local camera preview will stop. We’ll save the
              transcript captured so far and prepare your report.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEndDialogOpen(false)}
                className="min-h-12 rounded-full border border-[#cdd6d2] px-5 text-sm font-semibold transition hover:bg-[#eef1ee] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b4b40]"
              >
                Keep practicing
              </button>
              <button
                type="button"
                onClick={() => {
                  setEndDialogOpen(false);
                  requestCompletion("candidate_ended_interview");
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d9433e] px-5 text-sm font-semibold text-white transition hover:bg-[#c43833] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9433e]"
              >
                <PhoneOff className="h-4 w-4" strokeWidth={2} />
                End interview
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {soundBlocked ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-dialog-title"
          className="fixed inset-0 z-[60] grid place-items-center bg-[#071512]/48 px-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/70 bg-[#faf9f6] p-6 text-center shadow-[0_28px_90px_rgba(7,21,18,0.28)]">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e8eee9] text-[#0b4b40]">
              <Volume2 className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 id="audio-dialog-title" className="mt-4 text-2xl font-semibold tracking-[-0.035em]">
              Enable interviewer audio
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#5a6a64]">
              Your browser connected successfully. One more tap lets it play the interviewer’s voice.
            </p>
            <button
              type="button"
              onClick={() => void enableInterviewAudio()}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0b4b40] px-6 text-sm font-semibold text-white transition hover:bg-[#073d34] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d7a84f]"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
              Enable audio
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
