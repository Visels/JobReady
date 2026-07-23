"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PracticeQuestion } from "@prisma/client";
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

type GuideMCQProps = {
  questions: PracticeQuestion[];
  visaType: string;
  practiceHref?: string;
};

export function GuideMCQ({
  questions,
  visaType,
  practiceHref = "/login?callbackUrl=/practice",
}: GuideMCQProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(() => new Set());

  const currentQuestion = questions[currentIndex];
  const isComplete = questions.length > 0 && currentIndex >= questions.length;

  const selectedIsCorrect = useMemo(() => {
    if (!currentQuestion || selectedAnswer === null) return false;
    return selectedAnswer === currentQuestion.correctAnswer;
  }, [currentQuestion, selectedAnswer]);

  function chooseAnswer(option: string) {
    if (!currentQuestion || selectedAnswer !== null) return;

    setSelectedAnswer(option);
    setAnsweredIds((existing) => {
      const next = new Set(existing);
      next.add(currentQuestion.id);
      return next;
    });

    if (option === currentQuestion.correctAnswer) {
      setScore((value) => value + 1);
    }
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    setCurrentIndex((value) => value + 1);
  }

  function resetQuiz() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnsweredIds(new Set());
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d7d0c6] bg-white p-6 text-[#26364a]">
        <p className="text-base font-bold text-[#071512]">
          Practice questions are being prepared for this guide.
        </p>
        <p className="mt-2 text-sm leading-6 text-[#52605b]">
          You can still start a free interview session and answer adaptive AI
          questions for this visa type.
        </p>
        <Link
          href={practiceHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#00533f] px-5 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#043b30] active:scale-press"
        >
          Start session
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </Link>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="rounded-2xl border border-[#d7d0c6] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.06)]">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#00624c]">
          Practice complete
        </p>
        <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#071512]">
          You got {score}/{questions.length} correct.
        </h3>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#52605b]">
          A short quiz can catch the obvious weak spots. A full mock interview
          tests your answer structure, follow-up handling, and consistency under
          pressure.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={practiceHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff4f36] px-6 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
          >
            Practice all {visaType} questions free
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <button
            type="button"
            onClick={resetQuiz}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#bfc8c1] bg-white px-6 text-sm font-bold text-[#00533f] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#f8fbfa] active:scale-press"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#d7d0c6] bg-white p-5 shadow-[0_18px_48px_rgba(29,43,37,0.06)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece6dc] pb-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#00624c]">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#697671]">
            {answeredIds.size} answered
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#edf1ef] sm:w-44">
          <span
            className="block h-full rounded-full bg-[#00533f] transition-all duration-300"
            style={{
              width: `${((currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <h3 className="mt-6 text-2xl font-bold leading-tight tracking-[-0.025em] text-[#071512]">
        {currentQuestion.question}
      </h3>

      <div className="mt-5 grid gap-3">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = currentQuestion.correctAnswer === option;
          const showCorrect = selectedAnswer !== null && isCorrect;
          const showWrong = selectedAnswer !== null && isSelected && !isCorrect;

          return (
            <button
              key={option}
              type="button"
              onClick={() => chooseAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`flex min-h-14 items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left text-sm font-semibold leading-6 transition duration-300 ease-soft active:scale-press ${
                showCorrect
                  ? "border-[#006b4f] bg-[#e5f4ec] text-[#004b3f]"
                  : showWrong
                    ? "border-[#ef513f] bg-[#fff0ec] text-[#8b3d31]"
                    : isSelected
                      ? "border-[#00533f] bg-[#eef5f1] text-[#004b3f]"
                      : "border-[#d9d1c6] bg-[#fbfaf8] text-[#26364a] hover:-translate-y-0.5 hover:border-[#bfc8c1] hover:bg-white"
              }`}
            >
              <span>{option}</span>
              {showCorrect ? (
                <CheckCircle2 className="h-5 w-5 flex-none" strokeWidth={1.8} />
              ) : null}
              {showWrong ? (
                <XCircle className="h-5 w-5 flex-none" strokeWidth={1.8} />
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedAnswer !== null ? (
        <div
          className={`mt-5 rounded-xl border p-4 ${
            selectedIsCorrect
              ? "border-[#b7dfc8] bg-[#f0faf4]"
              : "border-[#f0bab0] bg-[#fff5f2]"
          }`}
        >
          <p className="text-sm font-bold text-[#071512]">
            {selectedIsCorrect ? "Correct" : "Not quite"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#52605b]">
            {currentQuestion.explanation}
          </p>
          <button
            type="button"
            onClick={nextQuestion}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#00533f] px-5 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#043b30] active:scale-press"
          >
            {currentIndex + 1 === questions.length ? "See summary" : "Next question"}
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
