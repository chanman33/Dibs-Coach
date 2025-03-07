import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';
import { generateUlid } from '../ulid';
import { SYSTEM_ROLES, USER_CAPABILITIES } from '../roles/roles';
import type { Database } from '@/types/supabase';
import type { SystemRole, UserCapability } from '../roles/roles';

// Error classes
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found in database. UserId: ${userId}`)
    this.name = 'UserNotFoundError'
  }
}

// User context type
export interface UserContext {
  userId: string;          // Clerk ID
  userUlid: string;        // Database ID
  systemRole: SystemRole;
  capabilities: UserCapability[];
  isNewUser: boolean;
}

/**
 * Creates a Supabase client for database operations
 */
function createDbClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false // Disable Supabase auth since we use Clerk
      }
    }
  );
}

/**
 * Creates a user in the database if they don't already exist
 * Uses a single database operation to avoid race conditions
 */
export async function createUserIfNotExists(userId: string): Promise<UserContext> {
  const supabase = createDbClient();
  
  // First, try to get the existing user
  const { data: existingUser, error: lookupError } = await supabase
    .from('User')
    .select('ulid, systemRole, capabilities')
    .eq('userId', userId)
    .single();
    
  // If user exists, return their data
  if (existingUser && !lookupError) {
    return {
      userId,
      userUlid: existingUser.ulid,
      systemRole: existingUser.systemRole as SystemRole,
      capabilities: existingUser.capabilities as UserCapability[],
      isNewUser: false
    };
  }
  
  // If user doesn't exist, get Clerk user data and create them
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const newUserUlid = generateUlid();
    
    // Use upsert with ON CONFLICT DO NOTHING to handle race conditions
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .upsert({
        ulid: newUserUlid,
        userId: userId,
        email: user.emailAddresses[0]?.emailAddress || 'pending@example.com',
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim() 
          : user.emailAddresses[0]?.emailAddress?.split('@')[0],
        profileImageUrl: user.imageUrl,
        systemRole: SYSTEM_ROLES.USER,
        capabilities: [USER_CAPABILITIES.MENTEE],
        isCoach: false,
        isMentee: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { 
        onConflict: 'userId',
        ignoreDuplicates: true 
      })
      .select('ulid, systemRole, capabilities')
      .single();
      
    if (createError) {
      // If there was an error but it's a duplicate, try to get the user one more time
      if (createError.code === '23505') {
        const { data: conflictUser, error: finalLookupError } = await supabase
          .from('User')
          .select('ulid, systemRole, capabilities')
          .eq('userId', userId)
          .single();
          
        if (conflictUser && !finalLookupError) {
          return {
            userId,
            userUlid: conflictUser.ulid,
            systemRole: conflictUser.systemRole as SystemRole,
            capabilities: conflictUser.capabilities as UserCapability[],
            isNewUser: false
          };
        }
      }
      
      throw createError;
    }
    
    if (newUser) {
      return {
        userId,
        userUlid: newUser.ulid,
        systemRole: newUser.systemRole as SystemRole,
        capabilities: newUser.capabilities as UserCapability[],
        isNewUser: true
      };
    }
    
    // If we get here, the user was likely created by another process
    // Try one more lookup
    const { data: finalUser, error: finalError } = await supabase
      .from('User')
      .select('ulid, systemRole, capabilities')
      .eq('userId', userId)
      .single();
      
    if (finalUser && !finalError) {
      return {
        userId,
        userUlid: finalUser.ulid,
        systemRole: finalUser.systemRole as SystemRole,
        capabilities: finalUser.capabilities as UserCapability[],
        isNewUser: false
      };
    }
    
    throw new Error('Failed to create or retrieve user');
  } catch (error) {
    // Always log errors
    console.error('[USER_MANAGEMENT] Error creating user:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Gets a user from the database by their Clerk ID
 */
export async function getUserById(userId: string): Promise<UserContext | null> {
  const supabase = createDbClient();
  
  const { data: user, error } = await supabase
    .from('User')
    .select('ulid, systemRole, capabilities')
    .eq('userId', userId)
    .single();
    
  if (error || !user) {
    return null;
  }
  
  return {
    userId,
    userUlid: user.ulid,
    systemRole: user.systemRole as SystemRole,
    capabilities: user.capabilities as UserCapability[],
    isNewUser: false
  };
} 