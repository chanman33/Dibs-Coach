import { z } from "zod";
import { PaymentStatus, Currency } from "@prisma/client";

export const paymentSchema = z.object({
  id: z.number().describe("Internal database ID"),
  sessionId: z.number().nullable(),
  payerDbId: z.number(),
  payeeDbId: z.number(),
  amount: z.number(),
  currency: z.nativeEnum(Currency).default("USD"),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  stripePaymentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const paymentCreateSchema = z.object({
  sessionId: z.number(),
  payerDbId: z.number(),
  payeeDbId: z.number(),
  amount: z.number(),
  currency: z.nativeEnum(Currency).default("USD"),
});

export const paymentUpdateSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  stripePaymentId: z.string().optional(),
});

// Type exports
export type Payment = z.infer<typeof paymentSchema>;
export type PaymentCreate = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>; 