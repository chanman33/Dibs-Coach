'use server'

import { createAuthClient } from '@/utils/auth'
import { generateUlid } from '@/utils/ulid'
import type { ContactSalesFormData } from '@/utils/types/contact-sales'
import { z } from 'zod'

export async function submitContactSalesForm(data: ContactSalesFormData) {
  try {
    // Create Supabase client
    const supabase = await createAuthClient()
    
    // Insert into EnterpriseLeads table
    const { error } = await supabase
      .from('EnterpriseLeads')
      .insert({
        ulid: generateUlid(),
        companyName: data.companyName,
        website: data.website,
        industry: 'REAL_ESTATE_SALES',
        fullName: data.fullName,
        jobTitle: data.jobTitle,
        email: data.email,
        phone: data.phone,
        teamSize: data.teamSize,
        multipleOffices: data.multipleOffices,
        status: 'PENDING',
        metadata: {
          submittedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      })

    if (error) {
      console.error('[CONTACT_SALES_ERROR]', {
        code: 'DB_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      })
      
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to submit form. Please try again.'
        }
      }
    }

    return {
      data: { success: true },
      error: null
    }
  } catch (error) {
    console.error('[CONTACT_SALES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid form data',
          details: error.flatten()
        }
      }
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }
  }
} 