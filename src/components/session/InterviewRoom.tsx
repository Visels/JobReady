"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Sparkles,
  Square,
  AlertTriangle,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RealtimeInterviewControls } from "@/components/session/RealtimeInterviewControls";
import { InterviewPreparingScreen } from "@/components/session/InterviewPreparingScreen";
import { InterviewResultsPreparingScreen } from "@/components/session/InterviewResultsPreparingScreen";

declare global {
  interface SpeechRecognitionResult {
    readonly 0: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
    readonly length: number;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type InterviewMessage = {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  metadata?: unknown;
  createdAt: string | Date;
};

type InterviewRoomProps = {
  sessionId: string;
  applicantName?: string | null;
  visaType: string;
  officerName: string;
  officerTitle: string;
  officerAvatarSrc: string;
  difficulty: string;
  initialMessages: InterviewMessage[];
};

type OfficerAudioStatus = "idle" | "loading" | "playing" | "finished" | "failed";

type OfficerAudioState = {
  questionId: string;
  status: OfficerAudioStatus;
  url: string;
  error: string;
  autoPlayBlocked: boolean;
};

const idleOfficerAudio: OfficerAudioState = {
  questionId: "",
  status: "idle",
  url: "",
  error: "",
  autoPlayBlocked: false,
};

const waveformBars = [22, 30, 38, 28, 44, 34, 24, 40, 32, 46, 28, 36, 42, 30];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function normalizeTextList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export function InterviewRoom({
  sessionId,
  applicantName,
  visaType,
  officerName,
  officerTitle,
  officerAvatarSrc,
  difficulty,
  initialMessages,
}: InterviewRoomProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const answerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const speechTranscriptPreviewRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechFinalRef = useRef("");
  const shouldRestartSpeechRef = useRef(false);
  const speechSessionRef = useRef(0);
  const loadingRef = useRef(false);
  const listeningRef = useRef(false);
  const answerDraftRef = useRef("");
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionAudioUrlRef = useRef("");
  const questionAudioRequestRef = useRef(0);
  const questionAudioStatusRef = useRef<OfficerAudioStatus>("idle");
  const interviewStartedAtRef = useRef<number | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [answerState, setAnswerState] = useState({
    questionId: "",
    value: "",
  });
  const [improvedAnswer, setImprovedAnswer] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState<string[]>([]);
  const [feedbackToastVisible, setFeedbackToastVisible] = useState(false);
  const [feedbackToastExpanded, setFeedbackToastExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraNotice, setCameraNotice] = useState("");
  const [listening, setListening] = useState(false);
  const [listeningSeconds, setListeningSeconds] = useState(0);
  const [interviewElapsedSeconds, setInterviewElapsedSeconds] = useState(0);
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [liveInterviewActive, setLiveInterviewActive] = useState(true);
  const [interviewRoomReady, setInterviewRoomReady] = useState(false);
  const [interviewEnding, setInterviewEnding] = useState(false);
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  const [manualEndRequested, setManualEndRequested] = useState(false);
  const [finalizationRetryToken, setFinalizationRetryToken] = useState(0);
  const [liveSpeaker, setLiveSpeaker] = useState<
    "officer" | "candidate" | null
  >(null);
  const [officerAudio, setOfficerAudio] = useState<OfficerAudioState>(
    idleOfficerAudio,
  );
  const [error, setError] = useState("");

  const currentQuestionMessage = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === "ai"),
    [messages],
  );
  const currentQuestion =
    currentQuestionMessage?.content ?? "Preparing the first question...";
  const currentQuestionId = useMemo(
    () =>
      [...messages].reverse().find((message) => message.role === "ai")?.id ??
      "pending",
    [messages],
  );
  const answer =
    answerState.questionId === currentQuestionId ? answerState.value : "";
  const questionsAsked = messages.filter((message) => message.role === "ai").length;
  const applicantInitial = applicantName?.trim()?.[0]?.toUpperCase() || "A";

  function updateAnswer(value: string) {
    answerDraftRef.current = value;
    setAnswerState({ questionId: currentQuestionId, value });
  }

  function blurActiveElement() {
    if (typeof document === "undefined") return;

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (!interviewRoomReady || interviewEnding) return;
    const startedAt = interviewStartedAtRef.current ?? Date.now();
    interviewStartedAtRef.current = startedAt;
    const interval = window.setInterval(() => {
      setInterviewElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [interviewEnding, interviewRoomReady]);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    questionAudioStatusRef.current = officerAudio.status;
  }, [officerAudio.status]);

  useEffect(() => {
    if (!listening) {
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setListeningSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => window.clearInterval(interval);
  }, [listening]);

  useEffect(() => {
    if (!listening || !speechTranscriptPreviewRef.current) {
      return;
    }

    speechTranscriptPreviewRef.current.scrollTop =
      speechTranscriptPreviewRef.current.scrollHeight;
  }, [answer, listening]);

  useEffect(() => {
    void startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      stopSpeech();
      disposeQuestionAudio();
    };
    // Camera setup is a mount-only browser permission request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stopSpeech();
    speechFinalRef.current = "";
    if (liveInterviewActive) {
      disposeQuestionAudio();
      return;
    }
    void loadQuestionAudio(currentQuestionId);
    // Question audio should restart only when the active question changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionId, liveInterviewActive]);

  function releaseQuestionAudioUrl() {
    if (questionAudioUrlRef.current) {
      URL.revokeObjectURL(questionAudioUrlRef.current);
      questionAudioUrlRef.current = "";
    }
  }

  function disposeQuestionAudio() {
    questionAudioRef.current?.pause();
    questionAudioRef.current = null;
    questionAudioRequestRef.current += 1;
    releaseQuestionAudioUrl();
  }

  function stopQuestionAudio(nextStatus: OfficerAudioStatus = "finished") {
    disposeQuestionAudio();
    setOfficerAudio((current) => ({
      ...current,
      status: nextStatus,
      url: "",
      autoPlayBlocked: false,
    }));
  }

  async function startQuestionAudio(audio: HTMLAudioElement, questionId: string) {
    try {
      await audio.play();
    } catch {
      if (questionAudioRef.current !== audio) return;
      setOfficerAudio((current) =>
        current.questionId === questionId
          ? {
              ...current,
              status: "finished",
              autoPlayBlocked: true,
            }
          : current,
      );
    }
  }

  async function loadQuestionAudio(
    questionId: string,
    options: { autoplay?: boolean; skipLocalCheck?: boolean } = {},
  ) {
    const autoplay = options.autoplay ?? true;
    const questionMessage = currentQuestionMessage;

    questionAudioRef.current?.pause();
    questionAudioRef.current = null;
    releaseQuestionAudioUrl();

    if ((!questionMessage && !options.skipLocalCheck) || questionId === "pending") {
      setOfficerAudio(idleOfficerAudio);
      return;
    }

    const requestId = questionAudioRequestRef.current + 1;
    questionAudioRequestRef.current = requestId;
    setOfficerAudio({
      questionId,
      status: "loading",
      url: "",
      error: "",
      autoPlayBlocked: false,
    });

    try {
      const response = await fetch(`/api/session/${sessionId}/question-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });

      if (questionAudioRequestRef.current !== requestId) return;

      if (response.status === 204) {
        setOfficerAudio({
          questionId,
          status: "idle",
          url: "",
          error: "",
          autoPlayBlocked: false,
        });
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Question audio is unavailable.");
      }

      const audioBlob = await response.blob();
      if (!audioBlob.size) {
        throw new Error("Question audio is unavailable.");
      }

      const url = URL.createObjectURL(audioBlob);
      questionAudioUrlRef.current = url;

      const audio = new Audio(url);
      audio.preload = "auto";
      audio.onplay = () => {
        stopSpeech();
        setOfficerAudio((current) =>
          current.questionId === questionId
            ? { ...current, status: "playing", autoPlayBlocked: false }
            : current,
        );
      };
      audio.onended = () => {
        setOfficerAudio((current) =>
          current.questionId === questionId
            ? { ...current, status: "finished", autoPlayBlocked: false }
            : current,
        );
      };
      audio.onerror = () => {
        setOfficerAudio((current) =>
          current.questionId === questionId
            ? {
                ...current,
                status: "failed",
                error: "Question audio could not be played.",
                autoPlayBlocked: false,
              }
            : current,
        );
      };
      questionAudioRef.current = audio;
      setOfficerAudio({
        questionId,
        status: "loading",
        url,
        error: "",
        autoPlayBlocked: false,
      });

      if (
        autoplay &&
        !answerDraftRef.current.trim() &&
        !listeningRef.current
      ) {
        await startQuestionAudio(audio, questionId);
        return;
      }

      setOfficerAudio({
        questionId,
        status: "finished",
        url,
        error: "",
        autoPlayBlocked: false,
      });
    } catch (caught) {
      if (questionAudioRequestRef.current !== requestId) return;

      setOfficerAudio({
        questionId,
        status: "failed",
        url: "",
        error:
          caught instanceof Error
            ? caught.message
            : "Question audio is unavailable.",
        autoPlayBlocked: false,
      });
    }
  }

  const officerSpeaking =
    liveSpeaker === "officer" || officerAudio.status === "playing";
  const candidateSpeaking = liveSpeaker === "candidate" || listening;
  const listeningDuration = formatDuration(listeningSeconds);

  function chooseTextInstead() {
    stopQuestionAudio("finished");
  }

  function handleLiveChange(active: boolean) {
    if (active) {
      setLiveInterviewActive(true);
      stopSpeech();
      stopQuestionAudio("idle");
      setFeedbackToastVisible(false);
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraNotice("Camera preview is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraNotice("");
      setCameraOn(true);
    } catch {
      setCameraOn(false);
      setCameraNotice("Camera permission was not granted. Avatar mode is active.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function toggleCamera() {
    if (cameraOn) {
      stopCamera();
      return;
    }

    await startCamera();
  }

  function startSpeech() {
    if (loadingRef.current) return;

    if (questionAudioStatusRef.current === "playing") {
      setError("Wait until the officer finishes speaking, then answer.");
      return;
    }

    const SpeechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechApi) {
      setError("Speech input is not supported in this browser.");
      return;
    }

    setError("");
    blurActiveElement();
    speechFinalRef.current = answer.trim();
    shouldRestartSpeechRef.current = true;
    setListeningSeconds(0);
    const sessionId = speechSessionRef.current + 1;
    speechSessionRef.current = sessionId;

    const recognition = new SpeechApi();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      if (speechSessionRef.current !== sessionId) return;

      let finalChunk = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalChunk += `${transcript} `;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalChunk) {
        speechFinalRef.current = `${speechFinalRef.current} ${finalChunk}`
          .replace(/\s+/g, " ")
          .trim();
      }

      updateAnswer([speechFinalRef.current, interimTranscript]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trimStart());
    };
    recognition.onend = () => {
      if (speechSessionRef.current !== sessionId) return;

      recognitionRef.current = null;
      if (shouldRestartSpeechRef.current && !loadingRef.current) {
        window.setTimeout(() => {
          if (
            !recognitionRef.current &&
            shouldRestartSpeechRef.current &&
            !loadingRef.current &&
            speechSessionRef.current === sessionId
          ) {
            startSpeechContinuation(sessionId);
          }
        }, 250);
        return;
      }

      setListening(false);
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setError("Could not start speech input. Please try again.");
    }
  }

  function startSpeechContinuation(sessionId: number) {
    const SpeechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechApi || loadingRef.current || speechSessionRef.current !== sessionId) {
      setListening(false);
      return;
    }

    const recognition = new SpeechApi();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      if (speechSessionRef.current !== sessionId) return;

      let finalChunk = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalChunk += `${transcript} `;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalChunk) {
        speechFinalRef.current = `${speechFinalRef.current} ${finalChunk}`
          .replace(/\s+/g, " ")
          .trim();
      }

      updateAnswer([speechFinalRef.current, interimTranscript]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trimStart());
    };
    recognition.onend = () => {
      if (speechSessionRef.current !== sessionId) return;

      recognitionRef.current = null;
      if (shouldRestartSpeechRef.current && !loadingRef.current) {
        window.setTimeout(() => {
          if (
            !recognitionRef.current &&
            shouldRestartSpeechRef.current &&
            !loadingRef.current &&
            speechSessionRef.current === sessionId
          ) {
            startSpeechContinuation(sessionId);
          }
        }, 250);
        return;
      }

      setListening(false);
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  }

  function toggleSpeech() {
    if (listening) {
      stopSpeech();
      return;
    }

    startSpeech();
  }

  function stopSpeech() {
    blurActiveElement();
    shouldRestartSpeechRef.current = false;
    speechSessionRef.current += 1;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setListeningSeconds(0);
  }

  async function completeSession() {
    setInterviewEnding(true);
    setError("");
    const response = await fetch(`/api/session/${sessionId}/complete`, {
      method: "POST",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Could not complete the interview.");
    }

    router.push(`/session/${sessionId}/report`);
  }

  function endSession() {
    stopSpeech();
    stopQuestionAudio("idle");
    setEndSessionDialogOpen(false);
    setManualEndRequested(true);
  }

  async function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || loading || officerSpeaking || liveInterviewActive) return;

    stopSpeech();
    stopQuestionAudio("idle");
    setLoading(true);
    setLoadingMessage("Submitting your answer...");
    setError("");
    setImprovedAnswer("");
    setAnswerFeedback([]);
    setFeedbackToastVisible(false);
    setFeedbackToastExpanded(false);
    const optimisticAnswerId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      {
        id: optimisticAnswerId,
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      },
    ]);
    updateAnswer("");

    try {
      setLoadingMessage("Preparing the next question...");
      const response = await fetch(`/api/session/${sessionId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: trimmed }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not prepare the next question.");
      }

      if (typeof data.answerId === "string" && data.answerId.trim()) {
        setMessages((current) =>
          current.map((message) =>
            message.id === optimisticAnswerId
              ? { ...message, id: data.answerId }
              : message,
          ),
        );
      }

      if (data.shouldComplete) {
        setLoadingMessage("Generating your final report...");
        await completeSession();
        return;
      }

      if (typeof data.question !== "string" || !data.question.trim()) {
        throw new Error("The next question was not returned.");
      }

      const nextQuestionId =
        typeof data.id === "string" && data.id.trim()
          ? data.id
          : crypto.randomUUID();
      setMessages((current) => [
        ...current,
        {
          id: nextQuestionId,
          role: "ai",
          content: data.question,
          metadata: {
            question_guidance: normalizeTextList(data.question_guidance),
          },
          createdAt: new Date(),
        },
      ]);
      updateAnswer("");
      speechFinalRef.current = "";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }

  return (
    <main className="min-h-viewport px-4 py-6 text-foreground md:px-8">
      {!interviewRoomReady ? <InterviewPreparingScreen stage="connecting" /> : null}
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-primary/12 bg-surface shadow-[0_30px_90px_rgba(0,55,47,0.18)]">
        <header className="flex flex-col gap-5 border-b border-muted-line/80 bg-[#fbfaf7] px-5 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Mock interview room
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-foreground md:text-3xl">
              {visaType}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted lg:justify-end">
            <RealtimeInterviewControls
              sessionId={sessionId}
              currentQuestion={currentQuestion}
              initialQuestionsAsked={questionsAsked}
              disabled={loading}
              microphoneMuted={microphoneMuted}
              endRequested={manualEndRequested}
              finalizationRetryToken={finalizationRetryToken}
              hideStatus
              onReady={() => setInterviewRoomReady(true)}
              onLiveChange={handleLiveChange}
              onSpeakerChange={setLiveSpeaker}
              onEnding={() => {
                setError("");
                setInterviewEnding(true);
                setLiveInterviewActive(false);
                setLiveSpeaker(null);
              }}
              onComplete={completeSession}
              onError={setError}
            />
            <span className="inline-flex items-center gap-2 font-semibold text-red-700">
              {interviewEnding ? (
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.7} />
              ) : (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-55" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
              )}
              {interviewEnding ? "Ended" : "Live"}
            </span>
            <span className="h-5 w-px bg-muted-line" aria-hidden="true" />
            <span className="font-semibold tabular-nums text-foreground">
              {formatDuration(interviewElapsedSeconds)}
            </span>
            <span className="h-5 w-px bg-muted-line" aria-hidden="true" />
            <span>{difficulty}</span>
            <span className="h-5 w-px bg-muted-line" aria-hidden="true" />
            <span className="font-medium text-foreground">Open interview</span>
          </div>
        </header>

        <section className="relative bg-[#073a32] px-4 pb-7 pt-5 md:px-6 md:pb-8 lg:px-8 lg:pt-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              background:
                "radial-gradient(circle at 50% 18%, rgba(158,195,151,0.18), transparent 42%), radial-gradient(circle at 8% 90%, rgba(255,255,255,0.06), transparent 30%)",
            }}
            aria-hidden="true"
          />

          <div className="relative grid gap-4 lg:grid-cols-2 lg:gap-5">
            <article
              className={`relative aspect-[16/10] overflow-hidden rounded-[20px] border bg-[#112b27] transition-[border-color,box-shadow,transform] duration-300 ${
                officerSpeaking
                  ? "border-[#c1e59e] shadow-[0_0_0_2px_rgba(193,229,158,0.24),0_0_40px_rgba(167,215,133,0.32)]"
                  : "border-white/15 shadow-[0_18px_45px_rgba(0,25,22,0.28)]"
              }`}
            >
              <Image
                src={officerAvatarSrc}
                alt={`${officerName}, AI visa interview officer`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/38 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                <CameraOff className="h-4 w-4" strokeWidth={1.6} />
                Profile image
              </div>
              {officerSpeaking ? (
                <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#d7efbd] px-3 py-2 text-xs font-bold text-[#173a24] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                  <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                    {[6, 11, 8].map((height) => (
                      <span key={height} className="w-0.5 animate-pulse rounded-full bg-[#285c38]" style={{ height }} />
                    ))}
                  </span>
                  Speaking
                </div>
              ) : null}
              <div className="absolute bottom-4 left-4 rounded-xl bg-black/55 px-4 py-3 text-white backdrop-blur-md">
                <p className="font-semibold">{officerName}</p>
                <p className="mt-0.5 text-xs text-white/70">{officerTitle}</p>
              </div>
            </article>

            <article
              className={`relative aspect-[16/10] overflow-hidden rounded-[20px] border bg-[#e8ede9] transition-[border-color,box-shadow,transform] duration-300 ${
                candidateSpeaking
                  ? "border-[#c1e59e] shadow-[0_0_0_2px_rgba(193,229,158,0.24),0_0_40px_rgba(167,215,133,0.32)]"
                  : "border-white/15 shadow-[0_18px_45px_rgba(0,25,22,0.28)]"
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={cameraOn ? "h-full w-full object-cover [transform:scaleX(-1)]" : "hidden"}
              />
              {!cameraOn ? (
                <div className="absolute inset-0 grid place-items-center bg-[#dfe9e3]">
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-primary text-4xl font-semibold text-primary-contrast shadow-[0_18px_45px_rgba(0,75,63,0.24)]">
                    {applicantInitial}
                  </div>
                </div>
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
              {candidateSpeaking && !microphoneMuted ? (
                <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#d7efbd] px-3 py-2 text-xs font-bold text-[#173a24] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                  <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                    {[6, 11, 8].map((height) => (
                      <span key={height} className="w-0.5 animate-pulse rounded-full bg-[#285c38]" style={{ height }} />
                    ))}
                  </span>
                  Speaking
                </div>
              ) : null}
              <div className="absolute bottom-4 left-4 rounded-xl bg-black/55 px-4 py-2.5 text-white backdrop-blur-md">
                <p className="font-semibold">You</p>
                <p className="mt-0.5 text-xs text-white/70">
                  {microphoneMuted ? "Microphone muted" : cameraOn ? "Camera on" : "Camera off"}
                </p>
              </div>
            </article>
          </div>

          {error ? (
            <div className="relative mx-auto mt-4 max-w-2xl rounded-xl border border-red-300/30 bg-red-950/35 px-4 py-3 text-center text-sm text-red-100 backdrop-blur-md">
              {error}
            </div>
          ) : null}

          <div className="relative mt-6 flex items-start justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setMicrophoneMuted((current) => !current)}
                disabled={interviewEnding}
                className={`grid h-14 w-14 place-items-center rounded-full border text-white transition duration-200 active:scale-95 disabled:opacity-50 ${
                  microphoneMuted
                    ? "border-white/18 bg-white/16"
                    : "border-white/18 bg-white/10 hover:bg-white/16"
                }`}
                aria-label={microphoneMuted ? "Unmute microphone" : "Mute microphone"}
                title={microphoneMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {microphoneMuted ? (
                  <MicOff className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <Mic className="h-5 w-5" strokeWidth={1.8} />
                )}
              </button>
              <span className="text-xs font-medium text-white/70">
                {microphoneMuted ? "Unmute" : "Mute"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleCamera()}
                disabled={interviewEnding}
                className="grid h-14 w-14 place-items-center rounded-full border border-white/18 bg-white/10 text-white transition duration-200 hover:bg-white/16 active:scale-95 disabled:opacity-50"
                aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
                title={cameraOn ? "Turn camera off" : "Turn camera on"}
              >
                {cameraOn ? (
                  <CameraOff className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <Camera className="h-5 w-5" strokeWidth={1.8} />
                )}
              </button>
              <span className="text-xs font-medium text-white/70">
                {cameraOn ? "Stop video" : "Start video"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setEndSessionDialogOpen(true)}
                disabled={interviewEnding}
                className="grid h-14 w-14 place-items-center rounded-full bg-[#e84f4a] text-white shadow-[0_12px_30px_rgba(232,79,74,0.34)] transition duration-200 hover:bg-[#d94440] active:scale-95 disabled:opacity-50"
                aria-label="End interview"
                title="End interview"
              >
                <PhoneOff className="h-5 w-5" strokeWidth={2} />
              </button>
              <span className="text-xs font-medium text-white/70">End interview</span>
            </div>
          </div>

          {cameraNotice ? (
            <p className="relative mt-4 text-center text-xs text-white/60">{cameraNotice}</p>
          ) : null}
        </section>
      </div>

      <div className="hidden" aria-hidden="true">
        <header className="reveal-up sticky top-5 z-10 flex flex-col gap-3 rounded-shell border border-surface/70 bg-surface/76 p-3 shadow-glass backdrop-blur-2xl md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <p className="text-eyebrow font-semibold uppercase tracking-label text-muted">
              Mock interview room
            </p>
            <h1 className="text-2xl font-semibold">{visaType}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-semibold ${
              interviewEnding
                ? "border-muted-line bg-background text-muted"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {interviewEnding ? (
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.7} />
              ) : (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-55" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
              )}
              {interviewEnding ? "Ended" : "Live"}
            </span>
            <span className="rounded-full border border-muted-line bg-background px-3 py-2 font-semibold tabular-nums text-foreground">
              {formatDuration(interviewElapsedSeconds)}
            </span>
            <span className="rounded-full border border-muted-line bg-background px-3 py-2">
              {difficulty}
            </span>
            <span className="rounded-full border border-muted-line bg-background px-3 py-2 font-semibold text-foreground">
              Open interview
            </span>
            <button
              type="button"
              onClick={() => setEndSessionDialogOpen(true)}
              disabled={interviewEnding}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-muted-line bg-background px-4 text-sm font-semibold text-muted transition duration-300 ease-soft hover:border-muted-line-strong hover:text-foreground active:scale-press"
            >
              End session
            </button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-interview">
          <aside
            className={`reveal-up delay-soft-1 self-start overflow-hidden rounded-shell border bg-surface shadow-shell transition duration-700 ease-soft ${
              officerSpeaking
                ? "border-primary shadow-[0_0_0_1px_var(--color-primary),0_24px_70px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
                : "border-surface/70"
            }`}
          >
            <div className="relative aspect-square overflow-hidden bg-primary">
              <Image
                src={officerAvatarSrc}
                alt={`${officerName}, AI visa interview officer`}
                fill
                sizes="260px"
                priority
                className="object-cover"
              />
              {officerSpeaking ? (
                <div className="absolute left-4 top-4 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-contrast shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-tint" />
                  Speaking
                </div>
              ) : null}
            </div>
            <div className="px-5 pb-6 pt-5">
              <div className="flex justify-center">
                <div
                  className={`officer-wave ${
                    officerSpeaking ? "officer-wave-playing" : ""
                  }`}
                  aria-hidden="true"
                >
                  {waveformBars.map((height, index) => (
                    <span
                      key={`${height}-${index}`}
                      className="officer-wave-bar"
                      style={{
                        animationDelay: `${index * 72}ms`,
                        backgroundColor: "#004b3f",
                        borderRadius: "999px",
                        display: "inline-block",
                        height: `${height}px`,
                        opacity: officerSpeaking ? 0.96 : 0.82,
                        transform: officerSpeaking ? undefined : "scaleY(0.58)",
                        transformOrigin: "center",
                        width: "5px",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Embassy desk
                </span>
                <span className="text-xs font-semibold text-muted">Voice connected</span>
              </div>
              <p className="mt-2 text-lg font-semibold leading-tight">{officerName}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{officerTitle}</p>
            </div>
          </aside>

          <section className="reveal-up delay-soft-2 flex min-h-interview-shell flex-col rounded-shell border border-surface/70 bg-surface/35 p-2 shadow-shell-strong">
            <div className="relative flex min-h-interview-panel flex-1 flex-col overflow-hidden rounded-shell-inner border border-muted-line bg-surface p-5 shadow-inset md:p-6">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="grid h-24 w-24 place-items-center rounded-full border border-primary/20 bg-primary-soft text-primary shadow-inset">
                <Mic className="h-9 w-9" strokeWidth={1.25} />
              </div>
              <p className="mt-7 text-eyebrow font-bold uppercase tracking-label text-muted">
                Embassy interview in progress
              </p>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold leading-snug md:text-3xl">
                Listen to the officer and answer naturally
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                The officer will choose each follow-up from your answers and conclude the interview when enough ground has been covered.
              </p>

              {error ? (
                <div className="mt-4 rounded-panel-lg border border-accent-danger/30 bg-surface px-4 py-3 text-sm text-accent-danger">
                  {error}
                </div>
              ) : null}
            </div>

            {liveInterviewActive ? (
              <div className="mt-5 rounded-panel-2xl border border-primary/20 bg-primary-soft px-6 py-6 text-sm leading-6 text-primary shadow-input">
                <p className="font-bold">Live voice interview in progress</p>
                <p className="mt-1 text-muted">
                  Answer naturally when the officer finishes. Your camera stays on this device and is not sent, recorded, or analyzed.
                </p>
              </div>
            ) : null}

            <form
              onSubmit={submitAnswer}
              className={`mt-5 ${liveInterviewActive ? "hidden" : ""}`}
              aria-hidden={liveInterviewActive}
            >
              {officerSpeaking ? (
                <div className="relative min-h-[220px] overflow-hidden rounded-panel-2xl border border-muted-line bg-[#fbfaf8] px-6 py-6 shadow-input md:min-h-[250px]">
                  <div className="absolute inset-0 bg-surface/45" />
                  <div className="relative flex min-h-[168px] flex-col items-center justify-center text-center md:min-h-[198px]">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-muted text-muted shadow-inset">
                      <Mic className="h-7 w-7 opacity-35" strokeWidth={1.35} />
                    </div>
                    <p className="mt-7 text-lg font-medium italic leading-6 text-muted/55">
                      Officer is speaking...
                    </p>
                    <div
                      className="officer-wave answer-speaking-wave officer-wave-playing mt-5"
                      aria-hidden="true"
                    >
                      {waveformBars.slice(0, 12).map((height, index) => (
                        <span
                          key={`${height}-${index}`}
                          className="officer-wave-bar"
                          style={{
                            animationDelay: `${index * 78}ms`,
                            backgroundColor: "#d8d2ca",
                            borderRadius: "999px",
                            display: "inline-block",
                            height: `${Math.max(8, Math.round(height * 0.35))}px`,
                            opacity: 0.9,
                            transformOrigin: "center",
                            width: "3px",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="relative flex items-end justify-between gap-4">
                    <button
                      type="button"
                      onClick={chooseTextInstead}
                      className="text-sm font-semibold text-muted/45 underline underline-offset-2 transition duration-300 ease-soft hover:text-primary"
                    >
                      type instead
                    </button>
                    <button
                      type="submit"
                      disabled
                      className="group inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-3 rounded-full bg-primary/14 py-1.5 pl-6 pr-1.5 text-sm font-bold text-primary/35"
                    >
                      Send answer
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/24">
                        <Send className="h-4 w-4" strokeWidth={1.35} />
                      </span>
                    </button>
                  </div>
                </div>
              ) : candidateSpeaking ? (
                <div className="rounded-panel-xl border border-muted-line bg-surface px-6 py-4 text-center shadow-input">
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    className="candidate-mic mx-auto grid h-24 w-24 place-items-center rounded-full text-primary-contrast transition duration-300 ease-soft active:scale-press"
                    aria-label="Stop listening"
                    title="Stop listening"
                  >
                    <span className="candidate-mic-ring candidate-mic-ring-one" />
                    <span className="candidate-mic-ring candidate-mic-ring-two" />
                    <span className="candidate-mic-ring candidate-mic-ring-three" />
                    <span className="relative grid h-16 w-16 place-items-center rounded-full bg-primary shadow-avatar">
                      <Mic className="h-7 w-7" strokeWidth={1.65} />
                    </span>
                  </button>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    Listening...
                  </p>
                  <p className="mt-1 text-sm font-semibold text-muted">
                    Tap mic to mute
                  </p>
                  <div
                    className="officer-wave candidate-answer-wave officer-wave-playing mt-2"
                    aria-hidden="true"
                  >
                    {waveformBars.slice(0, 12).map((height, index) => (
                      <span
                        key={`${height}-${index}`}
                        className="officer-wave-bar"
                        style={{
                          animationDelay: `${index * 78}ms`,
                          backgroundColor: "#004b3f",
                          borderRadius: "999px",
                          display: "inline-block",
                          height: `${Math.max(9, Math.round(height * 0.42))}px`,
                          opacity: 0.95,
                          transformOrigin: "center",
                          width: "3px",
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-muted">
                    {listeningDuration}
                  </p>
                  {answer.trim() ? (
                    <div
                      ref={speechTranscriptPreviewRef}
                      className="mx-auto mt-3 max-h-16 max-w-xl overflow-y-auto whitespace-pre-wrap break-words rounded-panel-lg border border-muted-line bg-surface px-4 py-2 text-left text-sm leading-6 text-muted"
                    >
                      {answer}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        stopSpeech();
                      }}
                      className="text-sm font-semibold text-muted underline underline-offset-2 transition duration-300 ease-soft hover:text-primary"
                    >
                      type instead
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !answer.trim()}
                      className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-sm font-bold text-primary-contrast transition duration-500 ease-soft hover:bg-accent-strong active:scale-press disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {loading ? "Preparing question" : "Send answer"}
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/12 transition duration-700 ease-soft group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105">
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.35} />
                        ) : (
                          <Send className="h-4 w-4" strokeWidth={1.35} />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    ref={answerTextareaRef}
                    value={answer}
                    onChange={(event) => updateAnswer(event.target.value)}
                    rows={4}
                    placeholder="Answer naturally, as you would in the interview."
                    className="w-full resize-none rounded-panel-xl border border-muted-line bg-surface px-4 py-3 text-sm caret-primary outline-none shadow-input transition duration-700 ease-soft focus:border-accent focus:ring-4 focus:ring-accent/10"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={toggleSpeech}
                        disabled={loading}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition duration-700 ease-soft active:scale-press ${
                          listening
                            ? "border-primary bg-primary text-primary-contrast"
                            : "border-muted-line bg-surface text-foreground hover:-translate-y-0.5 hover:border-muted-line-strong"
                        }`}
                        title={listening ? "Stop listening" : "Start microphone"}
                        aria-label={listening ? "Stop listening" : "Start microphone"}
                      >
                        {listening ? (
                          <Mic className="h-4 w-4" strokeWidth={1.35} />
                        ) : (
                          <MicOff className="h-4 w-4" strokeWidth={1.35} />
                        )}
                        {listening ? "Listening" : "Mic"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopSpeech();
                          speechFinalRef.current = "";
                          updateAnswer("");
                        }}
                        disabled={loading}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-muted-line bg-surface transition duration-700 ease-soft hover:-translate-y-0.5 hover:border-muted-line-strong active:scale-press"
                        title="Clear answer"
                        aria-label="Clear answer"
                      >
                        <Square className="h-4 w-4" strokeWidth={1.35} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !answer.trim()}
                      className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-sm font-bold text-primary-contrast transition duration-500 ease-soft hover:bg-accent-strong active:scale-press disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {loading ? "Preparing question" : "Send answer"}
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/12 transition duration-700 ease-soft group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105">
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.35} />
                        ) : (
                          <Send className="h-4 w-4" strokeWidth={1.35} />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </form>
            {loading ? (
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-0 z-20 flex items-center justify-center bg-surface/88 px-6 backdrop-blur-sm"
              >
                <div className="w-full max-w-md rounded-panel-2xl border border-muted-line bg-background px-6 py-7 text-center shadow-shell">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
                    <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.45} />
                  </div>
                  <p className="mt-5 text-eyebrow font-bold uppercase tracking-badge text-muted">
                    Interview update
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {loadingMessage || "Preparing the next turn..."}
                  </p>
                  <div className="mx-auto mt-5 grid max-w-xs grid-cols-4 gap-2">
                    {[
                      "Submit",
                      "Score",
                      "Question",
                      "Ready",
                    ].map((step, index) => (
                      <span
                        key={step}
                        className="h-1.5 rounded-full bg-primary/20 transition-colors duration-500 ease-soft"
                        style={{
                          backgroundColor:
                            (loadingMessage.includes("Submitting") && index <= 0) ||
                            (loadingMessage.includes("Evaluating") && index <= 1) ||
                            (loadingMessage.includes("Generating your final report") &&
                              index <= 1) ||
                            (loadingMessage.includes("Preparing the next question") &&
                              index <= 3) ||
                            (loadingMessage.includes("Preparing the question") &&
                              index <= 3)
                              ? "#004b3f"
                              : undefined,
                        }}
                        aria-label={step}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    Hold tight. The next officer question will start as soon as it is ready.
                  </p>
                </div>
              </div>
            ) : null}
            </div>
          </section>

          <aside
            className={`reveal-up delay-soft-3 self-start rounded-shell border bg-surface/35 p-2 shadow-shell transition duration-700 ease-soft ${
              candidateSpeaking
                ? "border-surface/70 shadow-[0_24px_70px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
                : "border-surface/70"
            }`}
          >
            <div className="rounded-shell-inner border border-muted-line bg-surface p-4 shadow-inset">
            <div
              className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-shell-lg border bg-background transition duration-700 ease-soft ${
                candidateSpeaking ? "border-primary" : "border-muted-line"
              }`}
            >
              <video
                autoPlay
                muted
                playsInline
                className={cameraOn ? "h-full w-full object-cover" : "hidden"}
              />
              {!cameraOn ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl font-semibold text-primary-contrast shadow-avatar">
                  {applicantInitial}
                </div>
              ) : null}
              {candidateSpeaking ? (
                <div className="absolute left-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-bold text-primary-contrast shadow-[0_8px_18px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
                  <span className="h-2 w-2 rounded-full bg-primary-tint" />
                  Speaking
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">You</p>
                <p className="text-sm text-muted">
                  {candidateSpeaking
                    ? `Listening ${listeningDuration}`
                    : cameraOn
                      ? "Camera on"
                      : "Avatar mode"}
                </p>
                {cameraNotice ? (
                  <p className="mt-1 text-xs leading-5 text-muted">{cameraNotice}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={toggleCamera}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-muted-line bg-surface transition duration-700 ease-soft hover:-translate-y-0.5 hover:border-muted-line-strong active:scale-press"
                title={cameraOn ? "Turn camera off" : "Turn camera on"}
                aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              >
                {cameraOn ? (
                  <CameraOff className="h-4 w-4" strokeWidth={1.35} />
                ) : (
                  <Camera className="h-4 w-4" strokeWidth={1.35} />
                )}
              </button>
            </div>
            </div>
          </aside>
        </section>
      </div>

      {interviewEnding ? (
        <InterviewResultsPreparingScreen
          error={error}
          onRetry={() => {
            setError("");
            setFinalizationRetryToken((token) => token + 1);
          }}
        />
      ) : null}

      {endSessionDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-session-title"
          className="fixed inset-0 z-50 grid place-items-center bg-primary/16 px-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-panel-2xl border border-muted-line bg-surface p-5 shadow-shell">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent-surface text-accent-danger">
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-eyebrow font-bold uppercase tracking-badge text-muted">
                    End session
                  </p>
                  <h2
                    id="end-session-title"
                    className="mt-1 text-xl font-semibold text-foreground"
                  >
                    End this interview?
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEndSessionDialogOpen(false)}
                className="grid h-9 w-9 flex-none place-items-center rounded-full border border-muted-line bg-surface transition duration-300 ease-soft hover:border-muted-line-strong active:scale-press"
                aria-label="Close end session dialog"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-5 rounded-panel-lg border border-[#f3c766]/45 bg-[#fff7db] px-4 py-3 text-sm font-normal leading-6 text-[#6f4a00]/80">
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#c98600]" />
                  <span>Your microphone and camera will stop immediately.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#c98600]" />
                  <span>We will save the transcript and prepare your coaching report.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEndSessionDialogOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-muted-line bg-surface px-5 text-sm font-bold text-foreground transition duration-300 ease-soft hover:border-muted-line-strong active:scale-press"
              >
                Continue interview
              </button>
              <button
                type="button"
                onClick={endSession}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-contrast transition duration-300 ease-soft hover:bg-primary/92 active:scale-press"
              >
                End interview
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackToastVisible && (improvedAnswer || answerFeedback.length > 0) ? (
        <aside className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-primary/15 bg-surface shadow-[0_20px_60px_rgba(0,55,47,0.18)] md:bottom-6 md:right-6">
          <div className="flex items-center gap-2 border-b border-muted-line/70 bg-primary-soft/80 px-3 py-2.5">
            <button
              type="button"
              onClick={() => setFeedbackToastExpanded((current) => !current)}
              aria-expanded={feedbackToastExpanded}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary text-primary-contrast">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.6} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-primary">
                  Previous answer feedback
                </span>
                <span className="block truncate text-xs text-muted">
                  Review, then compare
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFeedbackToastExpanded((current) => !current)}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-primary transition duration-300 ease-soft hover:bg-primary/10"
              aria-label={feedbackToastExpanded ? "Collapse feedback" : "Expand feedback"}
            >
              <ChevronDown
                className={`h-4 w-4 transition duration-300 ease-soft ${
                  feedbackToastExpanded ? "rotate-180" : ""
                }`}
                strokeWidth={1.6}
              />
            </button>
            <button
              type="button"
              onClick={() => setFeedbackToastVisible(false)}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-muted transition duration-300 ease-soft hover:bg-accent-surface hover:text-accent-danger"
              aria-label="Close feedback"
            >
              <X className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </div>

          {feedbackToastExpanded ? (
            <div className="grid max-h-[52vh] gap-4 overflow-auto px-4 py-4 text-sm leading-6">
              {answerFeedback.length > 0 ? (
                <section>
                  <p className="font-bold text-foreground">
                    What worked and what was missing
                  </p>
                  <ul className="mt-2 space-y-2 text-muted">
                    {answerFeedback.map((tip) => (
                      <li key={tip} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {improvedAnswer ? (
                <section className="rounded-xl border border-primary/15 bg-primary-soft px-4 py-3">
                  <p className="font-bold text-primary">Best answer</p>
                  <p className="mt-1 text-muted">{improvedAnswer}</p>
                </section>
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}
    </main>
  );
}
