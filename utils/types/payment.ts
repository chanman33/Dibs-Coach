import { z } from "zod";
// import { PaymentStatus, Currency } from "@prisma/client"; // Remove this line

// PaymentStatus Enum
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
const zodPaymentStatusEnum = z.enum(Object.values(PAYMENT_STATUS) as [string, ...string[]]);

// Currency Enum
export const CURRENCY = {
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  CAD: "CAD",
} as const;
export type Currency = typeof CURRENCY[keyof typeof CURRENCY];
const zodCurrencyEnum = z.enum(Object.values(CURRENCY) as [string, ...string[]]);

export const paymentSchema = z.object({
  id: z.number().describe("Internal database ID"),
  sessionId: z.number().nullable(),
  payerDbId: z.number(),
  payeeDbId: z.number(),
  amount: z.number(),
  currency: zodCurrencyEnum.default(CURRENCY.USD),
  status: zodPaymentStatusEnum.default(PAYMENT_STATUS.PENDING),
  stripePaymentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const paymentCreateSchema = z.object({
  sessionId: z.number(),
  payerDbId: z.number(),
  payeeDbId: z.number(),
  amount: z.number(),
  currency: zodCurrencyEnum.default(CURRENCY.USD),
});

export const paymentUpdateSchema = z.object({
  status: zodPaymentStatusEnum.optional(),
  stripePaymentId: z.string().optional(),
});

// Type exports
export type Payment = z.infer<typeof paymentSchema>;
export type PaymentCreate = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>; 