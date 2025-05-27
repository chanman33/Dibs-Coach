import { z } from 'zod';

export const CoachRequestStatusEnum = z.enum(["PENDING", "REVIEWED", "MATCHED", "CLOSED"]);
export type CoachRequestStatus = z.infer<typeof CoachRequestStatusEnum>; 