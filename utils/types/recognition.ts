import { z } from "zod";

export interface ProfessionalRecognition {
  ulid: string;
  userUlid: string;
  title: string;
  issuer: string;
  dateReceived: Date;
  expiryDate?: Date | null;
  description?: string;
  verificationUrl?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}