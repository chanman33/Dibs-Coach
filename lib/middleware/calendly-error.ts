import { NextResponse } from 'next/server'

export class CalendlyError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'CalendlyError'
  }
}

export function handleCalendlyError(error: unknown) {
  console.error('[CALENDLY_ERROR]', error)

  if (error instanceof CalendlyError) {
    return new NextResponse(error.message, { 
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }

  // Handle Calendly API specific errors
  if (error instanceof Response) {
    const status = error.status
    switch (status) {
      case 401:
        return new NextResponse('Calendly authentication failed', { status: 401 })
      case 403:
        return new NextResponse('Calendly access forbidden', { status: 403 })
      case 404:
        return new NextResponse('Calendly resource not found', { status: 404 })
      case 429:
        return new NextResponse('Calendly rate limit exceeded', { status: 429 })
      default:
        return new NextResponse('Calendly API error', { status })
    }
  }

  // Handle other errors
  if (error instanceof Error) {
    // Log detailed error info in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[CALENDLY_ERROR_DETAILS]', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }

    return new NextResponse(error.message, { status: 500 })
  }

  // Handle unknown errors
  return new NextResponse('An unknown error occurred', { status: 500 })
}

// Error helper functions
export function throwUnauthorized(message = 'Unauthorized') {
  throw new CalendlyError(message, 401)
}

export function throwForbidden(message = 'Access denied') {
  throw new CalendlyError(message, 403)
}

export function throwNotFound(message = 'Resource not found') {
  throw new CalendlyError(message, 404)
}

export function throwBadRequest(message = 'Invalid request') {
  throw new CalendlyError(message, 400)
}

export function throwServerError(message = 'Internal server error') {
  throw new CalendlyError(message, 500)
} 