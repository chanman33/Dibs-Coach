import { createAuthClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import * as z from 'zod'
import { generateUlid } from '@/utils/ulid'

// Organization Invite Schema
export const createInviteSchema = z.object({
  ulid: z.string().length(26).optional(),
  organizationUlid: z.string().length(26),
  email: z.string().email(),
  role: z.string().default('MEMBER'),
  message: z.string().optional(),
})

export type CreateInvite = z.infer<typeof createInviteSchema>

// Accept Invite Schema
export const acceptInviteSchema = z.object({
  token: z.string(),
  userUlid: z.string().length(26),
})

export type AcceptInvite = z.infer<typeof acceptInviteSchema>

/**
 * Create and send an organization invite
 */
export async function createOrganizationInvite(data: z.infer<typeof createInviteSchema>) {
  try {
    const supabase = createAuthClient()
    
    // Validate the data
    const validatedData = createInviteSchema.parse(data)
    
    // Generate invite token and expiration date (48 hours from now)
    const inviteToken = generateUlid()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)
    
    // Check if there's already an active invite for this email in this organization
    const { data: existingInvite, error: checkError } = await supabase
      .from('OrganizationInvite')
      .select('ulid')
      .eq('organizationUlid', validatedData.organizationUlid)
      .eq('email', validatedData.email)
      .eq('status', 'PENDING')
      .maybeSingle()
    
    if (existingInvite) {
      return { error: 'An invite has already been sent to this email', data: null }
    }
    
    // Check if user is already a member
    const { data: userCheck, error: userCheckError } = await supabase
      .from('User')
      .select('ulid')
      .eq('email', validatedData.email)
      .maybeSingle()
    
    if (userCheck) {
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('OrganizationMember')
        .select('ulid')
        .eq('organizationUlid', validatedData.organizationUlid)
        .eq('userUlid', userCheck.ulid)
        .maybeSingle()
      
      if (existingMember) {
        return { error: 'User is already a member of this organization', data: null }
      }
    }
    
    // Create the invite
    const inviteData = {
      ulid: validatedData.ulid || generateUlid(),
      organizationUlid: validatedData.organizationUlid,
      email: validatedData.email,
      role: validatedData.role || 'MEMBER', // Default to MEMBER
      token: inviteToken,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
      message: validatedData.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const { data: invite, error: inviteError } = await supabase
      .from('OrganizationInvite')
      .insert(inviteData as any)
      .select()
      .single()
    
    if (inviteError) {
      console.error('[CREATE_ORGANIZATION_INVITE_ERROR]', inviteError)
      return { error: inviteError.message, data: null }
    }
    
    // TODO: Send email with invite link
    // This would typically use an email service to send the invite
    
    revalidatePath(`/dashboard/system/organizations/${validatedData.organizationUlid}`)
    return { data: invite, error: null }
  } catch (error) {
    console.error('[CREATE_ORGANIZATION_INVITE_ERROR]', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, data: null }
    }
    return { error: 'Failed to create invite', data: null }
  }
}

/**
 * Accept an organization invite
 */
export async function acceptOrganizationInvite(data: z.infer<typeof acceptInviteSchema>) {
  try {
    const supabase = createAuthClient()
    
    // Validate the data
    const validatedData = acceptInviteSchema.parse(data)
    
    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from('OrganizationInvite')
      .select('ulid, organizationUlid, email, role, status, expiresAt')
      .eq('token', validatedData.token)
      .single()
    
    if (inviteError || !invite) {
      return { error: 'Invalid or expired invite token', data: null }
    }
    
    // Check if invite is still valid
    if (invite.status !== 'PENDING') {
      return { error: 'This invite has already been used or cancelled', data: null }
    }
    
    // Check if invite is expired
    const expiresAt = new Date(invite.expiresAt)
    if (expiresAt < new Date()) {
      // Update invite status to EXPIRED
      await supabase
        .from('OrganizationInvite')
        .update({ status: 'EXPIRED', updatedAt: new Date().toISOString() })
        .eq('ulid', invite.ulid)
      
      return { error: 'This invite has expired', data: null }
    }
    
    // Get the user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid, email')
      .eq('ulid', validatedData.userUlid)
      .single()
    
    if (userError || !user) {
      return { error: 'User not found', data: null }
    }
    
    // Check if email matches
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return { error: 'This invite was sent to a different email address', data: null }
    }
    
    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('OrganizationMember')
      .select('ulid')
      .eq('organizationUlid', invite.organizationUlid)
      .eq('userUlid', user.ulid)
      .maybeSingle()
    
    if (existingMember) {
      // Update invite status to ACCEPTED
      await supabase
        .from('OrganizationInvite')
        .update({ status: 'ACCEPTED', updatedAt: new Date().toISOString() })
        .eq('ulid', invite.ulid)
      
      return { error: 'You are already a member of this organization', data: null }
    }
    
    // Add the user as a member
    const memberData = {
      ulid: generateUlid(),
      organizationUlid: invite.organizationUlid,
      userUlid: user.ulid,
      role: invite.role, // Use role from the invite (defaults to MEMBER)
      scope: 'LOCAL',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const { data: member, error: memberError } = await supabase
      .from('OrganizationMember')
      .insert(memberData as any)
      .select()
      .single()
    
    if (memberError) {
      console.error('[ACCEPT_ORGANIZATION_INVITE_ERROR]', memberError)
      return { error: memberError.message, data: null }
    }
    
    // Update invite status to ACCEPTED
    await supabase
      .from('OrganizationInvite')
      .update({ status: 'ACCEPTED', updatedAt: new Date().toISOString() })
      .eq('ulid', invite.ulid)
    
    revalidatePath(`/dashboard/system/organizations/${invite.organizationUlid}`)
    revalidatePath('/dashboard')
    
    return { data: member, error: null }
  } catch (error) {
    console.error('[ACCEPT_ORGANIZATION_INVITE_ERROR]', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, data: null }
    }
    return { error: 'Failed to accept invite', data: null }
  }
}

/**
 * Cancel an organization invite
 */
export async function cancelOrganizationInvite(inviteUlid: string) {
  try {
    const supabase = createAuthClient()
    
    // Get the invite for revalidation path
    const { data: invite, error: inviteError } = await supabase
      .from('OrganizationInvite')
      .select('organizationUlid')
      .eq('ulid', inviteUlid)
      .single()
    
    if (inviteError) {
      return { error: 'Invite not found', data: null }
    }
    
    // Update invite status to CANCELLED
    const { data, error } = await supabase
      .from('OrganizationInvite')
      .update({ 
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', inviteUlid)
      .select()
      .single()
    
    if (error) {
      console.error('[CANCEL_ORGANIZATION_INVITE_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    revalidatePath(`/dashboard/system/organizations/${invite.organizationUlid}`)
    return { data, error: null }
  } catch (error) {
    console.error('[CANCEL_ORGANIZATION_INVITE_ERROR]', error)
    return { error: 'Failed to cancel invite', data: null }
  }
}

/**
 * Fetch pending invites for an organization
 */
export async function fetchOrganizationInvites(organizationUlid: string) {
  try {
    const supabase = createAuthClient()
    
    const { data, error } = await supabase
      .from('OrganizationInvite')
      .select('*')
      .eq('organizationUlid', organizationUlid)
      .order('createdAt', { ascending: false })
    
    if (error) {
      console.error('[FETCH_ORGANIZATION_INVITES_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('[FETCH_ORGANIZATION_INVITES_ERROR]', error)
    return { error: 'Failed to fetch organization invites', data: null }
  }
}

/**
 * Resend an organization invite
 */
export async function resendOrganizationInvite(inviteUlid: string) {
  try {
    const supabase = createAuthClient()
    
    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from('OrganizationInvite')
      .select('*')
      .eq('ulid', inviteUlid)
      .single()
    
    if (inviteError || !invite) {
      return { error: 'Invite not found', data: null }
    }
    
    // Check if invite is still valid
    if (invite.status !== 'PENDING') {
      return { error: 'This invite has already been used or cancelled', data: null }
    }
    
    // Update expiresAt to 48 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)
    
    const { data, error } = await supabase
      .from('OrganizationInvite')
      .update({ 
        expiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString() 
      })
      .eq('ulid', inviteUlid)
      .select()
      .single()
    
    if (error) {
      console.error('[RESEND_ORGANIZATION_INVITE_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    // TODO: Send email with invite link
    // This would typically use an email service to send the invite
    
    revalidatePath(`/dashboard/system/organizations/${invite.organizationUlid}`)
    return { data, error: null }
  } catch (error) {
    console.error('[RESEND_ORGANIZATION_INVITE_ERROR]', error)
    return { error: 'Failed to resend invite', data: null }
  }
} 