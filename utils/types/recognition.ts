import { z } from "zod";

export const RecognitionType = {
  AWARD: "AWARD",
  ACHIEVEMENT: "ACHIEVEMENT"
} as const;

export const CertificationStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED"
} as const;

export const ProfessionalRecognitionSchema = z.object({
  ulid: z.string().optional(),
  userUlid: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  type: z.enum([RecognitionType.AWARD, RecognitionType.ACHIEVEMENT]),
  issuer: z.string().min(1, "Issuer is required"),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date().nullable(),
  description: z.string().nullable(),
  verificationUrl: z.string().url().nullable(),
  certificateUrl: z.string().url().nullable(),
  status: z.enum(Object.values(CertificationStatus) as [string, ...string[]]).default(CertificationStatus.ACTIVE),
  industryType: z.string().nullable(),
  isVisible: z.boolean().default(true),
  coachProfileUlid: z.string().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type ProfessionalRecognition = z.infer<typeof ProfessionalRecognitionSchema>;

export type RecognitionTypeValues = typeof RecognitionType[keyof typeof RecognitionType];
export type CertificationStatusValues = typeof CertificationStatus[keyof typeof CertificationStatus];