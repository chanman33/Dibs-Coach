import { NextRequest, NextResponse } from 'next/server'
import { generateULID } from '@/utils/ulid'
import { createAuthClient } from '@/utils/auth'
import { withApiAuth } from '@/lib/api'
import { ROLES } from '@/lib/constants'
import { ApiResponse } from '@/utils/types'
import { BrokerResponse, BrokerSchema, BrokerWithTeamsSchema } from '@/utils/types/broker'

export const GET = withApiAuth<BrokerResponse>(async (req: NextRequest) => {
  try {
    const supabase = await createAuthClient()

    // Fetch brokers with their teams
    const { data: brokers, error } = await supabase
      .from('Broker')
      .select(`
        ulid,
        name,
        description,
        logoUrl,
        website,
        status,
        createdAt,
        updatedAt,
        Team (
          ulid,
          name,
          description,
          status,
          createdAt,
          updatedAt
        )
      `)
      .eq('status', 'active')

    if (error) {
      console.error('[BROKER_GET_ERROR]', error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch brokers'
        }
      }, { status: 500 })
    }

    // Transform and validate the data
    const transformedBrokers = brokers.map(broker => ({
      ...broker,
      teams: broker.Team || []
    }))

    const validatedBrokers = transformedBrokers.map(broker => 
      BrokerWithTeamsSchema.parse(broker)
    )

    return NextResponse.json<ApiResponse<BrokerResponse>>({
      data: {
        brokers: validatedBrokers
      },
      error: null
    })
  } catch (error) {
    console.error('[BROKER_GET_ERROR]', error)
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
})

export const POST = withApiAuth<BrokerResponse>(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const validatedData = BrokerSchema.parse(body)

    const supabase = await createAuthClient()
    const now = new Date().toISOString()
    const brokerUlid = generateULID()

    // Create new broker
    const { data: broker, error } = await supabase
      .from('Broker')
      .insert({
        ulid: brokerUlid,
        name: validatedData.name,
        description: validatedData.description,
        logoUrl: validatedData.logoUrl,
        website: validatedData.website,
        status: 'active',
        createdAt: now,
        updatedAt: now
      })
      .select(`
        ulid,
        name,
        description,
        logoUrl,
        website,
        status,
        createdAt,
        updatedAt,
        Team (
          ulid,
          name,
          description,
          status,
          createdAt,
          updatedAt
        )
      `)
      .single()

    if (error) {
      console.error('[BROKER_CREATE_ERROR]', error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create broker'
        }
      }, { status: 500 })
    }

    // Transform and validate the response
    const transformedBroker = {
      ...broker,
      teams: broker.Team || []
    }

    const validatedBroker = BrokerWithTeamsSchema.parse(transformedBroker)

    return NextResponse.json<ApiResponse<BrokerResponse>>({
      data: {
        brokers: [validatedBroker]
      },
      error: null
    })
  } catch (error) {
    console.error('[BROKER_CREATE_ERROR]', error)
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
    }, { status: 500 })
  }
}, { requiredRoles: [ROLES.ADMIN] }) 