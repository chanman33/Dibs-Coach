/**
 * Centralized permission and capability checks
 * This utility standardizes how we check user permissions and capabilities
 * across the application to ensure consistent behavior.
 */

import { createAuthClient } from './auth/auth-client';
import { USER_CAPABILITIES, SYSTEM_ROLES, type UserCapability } from '@/utils/roles/roles';

/**
 * Constants for capability names to avoid typos
 */
export const CAPABILITIES = USER_CAPABILITIES;

type Capability = UserCapability;

/**
 * Check if a user has a specific capability
 * This is the preferred way to check for capabilities in server actions
 */
export async function hasCapability(userUlid: string, capability: Capability): Promise<boolean> {
  const supabase = await createAuthClient();
  
  const { data, error } = await supabase
    .from('User')
    .select('capabilities, isCoach, isMentee, systemRole')
    .eq('ulid', userUlid)
    .single();
    
  if (error || !data) return false;
  
  // Fast path: Check boolean flags first
  if (capability === CAPABILITIES.COACH && data.isCoach) return true;
  if (capability === CAPABILITIES.MENTEE && data.isMentee) return true;
  
  // Admin always has access
  if (data.systemRole === SYSTEM_ROLES.SYSTEM_OWNER || data.systemRole === SYSTEM_ROLES.SYSTEM_MODERATOR) return true;
  
  // Check capabilities array
  return Array.isArray(data.capabilities) && data.capabilities.includes(capability);
}

/**
 * Check if a user can access a specific profile type
 */
export async function canAccessProfileType(
  userUlid: string, 
  profileType: 'REALTOR' | 'INVESTOR' | 'MORTGAGE' | 'COACH'
): Promise<boolean> {
  // Admins can access everything
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from('User')
    .select('systemRole, realEstateDomains')
    .eq('ulid', userUlid)
    .single();
    
  if (error || !data) return false;
  
  if (data.systemRole === SYSTEM_ROLES.SYSTEM_OWNER || data.systemRole === SYSTEM_ROLES.SYSTEM_MODERATOR) {
    return true;
  }
  
  // For regular users, check if they have coach capability
  const isCoach = await hasCapability(userUlid, CAPABILITIES.COACH);
  if (!isCoach) return false;
  
  // Coach profile is a special case - just need coach capability
  if (profileType === 'COACH') return true;
  
  // For domain-specific profiles, check realEstateDomains
  return Array.isArray(data.realEstateDomains) && data.realEstateDomains.includes(profileType);
}

/**
 * Ensure capabilities and boolean flags stay in sync
 * Call this whenever updating a user's capabilities
 */
export async function updateUserCapabilities(
  userUlid: string, 
  capabilities: Capability[]
): Promise<boolean> {
  const supabase = await createAuthClient();
  
  // Determine boolean flags from capabilities
  const isCoach = capabilities.includes(CAPABILITIES.COACH);
  const isMentee = capabilities.includes(CAPABILITIES.MENTEE);
  
  const { error } = await supabase
    .from('User')
    .update({
      capabilities,
      isCoach,
      isMentee,
      updatedAt: new Date().toISOString()
    })
    .eq('ulid', userUlid);
    
  return !error;
}

/**
 * Add a capability to a user
 */
export async function addUserCapability(
  userUlid: string,
  capability: Capability
): Promise<boolean> {
  const supabase = await createAuthClient();
  
  // First get current capabilities
  const { data, error } = await supabase
    .from('User')
    .select('capabilities')
    .eq('ulid', userUlid)
    .single();
    
  if (error || !data) return false;
  
  // If they already have this capability, do nothing
  if (Array.isArray(data.capabilities) && data.capabilities.includes(capability)) {
    return true;
  }
  
  // Add the capability and update flags
  const capabilities = Array.isArray(data.capabilities) 
    ? [...data.capabilities, capability]
    : [capability];
    
  return updateUserCapabilities(userUlid, capabilities as Capability[]);
}

/**
 * Remove a capability from a user
 */
export async function removeUserCapability(
  userUlid: string,
  capability: Capability
): Promise<boolean> {
  const supabase = await createAuthClient();
  
  // First get current capabilities
  const { data, error } = await supabase
    .from('User')
    .select('capabilities')
    .eq('ulid', userUlid)
    .single();
    
  if (error || !data) return false;
  
  // If they don't have this capability, do nothing
  if (!Array.isArray(data.capabilities) || !data.capabilities.includes(capability)) {
    return true;
  }
  
  // Remove the capability and update flags
  const capabilities = Array.isArray(data.capabilities) 
    ? data.capabilities.filter(c => c !== capability)
    : [];
    
  return updateUserCapabilities(userUlid, capabilities as Capability[]);
} 