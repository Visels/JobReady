import { z } from "zod";

export const startSessionSchema = z.object({
  visaTypeId: z.string().min(1),
  originCountryId: z.string().min(1),
  onboardingData: z.record(z.string(), z.unknown()).default({}),
  previousRejections: z.string().max(300).default("None, first application"),
  concerns: z.string().max(800).optional(),
  difficulty: z.enum(["Beginner", "Realistic", "Brutal"]).default("Realistic"),
});

export const createInterviewSchema = startSessionSchema;

export const answerSchema = z.object({
  answer: z.string().min(2).max(5000),
});
