"use client";

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
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialState.session.durationLimitSeconds,
  );
  const [finalizationRetryToken, setFinalizationRetryToken] = useState(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
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
    if (mountedRef.current && !preserveStatus) {
      setStatus("idle");
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
    send({
      type: "response.create",
      response: {
        instructions: `Ask exactly this selected interview question and nothing else: ${
          state.currentTurn?.question ?? state.turns[0]?.question ?? ""
        }`,
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

  return (
    <main className="min-h-[calc(100dvh-40px)] overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(215,168,79,0.2),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(0,83,63,0.18),transparent_30%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-[#d9cbb8] bg-[#fffaf3] p-5 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7a84f]/20 blur-3xl" />
          <div className="relative">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#956615]">
              Voice interview room
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(2.35rem,5.2vw,5rem)] font-black leading-[0.92] tracking-[-0.075em] text-[#071512] text-balance">
              {state.context.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[#52605b]">
              Speak naturally. The interviewer will ask one selected question at
              a time, then your transcript will be evaluated against the same
              evidence model as the text room.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-[#eadfce] bg-white px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                  Status
                </p>
                <p className="mt-1 text-lg font-black text-[#173a32]">
                  {statusLabel}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-[#eadfce] bg-white px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                  Time left
                </p>
                <p className="mt-1 font-mono text-lg font-black text-[#173a32]">
                  {formatClock(remainingSeconds)}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-[#eadfce] bg-white px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                  Progress
                </p>
                <p className="mt-1 text-lg font-black text-[#173a32]">
                  {state.progress.answeredTurns}/{state.progress.totalTurns}
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-[2rem] border border-[#173a32] bg-[#071512] p-5 text-white shadow-[0_24px_70px_rgba(7,21,18,0.18)]">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#d7a84f]">
                    Current selected question
                  </p>
                  <p className="mt-3 max-w-2xl text-[22px] font-black leading-8 tracking-[-0.04em]">
                    {state.currentTurn?.question ??
                      "All selected questions have been answered."}
                  </p>
                </div>
                <div className="grid gap-2 text-[12px] font-black uppercase tracking-[0.14em] md:w-48">
                  {status === "idle" || status === "failed" ? (
                    <button
                      type="button"
                      onClick={() => void connect()}
                      disabled={!state.progress.canConnect}
                      className="rounded-full bg-[#d7a84f] px-5 py-3 text-[#071512] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#e6b94c] active:scale-press disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {status === "failed" ? "Reconnect" : "Start voice"}
                    </button>
                  ) : null}
                  {["listening", "interviewer", "processing"].includes(status) ? (
                    <button
                      type="button"
                      onClick={() => requestCompletion("candidate_ended_interview")}
                      className="rounded-full border border-white/25 px-5 py-3 text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#d7a84f] active:scale-press"
                    >
                      End interview
                    </button>
                  ) : null}
                  {["listening", "interviewer", "processing", "failed"].includes(
                    status,
                  ) ? (
                    <button
                      type="button"
                      onClick={() => void interruptInterview()}
                      className="rounded-full border border-white/15 px-5 py-3 text-white/76 transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-white/8 active:scale-press"
                    >
                      Pause
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                className="mt-7 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5"
                aria-hidden="true"
              >
                {Array.from({ length: 16 }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2 rounded-full transition duration-500 ${
                      index < Math.ceil((state.progress.percent / 100) * 16)
                        ? "bg-[#d7a84f]"
                        : "bg-white/14"
                    }`}
                  />
                ))}
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-[1.25rem] border border-[#f0b3a4] bg-[#fff2ee] px-4 py-3 text-sm font-semibold leading-6 text-[#8b2d18]"
              >
                {error}
                {status === "failed" ? (
                  <button
                    type="button"
                    onClick={() => setFinalizationRetryToken((token) => token + 1)}
                    className="ml-3 underline underline-offset-4"
                  >
                    Retry save
                  </button>
                ) : null}
              </div>
            ) : null}

            {soundBlocked ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="audio-dialog-title"
                className="fixed inset-0 z-[80] grid place-items-center bg-[#071512]/35 px-5 backdrop-blur-sm"
              >
                <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-[#fffaf3] p-6 text-center shadow-[0_24px_80px_rgba(21,35,29,0.22)]">
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
                    Audio permission
                  </p>
                  <h2
                    id="audio-dialog-title"
                    className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#071512]"
                  >
                    Enable interviewer audio
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#52605b]">
                    Your browser connected, but it needs one more tap before it
                    can play the interviewer voice.
                  </p>
                  <button
                    type="button"
                    onClick={() => void enableInterviewAudio()}
                    className="mt-6 rounded-full bg-[#00533f] px-6 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press"
                  >
                    Enable audio
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
              Context lock
            </p>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl bg-[#f8efe2] p-4">
                <dt className="font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                  Market
                </dt>
                <dd className="mt-1 font-bold text-[#173a32]">
                  {state.context.market}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#f8efe2] p-4">
                <dt className="font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                  Role
                </dt>
                <dd className="mt-1 font-bold text-[#173a32]">
                  {state.context.role}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#f8efe2] p-4">
                <dt className="font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                  Mode
                </dt>
                <dd className="mt-1 font-bold text-[#173a32]">
                  {state.session.focusMode.replaceAll("_", " ")}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-[#52605b]">
              {state.context.safeContextNote}
            </p>
          </section>

          <section className="rounded-[2rem] border border-[#d9cbb8] bg-[#fffaf3] p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
              Retention
            </p>
            <p className="mt-3 text-sm leading-6 text-[#52605b]">
              Raw audio is not stored. Jobready saves ordered transcript text,
              duration, provider usage, and realtime control events only.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                href={`/interviews/${state.session.id}/prepare`}
                className="rounded-full border border-[#d9cbb8] bg-white px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.14em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] active:scale-press"
              >
                Back to prep
              </Link>
              {state.progress.isComplete ? (
                <Link
                  href={`/interviews/${state.session.id}/report`}
                  className="rounded-full bg-[#00533f] px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.14em] text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press"
                >
                  View report
                </Link>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
