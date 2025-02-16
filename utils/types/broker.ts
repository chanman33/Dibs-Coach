import { z } from 'zod'
import { ulidSchema } from './auth'

export const BrokerSchema = z.object({
  ulid: ulidSchema,
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const TeamSchema = z.object({
  ulid: ulidSchema,
  brokerUlid: ulidSchema,
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const BrokerWithTeamsSchema = BrokerSchema.extend({
  teams: z.array(TeamSchema).default([])
})

export type Broker = z.infer<typeof BrokerSchema>
export type Team = z.infer<typeof TeamSchema>
export type BrokerWithTeams = z.infer<typeof BrokerWithTeamsSchema>

export interface BrokerResponse {
  brokers: BrokerWithTeams[]
}

export interface SingleBrokerResponse {
  broker: BrokerWithTeams
} 