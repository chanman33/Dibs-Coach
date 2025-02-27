import { z } from "zod";

export const RecognitionType = {
  AWARD: "AWARD",
  ACHIEVEMENT: "ACHIEVEMENT"
} as const;

export const ProfessionalRecognitionSchema = z.object({
  ulid: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  type: z.enum([RecognitionType.AWARD, RecognitionType.ACHIEVEMENT]),
  year: z.number()
    .min(1900, "Year must be valid")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  organization: z.string().nullable(),
  description: z.string().nullable(),
  isVisible: z.boolean().default(true),
  industryType: z.string().nullable(),
  userUlid: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ProfessionalRecognition = z.infer<typeof ProfessionalRecognitionSchema>;

export type RecognitionTypeValues = typeof RecognitionType[keyof typeof RecognitionType];