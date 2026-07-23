"use client";

import { Loader2, Mic, MicOff, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type RealtimeInterviewControlsProps = {
  sessionId: string;
  currentQuestion: string;
  initialQuestionsAsked: number;
  disabled?: boolean;
  microphoneMuted?: boolean;
  endRequested?: boolean;
  finalizationRetryToken?: number;
  hideStatus?: boolean;
  onReady: () => void;
  onLiveChange: (live: boolean) => void;
  onSpeakerChange: (speaker: "officer" | "candidate" | null) => void;
  onEnding: () => void;
  onComplete: () => Promise<void>;
  onError: (message: string) => void;
};

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

type TranscriptTurn = { answer: string; nextQuestion: string | null };
type CompletedTranscriptTurn = { question: string; answer: string };

const LIVE_INTERVIEW_OPENING =
  "Good morning. What brings you in today?";
const INTERVIEW_CLOSING = "That concludes the interview.";

export function RealtimeInterviewControls({
  sessionId,
  currentQuestion,
  initialQuestionsAsked,
  disabled,
  microphoneMuted = false,
  endRequested = false,
  finalizationRetryToken = 0,
  hideStatus = false,
  onReady,
  onLiveChange,
  onSpeakerChange,
  onEnding,
  onComplete,
  onError,
}: RealtimeInterviewControlsProps) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelReadyRef = useRef(false);
  const audioPlaybackReadyRef = useRef(false);
  const interviewStartedRef = useRef(false);
  const candidateTranscriptsRef = useRef<string[]>([]);
  const officerQuestionsRef = useRef<string[]>([LIVE_INTERVIEW_OPENING]);
  const pendingInputTranscriptsRef = useRef<string[]>([]);
  const openingQuestionRef = useRef(LIVE_INTERVIEW_OPENING);
  const lastQuestionRef = useRef(LIVE_INTERVIEW_OPENING);
  const completionReasonRef = useRef("candidate_or_officer_completed");
  const initialQuestionRef = useRef(currentQuestion);
  const awaitingInitialQuestionRef = useRef(true);
  const completingRef = useRef(false);
  const finalizingRef = useRef(false);
  const clientEndPendingRef = useRef(false);
  const completedTranscriptReadyRef = useRef(false);
  const closingTimerRef = useRef<number | null>(null);
  const awaitingClosingPlaybackRef = useRef(false);
  const closingPlaybackStartedRef = useRef(false);
  const closingResponseIdRef = useRef<string | null>(null);
  const openingTimerRef = useRef<number | null>(null);
  const openingStartTimerRef = useRef<number | null>(null);
  const openingRetryCountRef = useRef(0);
  const hardStopTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const autoStartedRef = useRef(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [status, setStatus] = useState<
    | "idle"
    | "connecting"
    | "listening"
    | "officer"
    | "processing"
    | "audio-blocked"
    | "concluding"
    | "saving"
    | "failed"
  >("idle");

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // Disconnect is intentionally mount-scoped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    microphoneRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !microphoneMuted;
    });
    if (microphoneMuted) onSpeakerChange(null);
  }, [microphoneMuted, onSpeakerChange]);

  useEffect(() => {
    if (
      !endRequested ||
      !interviewStartedRef.current ||
      completingRef.current ||
      finalizingRef.current
    ) {
      return;
    }

    requestClientCompletion("candidate_ended_interview");
    // Completion is intentionally driven by the parent's one-way end signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endRequested]);

  useEffect(() => {
    if (finalizationRetryToken <= 0 || finalizingRef.current) return;
    onError("");
    if (clientEndPendingRef.current && !completedTranscriptReadyRef.current) {
      completingRef.current = false;
      requestClientCompletion(completionReasonRef.current);
      return;
    }
    void finalizeInterview();
    // Retry is an explicit parent signal and these functions use stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizationRetryToken]);

  function send(event: Record<string, unknown>) {
    if (channelRef.current?.readyState === "open") {
      channelRef.current.send(JSON.stringify(event));
    }
  }

  function clearOpeningSequence() {
    awaitingInitialQuestionRef.current = false;
    if (openingTimerRef.current !== null) {
      window.clearTimeout(openingTimerRef.current);
      openingTimerRef.current = null;
    }
    if (openingStartTimerRef.current !== null) {
      window.clearTimeout(openingStartTimerRef.current);
      openingStartTimerRef.current = null;
    }
  }

  function clearHardStopTimer() {
    if (hardStopTimerRef.current !== null) {
      window.clearTimeout(hardStopTimerRef.current);
      hardStopTimerRef.current = null;
    }
  }

  function stopCurrentOfficerAudio() {
    // Realtime audio can remain buffered after its transcript has completed.
    // Cancel generation first, then clear WebRTC playback as required by the API.
    send({ type: "response.cancel" });
    send({ type: "output_audio_buffer.clear" });
    audioRef.current?.pause();
  }

  function requestClientCompletion(reason: string) {
    if (!interviewStartedRef.current || finalizingRef.current) return;
    clientEndPendingRef.current = true;
    completionReasonRef.current = reason;
    clearOpeningSequence();
    clearHardStopTimer();
    awaitingClosingPlaybackRef.current = false;
    closingPlaybackStartedRef.current = false;
    closingResponseIdRef.current = null;
    microphoneRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    stopCurrentOfficerAudio();
    onSpeakerChange(null);
    onEnding();
    setStatus("concluding");
    send({
      type: "response.create",
      response: {
        instructions:
          "The candidate has ended the interview. Call complete_interview now. Include the complete ordered transcript of every officer question and candidate answer from the entire interview. Do not speak and do not ask another question.",
        tool_choice: "required",
        metadata: { purpose: "manual_completion_transcript" },
      },
    });
    if (closingTimerRef.current !== null) {
      window.clearTimeout(closingTimerRef.current);
    }
    closingTimerRef.current = window.setTimeout(() => {
      closingTimerRef.current = null;
      if (completingRef.current || finalizingRef.current) return;
      setStatus("failed");
      onError("Could not capture the final transcript. Please retry finalization.");
    }, 12_000);
  }

  function disconnect(preserveStatus = false) {
    onSpeakerChange(null);
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
    audioPlaybackReadyRef.current = false;
    interviewStartedRef.current = false;
    clearHardStopTimer();
    if (closingTimerRef.current !== null) {
      window.clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
    clearOpeningSequence();
    awaitingClosingPlaybackRef.current = false;
    closingPlaybackStartedRef.current = false;
    closingResponseIdRef.current = null;
    if (mountedRef.current && !preserveStatus) {
      setStatus("idle");
      onLiveChange(false);
    }
  }

  async function flushTranscript() {
    const turns: TranscriptTurn[] = candidateTranscriptsRef.current.map(
      (answer, index) => ({
        answer,
        nextQuestion: officerQuestionsRef.current[index + 1] ?? null,
      }),
    );
    const response = await fetch(`/api/session/${sessionId}/realtime/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openingQuestion: openingQuestionRef.current,
        completionReason: completionReasonRef.current,
        turns,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not save the final interview transcript.");
    }
  }

  function latestCapturedAnswer(fallback?: string) {
    const captured = pendingInputTranscriptsRef.current.join(" ").trim();
    pendingInputTranscriptsRef.current = [];
    if (captured) return captured;

    const modelFallback = fallback?.trim() || "";
    if (/no spoken answer|has not provided|no latest response/i.test(modelFallback)) {
      return "";
    }
    return modelFallback;
  }

  function appendCandidateTranscript(transcript: string) {
    const normalized = transcript.trim();
    if (!normalized) return;
    if (candidateTranscriptsRef.current.at(-1) !== normalized) {
      candidateTranscriptsRef.current.push(normalized);
    }
  }

  function appendOfficerQuestion(transcript: string) {
    const normalized = transcript.trim();
    if (!normalized) return;
    if (officerQuestionsRef.current.at(-1) !== normalized) {
      officerQuestionsRef.current.push(normalized);
    }
  }

  function applyCompletedTranscript(turns: CompletedTranscriptTurn[]) {
    const normalized = turns
      .map((turn) => ({
        question: turn.question?.trim(),
        answer: turn.answer?.trim(),
      }))
      .filter(
        (turn): turn is CompletedTranscriptTurn =>
          Boolean(turn.question && turn.answer),
      );
    if (normalized.length === 0) return false;
    if (normalized.length < candidateTranscriptsRef.current.length) return false;

    officerQuestionsRef.current = normalized.map((turn) => turn.question);
    if (candidateTranscriptsRef.current.length !== normalized.length) {
      candidateTranscriptsRef.current = normalized.map((turn) => turn.answer);
    }
    openingQuestionRef.current = normalized[0].question;
    lastQuestionRef.current = normalized.at(-1)?.question ?? lastQuestionRef.current;
    completedTranscriptReadyRef.current = true;
    return true;
  }

  async function waitForCapturedAnswer(fallback?: string) {
    // Input transcription can finish shortly after the audio response begins.
    // This wait runs only during transcript bookkeeping, never before playback.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (pendingInputTranscriptsRef.current.length > 0) break;
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    return latestCapturedAnswer(fallback);
  }

  async function finalizeInterview() {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    onEnding();
    setStatus("saving");
    disconnect(true);
    try {
      await flushTranscript();
      await onComplete();
    } catch (error) {
      finalizingRef.current = false;
      completingRef.current = false;
      setStatus("failed");
      onError(
        error instanceof Error
          ? error.message
          : "Could not save the final interview transcript.",
      );
    }
  }

  function beginInterviewWhenReady() {
    if (
      interviewStartedRef.current ||
      !channelReadyRef.current ||
      !audioPlaybackReadyRef.current
    ) {
      return;
    }

    interviewStartedRef.current = true;
    setSoundBlocked(false);
    hardStopTimerRef.current = window.setTimeout(() => {
      hardStopTimerRef.current = null;
      requestClientCompletion("five_minute_time_limit");
    }, 5 * 60 * 1000);

    awaitingInitialQuestionRef.current = true;
    openingRetryCountRef.current = 0;
    initialQuestionRef.current =
      initialQuestionsAsked === 1 ? LIVE_INTERVIEW_OPENING : currentQuestion;
    officerQuestionsRef.current = [initialQuestionRef.current];
    onLiveChange(true);
    onReady();
    openingStartTimerRef.current = window.setTimeout(() => {
      openingStartTimerRef.current = null;
      requestOpeningAudio();
    }, 350);
  }

  async function enableInterviewAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      audioPlaybackReadyRef.current = true;
      beginInterviewWhenReady();
    } catch {
      setStatus("audio-blocked");
      setSoundBlocked(true);
    }
  }

  function repeatCurrentQuestion() {
    const question = lastQuestionRef.current.trim();
    if (!question || completingRef.current || clientEndPendingRef.current) return;
    setStatus("processing");
    send({
      type: "response.create",
      response: {
        instructions: `Repeat exactly this question and nothing else: ${question}`,
        output_modalities: ["audio"],
        tool_choice: "none",
        metadata: { purpose: "spoken_question_repeat" },
      },
    });
  }

  function requestOpeningAudio() {
    if (
      completingRef.current ||
      clientEndPendingRef.current ||
      finalizingRef.current ||
      !awaitingInitialQuestionRef.current
    ) {
      return;
    }
    setStatus("processing");
    lastQuestionRef.current =
      initialQuestionsAsked === 1
        ? LIVE_INTERVIEW_OPENING
        : initialQuestionRef.current;
    send({
      type: "response.create",
      response: {
        instructions:
          initialQuestionsAsked === 1
            ? `Speak exactly this opening and nothing else: ${LIVE_INTERVIEW_OPENING}`
            : `Repeat exactly this pending officer question and nothing else: ${initialQuestionRef.current}`,
        output_modalities: ["audio"],
        tool_choice: "none",
        metadata: { purpose: "spoken_opening" },
      },
    });

    if (openingTimerRef.current !== null) {
      window.clearTimeout(openingTimerRef.current);
    }
    openingTimerRef.current = window.setTimeout(() => {
      openingTimerRef.current = null;
      if (!awaitingInitialQuestionRef.current) return;
      if (openingRetryCountRef.current < 1) {
        openingRetryCountRef.current += 1;
        requestOpeningAudio();
        return;
      }

      disconnect(true);
      setStatus("failed");
      onError("The officer audio did not start. Reconnect the live interview.");
    }, 7_000);
  }

  async function handleEvent(event: RealtimeEvent) {
    if (event.type === "input_audio_buffer.speech_started") {
      if (completingRef.current) return;
      onSpeakerChange("candidate");
      setStatus("listening");
      return;
    }
    if (event.type === "input_audio_buffer.speech_stopped") {
      onSpeakerChange(null);
      return;
    }
    if (event.type === "response.created") {
      const purpose = event.response?.metadata?.purpose;
      if (purpose === "spoken_closing" && awaitingClosingPlaybackRef.current) {
        closingResponseIdRef.current = event.response?.id ?? null;
        return;
      }
      if (completingRef.current || clientEndPendingRef.current) return;
      setStatus("processing");
      if (purpose === "spoken_opening" && openingTimerRef.current !== null) {
        window.clearTimeout(openingTimerRef.current);
        openingRetryCountRef.current = 1;
        openingTimerRef.current = window.setTimeout(() => {
          openingTimerRef.current = null;
          if (!awaitingInitialQuestionRef.current) return;
          disconnect(true);
          setStatus("failed");
          onError("The officer audio did not start. Reconnect the live interview.");
        }, 12_000);
      }
      return;
    }
    if (
      event.type === "response.output_audio.delta" ||
      event.type === "response.audio.delta"
    ) {
      if (!completingRef.current) {
        onSpeakerChange("officer");
        setStatus("officer");
      }
      return;
    }
    if (event.type === "output_audio_buffer.started") {
      if (
        awaitingClosingPlaybackRef.current &&
        (!closingResponseIdRef.current ||
          event.response_id === closingResponseIdRef.current)
      ) {
        closingPlaybackStartedRef.current = true;
        onSpeakerChange("officer");
        setStatus("officer");
        return;
      }
      if (!clientEndPendingRef.current) {
        onSpeakerChange("officer");
        setStatus("officer");
      }
      return;
    }
    if (
      event.type === "output_audio_buffer.stopped" ||
      event.type === "output_audio_buffer.cleared"
    ) {
      if (
        awaitingClosingPlaybackRef.current &&
        closingPlaybackStartedRef.current &&
        (!closingResponseIdRef.current ||
          event.response_id === closingResponseIdRef.current)
      ) {
        awaitingClosingPlaybackRef.current = false;
        closingPlaybackStartedRef.current = false;
        closingResponseIdRef.current = null;
        if (closingTimerRef.current !== null) {
          window.clearTimeout(closingTimerRef.current);
          closingTimerRef.current = null;
        }
        onSpeakerChange(null);
        void finalizeInterview();
        return;
      }
      onSpeakerChange(null);
      if (!completingRef.current && !finalizingRef.current) {
        setStatus("listening");
      }
      return;
    }
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      const transcript = event.transcript?.trim();
      if (transcript && !finalizingRef.current) {
        const previous = pendingInputTranscriptsRef.current.at(-1);
        if (previous !== transcript) pendingInputTranscriptsRef.current.push(transcript);
        appendCandidateTranscript(transcript);
      }
      return;
    }
    if (
      event.type === "response.output_audio_transcript.done" ||
      event.type === "response.audio_transcript.done"
    ) {
      const transcript = event.transcript?.trim();
      if (!transcript) return;

      if (
        awaitingInitialQuestionRef.current &&
        !completingRef.current &&
        !clientEndPendingRef.current
      ) {
        awaitingInitialQuestionRef.current = false;
        if (openingTimerRef.current !== null) {
          window.clearTimeout(openingTimerRef.current);
          openingTimerRef.current = null;
        }
        openingQuestionRef.current = transcript;
        lastQuestionRef.current = transcript;
        officerQuestionsRef.current = [transcript];
        return;
      }
      if (completingRef.current) {
        return;
      }

      appendOfficerQuestion(transcript);
      lastQuestionRef.current = transcript;
      return;
    }
    if (
      event.type === "response.function_call_arguments.done" &&
      event.name === "complete_interview"
    ) {
      if (completingRef.current) return;
      completingRef.current = true;
      clearOpeningSequence();
      clearHardStopTimer();
      if (closingTimerRef.current !== null) {
        window.clearTimeout(closingTimerRef.current);
        closingTimerRef.current = null;
      }
      try {
        const args = JSON.parse(event.arguments || "{}") as {
          reason?: string;
          final_candidate_answer?: string;
          transcript?: CompletedTranscriptTurn[];
        };
        if (!clientEndPendingRef.current && args.reason?.trim()) {
          completionReasonRef.current = args.reason.trim();
        }
        const usedCompletedTranscript = Array.isArray(args.transcript)
          ? applyCompletedTranscript(args.transcript)
          : false;
        const finalAnswer = await waitForCapturedAnswer(args.final_candidate_answer);
        if (!usedCompletedTranscript && finalAnswer) {
          appendCandidateTranscript(finalAnswer);
        }
      } catch {
        // Fall back to an input transcription when available.
      }
      microphoneRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      onSpeakerChange(null);
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
      if (clientEndPendingRef.current) {
        setStatus("concluding");
        void finalizeInterview();
        return;
      }
      awaitingClosingPlaybackRef.current = true;
      closingPlaybackStartedRef.current = false;
      closingResponseIdRef.current = null;
      setStatus("processing");
      send({
        type: "response.create",
        response: {
          instructions: `Say exactly this sentence and nothing else: ${INTERVIEW_CLOSING}`,
          output_modalities: ["audio"],
          tool_choice: "none",
          metadata: { purpose: "spoken_closing" },
        },
      });
      closingTimerRef.current = window.setTimeout(() => {
        closingTimerRef.current = null;
        awaitingClosingPlaybackRef.current = false;
        closingPlaybackStartedRef.current = false;
        closingResponseIdRef.current = null;
        void finalizeInterview();
      }, 10_000);
      return;
    }
    if (event.type === "response.done") {
      if (completingRef.current) return;
      return;
    }
    if (event.type === "error" || event.type === "session.error") {
      // Recoverable Azure protocol errors are not useful to the candidate.
      // Connection and microphone failures are handled separately.
      return;
    }
  }

  async function connect() {
    if (disabled || !["idle", "failed"].includes(status)) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      onError("Live audio is not supported in this browser.");
      return;
    }

    setStatus("connecting");
    onError("");
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
      audio.preload = "auto";
      audio.setAttribute("aria-hidden", "true");
      audio.className = "fixed h-px w-px opacity-0 pointer-events-none";
      document.body.appendChild(audio);
      audioRef.current = audio;
      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        void audio
          .play()
          .then(() => {
            audioPlaybackReadyRef.current = true;
            beginInterviewWhenReady();
          })
          .catch(() => {
            setSoundBlocked(true);
            setStatus("audio-blocked");
          });
      };
      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
          disconnect();
        }
      };

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.addEventListener("message", (message) => {
        try {
          void handleEvent(JSON.parse(message.data) as RealtimeEvent);
        } catch {
          // Ignore malformed non-critical events.
        }
      });

      const open = new Promise<void>((resolve, reject) => {
        channel.addEventListener("open", () => resolve(), { once: true });
        channel.addEventListener("error", () => reject(new Error("The live audio channel failed.")), {
          once: true,
        });
      });
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const response = await fetch(`/api/session/${sessionId}/realtime/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      const answerSdp = await response.text();
      if (!response.ok) {
        let message = "Could not start the live interviewer.";
        try {
          message = JSON.parse(answerSdp).error || message;
        } catch {}
        throw new Error(message);
      }
      await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
      await open;
      channelReadyRef.current = true;
      beginInterviewWhenReady();
    } catch (error) {
      disconnect();
      setStatus("failed");
      onReady();
      onError(error instanceof Error ? error.message : "Could not start the live interviewer.");
    }
  }

  useEffect(() => {
    if (disabled || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void connect();
    // The live interview is the only interview mode and starts on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const label =
    status === "connecting"
      ? "Connecting"
      : status === "officer"
        ? "Officer speaking"
        : status === "processing"
          ? "Live interview"
          : status === "audio-blocked"
            ? "Enable officer audio"
        : status === "listening"
          ? "Listening"
          : status === "concluding"
            ? "Interview complete"
          : status === "saving"
            ? "Preparing report"
            : status === "failed"
              ? "Reconnect live interview"
              : "Starting live interview";

  // The room's Live badge is enough during the sub-second model handoff.
  // Avoid presenting normal realtime generation as a blocking loading state.
  if (status === "processing") return null;

  const active = ["officer", "listening", "processing", "concluding", "saving"].includes(status);

  if (status !== "failed") {
    return (
      <>
      {!hideStatus ? <span
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold ${
          active
            ? "border-primary bg-primary text-primary-contrast"
            : "border-muted-line bg-background text-foreground"
        }`}
        role="status"
        aria-live="polite"
      >
        {status === "connecting" || status === "saving" || status === "concluding" ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
        ) : status === "officer" ? (
          <Radio className="h-4 w-4 animate-pulse" strokeWidth={1.6} />
        ) : status === "listening" ? (
          <Mic className="h-4 w-4" strokeWidth={1.6} />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
        )}
        {label}
      </span> : null}
      {!hideStatus && status === "listening" ? (
        <button
          type="button"
          onClick={repeatCurrentQuestion}
          className="inline-flex min-h-10 items-center rounded-full border border-muted-line bg-background px-3 text-xs font-semibold text-foreground transition duration-300 hover:border-primary/35 hover:bg-primary-soft active:scale-press"
        >
          Repeat question
        </button>
      ) : null}
      {status === "concluding" || status === "saving" ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-primary/20 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-panel-2xl border border-muted-line bg-surface p-7 text-center shadow-shell">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
              <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
            </div>
            <p className="mt-5 text-eyebrow font-bold uppercase tracking-badge text-muted">
              Interview complete
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Your answers have been received
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Please wait while your coaching report is prepared. You do not need to keep speaking.
            </p>
          </div>
        </div>
      ) : null}
      {soundBlocked ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-primary/24 px-5 backdrop-blur-md">
          <div className="w-full max-w-md rounded-panel-2xl border border-white/70 bg-surface p-7 text-center shadow-shell">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
              <MicOff className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <p className="mt-5 text-eyebrow font-bold uppercase tracking-badge text-muted">Audio permission</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Enable the officer’s voice</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Your browser connected, but it has not started the interview audio yet.
            </p>
            <button
              type="button"
              onClick={() => void enableInterviewAudio()}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-contrast transition duration-300 hover:bg-primary/92 active:scale-press"
            >
              Enable audio and enter
            </button>
          </div>
        </div>
      ) : null}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={disabled}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-muted-line bg-background px-4 text-xs font-bold text-foreground transition duration-300 ease-soft hover:border-muted-line-strong disabled:cursor-not-allowed disabled:opacity-55"
    >
      <MicOff className="h-4 w-4" strokeWidth={1.6} />
      {label}
    </button>
  );
}
