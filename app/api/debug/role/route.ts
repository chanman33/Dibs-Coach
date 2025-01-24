import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { sessionClaims } = await auth()
    return NextResponse.json({
      role: sessionClaims?.role,
      metadata: sessionClaims?.metadata,
      userId: sessionClaims?.userId,
      raw: sessionClaims
    })
  } catch (error) {
    console.error('Role debug error:', error)
    return NextResponse.json({ error: 'Failed to get role' }, { status: 500 })
  }
} 