import { z } from "zod";

export const RecognitionType = {
  AWARD: "AWARD",
  ACHIEVEMENT: "ACHIEVEMENT",
  CERTIFICATION: "CERTIFICATION",
  DESIGNATION: "DESIGNATION",
  LICENSE: "LICENSE",
  EDUCATION: "EDUCATION",
  MEMBERSHIP: "MEMBERSHIP"
} as const;

export type RecognitionTypeValues = typeof RecognitionType[keyof typeof RecognitionType];

export const ProfessionalRecognitionSchema = z.object({
  ulid: z.string().optional(),
  userUlid: z.string().optional(),
  coachUlid: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required"),
  type: z.enum([
    RecognitionType.AWARD, 
    RecognitionType.ACHIEVEMENT,
    RecognitionType.CERTIFICATION,
    RecognitionType.DESIGNATION,
    RecognitionType.LICENSE,
    RecognitionType.EDUCATION,
    RecognitionType.MEMBERSHIP
  ]),
  description: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  issueDate: z.union([
    z.string(),
    z.date()
  ]).transform(val => typeof val === 'string' ? new Date(val) : val),
  expiryDate: z.union([
    z.string(),
    z.date(),
    z.null()
  ]).nullable().optional()
    .transform(val => val && typeof val === 'string' ? new Date(val) : val),
  verificationUrl: z.string().nullable().optional(),
  isVisible: z.boolean().default(true),
  industryType: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional()
    .transform(val => val && typeof val === 'string' ? new Date(val) : val),
  updatedAt: z.union([z.string(), z.date()]).optional()
    .transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export type ProfessionalRecognition = z.infer<typeof ProfessionalRecognitionSchema>;