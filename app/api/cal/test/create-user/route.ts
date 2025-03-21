import { NextResponse } from 'next/server';
import { calService } from '@/lib/cal/cal-service';
import { env } from '@/lib/env';
import { createAuthClient } from '@/utils/auth';
import { generateUlid } from '@/utils/ulid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    // For test purposes, generate a temporary user ULID
    // In a real scenario, this would be the authenticated user's ULID
    const userUlid = generateUlid();
    
    // Create a new user in the User table for test purposes
    const supabase = createAuthClient();
    const now = new Date().toISOString();
    
    // First create a test user in our database
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert({
        ulid: userUlid,
        userId: `test_${Date.now()}`, // This would be a Clerk ID in production
        email,
        displayName: name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        isCoach: true,
        isMentee: false,
        capabilities: ['COACH'],
        systemRole: 'USER',
        status: 'ACTIVE',
        totalYearsRE: 1,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();
      
    if (userError) {
      console.error('[CREATE_USER_ERROR]', userError);
      return NextResponse.json(
        { error: 'Failed to create test user in database', details: userError },
        { status: 500 }
      );
    }
    
    // Create a Cal.com managed user
    const calUserResponse = await calService.createManagedUser(email, name);
    
    // Save the integration to the database
    const integrationData = await calService.saveCalendarIntegration(userUlid, calUserResponse);
    
    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        calUser: calUserResponse.data.user,
        integration: integrationData
      }
    });
  } catch (error: any) {
    console.error('[CAL_CREATE_USER_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Cal.com user' },
      { status: 500 }
    );
  }
} 