'use server'

import { createAuthClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ulid } from 'ulid'
import { 
  organizationSchema, 
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationMemberSchema,
  addOrganizationMemberSchema,
  updateOrganizationMemberSchema,
  removeOrganizationMemberSchema,
  OrgStatus,
  Organization
} from '@/utils/types/organization'
import { z } from 'zod'
import { Database } from '@/types/supabase'

type OrganizationWithMemberCount = Organization & { memberCount: number }

/**
 * Fetch all organizations with basic information and member counts
 */
export async function fetchAllOrganizations() {
  try {
    const supabase = createAuthClient()
    
    // Fetch all organizations
    const { data: organizations, error } = await supabase
      .from('Organization')
      .select('*')
      .order('createdAt', { ascending: false })
    
    if (error) {
      console.error('[FETCH_ALL_ORGANIZATIONS_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    // For each organization, fetch the member count
    const organizationsWithMemberCount = await Promise.all(
      organizations.map(async (org) => {
        const { count, error: countError } = await supabase
          .from('OrganizationMember')
          .select('*', { count: 'exact', head: true })
          .eq('organizationUlid', org.ulid)
          .eq('status', 'ACTIVE')
        
        return {
          ...org,
          memberCount: count || 0
        }
      })
    )
    
    return { data: organizationsWithMemberCount as OrganizationWithMemberCount[], error: null }
  } catch (error) {
    console.error('[FETCH_ALL_ORGANIZATIONS_ERROR]', error)
    return { error: 'Failed to fetch organizations', data: null }
  }
}

/**
 * Fetch a specific organization by ID with detailed information
 */
export async function fetchOrganizationById(orgId: string) {
  try {
    console.log('[FETCH_ORGANIZATION_BY_ID]', { orgId, type: typeof orgId })
    
    if (!orgId || orgId.trim() === '') {
      console.error('[FETCH_ORGANIZATION_BY_ID_ERROR]', 'Invalid orgId provided', orgId)
      return { error: 'Invalid organization ID', data: null }
    }
    
    const supabase = createAuthClient()
    
    // First try with the native .single() method
    console.log('[FETCH_ORGANIZATION_BY_ID] Querying with single()')
    let { data: organization, error } = await supabase
      .from('Organization')
      .select('*')
      .eq('ulid', orgId)
      .single()
    
    if (error) {
      console.error('[FETCH_ORGANIZATION_BY_ID_ERROR]', error)
      
      // If the single() method failed, try again without it
      console.log('[FETCH_ORGANIZATION_BY_ID] Retrying without single()')
      const { data: orgs, error: retryError } = await supabase
        .from('Organization')
        .select('*')
        .eq('ulid', orgId)
      
      if (retryError) {
        console.error('[FETCH_ORGANIZATION_BY_ID_RETRY_ERROR]', retryError)
        return { error: retryError.message, data: null }
      }
      
      if (!orgs || orgs.length === 0) {
        console.error('[FETCH_ORGANIZATION_BY_ID_NOT_FOUND]', { orgId })
        return { error: 'Organization not found', data: null }
      }
      
      console.log('[FETCH_ORGANIZATION_BY_ID_FOUND_ON_RETRY]', { count: orgs.length })
      organization = orgs[0]
    }
    
    // Get the member count
    const { count: memberCount, error: countError } = await supabase
      .from('OrganizationMember')
      .select('*', { count: 'exact', head: true })
      .eq('organizationUlid', orgId)
      .eq('status', 'ACTIVE')
    
    if (countError) {
      console.error('[FETCH_ORGANIZATION_MEMBER_COUNT_ERROR]', countError)
    }
    
    // Return the combined data
    return { 
      error: null, 
      data: { 
        ...organization, 
        memberCount: memberCount || 0 
      }
    }
  } catch (err) {
    console.error('[FETCH_ORGANIZATION_BY_ID_UNEXPECTED_ERROR]', err)
    return { error: 'An unexpected error occurred', data: null }
  }
}

/**
 * Create a new organization and add the user as an owner
 */
export async function createOrganization(data: z.infer<typeof createOrganizationSchema> & { userUlid?: string }) {
  try {
    const supabase = createAuthClient()
    
    // Validate the data
    const validatedData = createOrganizationSchema.parse(data)
    
    // Prepare data for insertion with required fields
    const organizationData = {
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Create the organization - use type assertion to bypass type checking issues
    const { data: organization, error } = await supabase
      .from('Organization')
      .insert(organizationData as any)
      .select()
      .single()
    
    if (error) {
      console.error('[CREATE_ORGANIZATION_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    // Add the user as an owner
    if (data.userUlid) {
      const memberData = {
        ulid: ulid(),
        organizationUlid: organization.ulid,
        userUlid: data.userUlid,
        role: 'OWNER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const { error: memberError } = await supabase
        .from('OrganizationMember')
        .insert(memberData as any)
      
      if (memberError) {
        console.error('[CREATE_ORGANIZATION_MEMBER_ERROR]', memberError)
        // Ideally we would rollback the organization creation here
        return { error: memberError.message, data: null }
      }
    }
    
    revalidatePath('/dashboard/system/organizations')
    return { data: organization, error: null }
  } catch (error) {
    console.error('[CREATE_ORGANIZATION_ERROR]', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, data: null }
    }
    return { error: 'Failed to create organization', data: null }
  }
}

/**
 * Update an existing organization
 */
export async function updateOrganization({ orgId, ...data }: { orgId: string } & z.infer<typeof updateOrganizationSchema>) {
  try {
    const supabase = createAuthClient()
    
    // Validate the data
    const validatedData = updateOrganizationSchema.parse(data)
    
    // Update the organization with type assertion to bypass type checking issues
    const updateData = {
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    const { data: organization, error } = await supabase
      .from('Organization')
      .update(updateData as any)
      .eq('ulid', orgId)
      .select()
      .single()
    
    if (error) {
      console.error('[UPDATE_ORGANIZATION_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    revalidatePath(`/dashboard/system/organizations/${orgId}`)
    revalidatePath('/dashboard/system/organizations')
    return { data: organization, error: null }
  } catch (error) {
    console.error('[UPDATE_ORGANIZATION_ERROR]', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, data: null }
    }
    return { error: 'Failed to update organization', data: null }
  }
}

/**
 * Fetch all members of an organization
 */
export async function fetchOrganizationMembers(orgId: string) {
  try {
    const supabase = createAuthClient()
    
    // Fetch the organization members
    const { data: members, error } = await supabase
      .from('OrganizationMember')
      .select(`
        *,
        user:userUlid (
          ulid,
          firstName,
          lastName,
          displayName,
          email,
          profileImageUrl
        )
      `)
      .eq('organizationUlid', orgId)
      .order('createdAt', { ascending: false })
    
    if (error) {
      console.error('[FETCH_ORGANIZATION_MEMBERS_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    // Format the members data to match our schema
    const formattedMembers = members.map(member => ({
      ...member,
      user: member.user ? {
        ulid: member.user.ulid,
        name: member.user.displayName || `${member.user.firstName} ${member.user.lastName}`,
        email: member.user.email,
        imageUrl: member.user.profileImageUrl
      } : undefined
    }))
    
    return { data: formattedMembers, error: null }
  } catch (error) {
    console.error('[FETCH_ORGANIZATION_MEMBERS_ERROR]', error)
    return { error: 'Failed to fetch organization members', data: null }
  }
}

/**
 * Add a member to an organization
 */
export async function addOrganizationMember(data: z.infer<typeof addOrganizationMemberSchema>) {
  try {
    const supabase = createAuthClient()
    
    // Validate the data
    const validatedData = addOrganizationMemberSchema.parse(data)
    
    // Check if user exists by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('email', validatedData.email)
      .single()
    
    if (userError || !user) {
      return { error: 'User not found with this email', data: null }
    }
    
    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('OrganizationMember')
      .select('ulid')
      .eq('organizationUlid', validatedData.organizationUlid)
      .eq('userUlid', user.ulid)
      .maybeSingle()
    
    if (existingMember) {
      return { error: 'User is already a member of this organization', data: null }
    }
    
    // Add the user as a member
    const memberData = {
      ulid: validatedData.ulid,
      organizationUlid: validatedData.organizationUlid,
      userUlid: user.ulid,
      role: validatedData.role,
      scope: validatedData.scope || 'LOCAL',
      customPermissions: validatedData.customPermissions,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Use type assertion to bypass type checking issues
    const { data: member, error: memberError } = await supabase
      .from('OrganizationMember')
      .insert(memberData as any)
      .select()
      .single()
    
    if (memberError) {
      console.error('[ADD_ORGANIZATION_MEMBER_ERROR]', memberError)
      return { error: memberError.message, data: null }
    }
    
    revalidatePath(`/dashboard/system/organizations/${validatedData.organizationUlid}`)
    return { data: member, error: null }
  } catch (error) {
    console.error('[ADD_ORGANIZATION_MEMBER_ERROR]', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, data: null }
    }
    return { error: 'Failed to add member to organization', data: null }
  }
}

/**
 * Check if a user exists by email
 */
export async function checkUserExistsByEmail(email: string) {
  try {
    const supabase = createAuthClient()
    
    // Check if user exists by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid, email, displayName')
      .eq('email', email.trim())
      .maybeSingle()
    
    if (userError) {
      console.error('[CHECK_USER_EXISTS_ERROR]', userError)
      return { exists: false, user: null, error: userError.message }
    }
    
    return { 
      exists: !!user, 
      user: user ? {
        ulid: user.ulid,
        email: user.email,
        name: user.displayName
      } : null, 
      error: null 
    }
  } catch (error) {
    console.error('[CHECK_USER_EXISTS_ERROR]', error)
    return { exists: false, user: null, error: 'Failed to check if user exists' }
  }
}

/**
 * Update a member in an organization
 */
export async function updateOrganizationMember(data: z.infer<typeof updateOrganizationMemberSchema>) {
  try {
    const supabase = createAuthClient()
    
    // Validate the data
    const validatedData = updateOrganizationMemberSchema.parse(data)
    
    // Get the organization ID for path revalidation
    const { data: orgMember, error: fetchError } = await supabase
      .from('OrganizationMember')
      .select('organizationUlid')
      .eq('ulid', validatedData.memberUlid)
      .single()
    
    if (fetchError) {
      return { error: 'Member not found', data: null }
    }
    
    // Prepare the update data without memberUlid field
    const { memberUlid, ...updateData } = validatedData
    
    // Update the member with type assertion
    const memberUpdateData = {
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    const { data: member, error } = await supabase
      .from('OrganizationMember')
      .update(memberUpdateData as any)
      .eq('ulid', memberUlid)
      .select()
      .single()
    
    if (error) {
      console.error('[UPDATE_ORGANIZATION_MEMBER_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    if (orgMember) {
      revalidatePath(`/dashboard/system/organizations/${orgMember.organizationUlid}`)
    }
    
    return { data: member, error: null }
  } catch (error) {
    console.error('[UPDATE_ORGANIZATION_MEMBER_ERROR]', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, data: null }
    }
    return { error: 'Failed to update organization member', data: null }
  }
}

/**
 * Remove a member from an organization
 */
export async function removeOrganizationMember(data: z.infer<typeof removeOrganizationMemberSchema>) {
  try {
    const supabase = createAuthClient()
    
    // Validate the data
    const validatedData = removeOrganizationMemberSchema.parse(data)
    
    // Get the organization ID for path revalidation
    const { data: orgMember, error: fetchError } = await supabase
      .from('OrganizationMember')
      .select('organizationUlid')
      .eq('ulid', validatedData.memberUlid)
      .single()
    
    if (fetchError) {
      return { error: 'Member not found', data: null }
    }
    
    // Remove the member (soft delete by setting status to REMOVED)
    const { data: member, error } = await supabase
      .from('OrganizationMember')
      .update({
        status: 'REMOVED',
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', validatedData.memberUlid)
      .select()
      .single()
    
    if (error) {
      console.error('[REMOVE_ORGANIZATION_MEMBER_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    if (orgMember) {
      revalidatePath(`/dashboard/system/organizations/${orgMember.organizationUlid}`)
    }
    
    return { data: member, error: null }
  } catch (error) {
    console.error('[REMOVE_ORGANIZATION_MEMBER_ERROR]', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, data: null }
    }
    return { error: 'Failed to remove organization member', data: null }
  }
} 