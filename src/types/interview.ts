export type QuestionGuidance = string[];

export type AnswerFeedback = string[];

export type QuestionPrompt = {
  question: string;
  question_guidance: QuestionGuidance;
};

export type QuestionAudio =
  | {
      status: "ready";
      provider: string;
      format: "mp3";
      contentType: "audio/mpeg";
      data: ArrayBuffer;
      transcript: string;
    }
  | {
      status: "disabled" | "failed";
      provider?: string;
      error?: string;
    };

export type AnswerEvaluation = {
  answer_summary: string;
  improved_answer: string;
  answer_feedback: AnswerFeedback;
  answerConsistency: number;
  homeTiesStrength: number;
  returnIntentClarity: number;
  financialClarity: number;
  studyPurpose: number;
  composureUnderPressure: number;
  riskFlags: string[];
};

export type InterviewQuestionTurn = {
  question: string;
  question_guidance: QuestionGuidance;
  user_answer: string | null;
  answer_summary: string | null;
  improved_answer: string | null;
  answer_feedback: AnswerFeedback | null;
};

export type InterviewMessageMetadata = Partial<QuestionPrompt> &
  Partial<AnswerEvaluation> & {
    feedback?: string;
  };
