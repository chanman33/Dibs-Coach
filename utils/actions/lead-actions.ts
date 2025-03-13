"use server"

import { createAuthClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { generateUlid } from "@/utils/ulid"
import { Lead, LeadDetails, LeadListItem, LeadNote, LEAD_STATUS, LEAD_PRIORITY, LEAD_SOURCE } from "@/utils/types/leads"
import { revalidatePath } from "next/cache"
import { OrgIndustry } from "@prisma/client"
import { Database, Json } from "@/types/supabase"

type LeadRow = Database["public"]["Tables"]["EnterpriseLeads"]["Row"]
type LeadInsert = Database["public"]["Tables"]["EnterpriseLeads"]["Insert"]
type LeadUpdate = Database["public"]["Tables"]["EnterpriseLeads"]["Update"]

// Create a new lead
export async function createLead(data: {
  companyName: string
  website?: string
  industry: OrgIndustry
  fullName: string
  jobTitle: string
  email: string
  phone: string
  teamSize: "5-20" | "20-50" | "50-100" | "100+"
  multipleOffices: boolean
  status?: keyof typeof LEAD_STATUS
  priority?: keyof typeof LEAD_PRIORITY
  notes?: LeadNote[]
  assignedToUlid?: string
}) {
  try {
    const supabase = createAuthClient()
    
    const leadUlid = generateUlid()
    
    const { error } = await supabase
      .from("EnterpriseLeads")
      .insert({
        ulid: leadUlid,
        companyName: data.companyName,
        website: data.website,
        industry: data.industry,
        fullName: data.fullName,
        jobTitle: data.jobTitle,
        email: data.email,
        phone: data.phone,
        teamSize: data.teamSize,
        multipleOffices: data.multipleOffices,
        status: data.status || "NEW",
        priority: data.priority || "MEDIUM",
        assignedToUlid: data.assignedToUlid,
        notes: data.notes as unknown as Json,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } satisfies LeadInsert)

    if (error) throw error
    
    revalidatePath("/dashboard/system/lead-mgmt")
    return { data: leadUlid, error: null }
  } catch (error) {
    console.error("[CREATE_LEAD_ERROR]", error)
    return { data: null, error }
  }
}

// Get all leads with pagination and filters
export async function getLeads(params: {
  page?: number
  limit?: number
  status?: keyof typeof LEAD_STATUS
  priority?: keyof typeof LEAD_PRIORITY
  search?: string
  assignedToUlid?: string
}) {
  try {
    const supabase = createAuthClient()
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      assignedToUlid
    } = params
    
    let query = supabase
      .from("EnterpriseLeads")
      .select("*, assignedTo:User!assignedToUlid (ulid, firstName, lastName, email)")
    
    // Apply filters
    if (status) query = query.eq("status", status)
    if (priority) query = query.eq("priority", priority)
    if (assignedToUlid) query = query.eq("assignedToUlid", assignedToUlid)
    if (search) {
      query = query.or(`companyName.ilike.%${search}%,fullName.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    // Add pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)
    
    // Execute query
    const { data, error, count } = await query
    
    if (error) throw error
    
    // Format response
    const leads = data.map((lead): LeadListItem => ({
      ulid: lead.ulid,
      companyName: lead.companyName,
      fullName: lead.fullName,
      email: lead.email,
      status: lead.status as keyof typeof LEAD_STATUS,
      priority: lead.priority as keyof typeof LEAD_PRIORITY,
      createdAt: lead.createdAt,
      lastContactedAt: lead.lastContactedAt || undefined,
      nextFollowUpDate: lead.nextFollowUpDate || undefined,
      assignedTo: lead.assignedTo ? {
        ulid: lead.assignedTo.ulid,
        fullName: `${lead.assignedTo.firstName || ""} ${lead.assignedTo.lastName || ""}`.trim(),
        email: lead.assignedTo.email
      } : undefined
    }))
    
    return {
      data: {
        leads,
        total: count || 0,
        page,
        limit
      },
      error: null
    }
  } catch (error) {
    console.error("[GET_LEADS_ERROR]", error)
    return { data: null, error: "Failed to fetch leads" }
  }
}

// Get a single lead by ID
export async function getLead(ulid: string) {
  try {
    const supabase = createAuthClient()
    
    const { data, error } = await supabase
      .from("EnterpriseLeads")
      .select("*, assignedTo:User!assignedToUlid (ulid, firstName, lastName, email)")
      .eq("ulid", ulid)
      .single()
    
    if (error) throw error
    if (!data) throw new Error("Lead not found")
    
    // Format response
    const lead: LeadDetails = {
      ulid: data.ulid,
      companyName: data.companyName,
      website: data.website || undefined,
      industry: data.industry,
      fullName: data.fullName,
      jobTitle: data.jobTitle,
      email: data.email,
      phone: data.phone,
      teamSize: data.teamSize as "5-20" | "20-50" | "50-100" | "100+",
      multipleOffices: data.multipleOffices,
      status: data.status as keyof typeof LEAD_STATUS,
      priority: data.priority as keyof typeof LEAD_PRIORITY,
      assignedToUlid: data.assignedToUlid || undefined,
      notes: (data.notes as LeadNote[] | null) || undefined,
      lastContactedAt: data.lastContactedAt || undefined,
      nextFollowUpDate: data.nextFollowUpDate || undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      assignedTo: data.assignedTo ? {
        ulid: data.assignedTo.ulid,
        fullName: `${data.assignedTo.firstName || ""} ${data.assignedTo.lastName || ""}`.trim(),
        email: data.assignedTo.email
      } : undefined
    }
    
    return { data: lead, error: null }
  } catch (error) {
    console.error("[GET_LEAD_ERROR]", error)
    return { data: null, error: "Failed to fetch lead" }
  }
}

// Update a lead
export async function updateLead(ulid: string, data: Partial<Lead>) {
  try {
    const supabase = createAuthClient()
    
    // Format dates properly
    let nextFollowUpDate = data.nextFollowUpDate || null
    
    // If nextFollowUpDate is provided but not in ISO format, convert it
    if (nextFollowUpDate && !nextFollowUpDate.endsWith('Z')) {
      try {
        nextFollowUpDate = new Date(nextFollowUpDate).toISOString()
      } catch (e) {
        console.error("Date conversion error:", e)
        nextFollowUpDate = null
      }
    }
    
    // Handle assignedToUlid - ensure it's either a valid ULID or null
    // Create a new object without the assignedToUlid to avoid type issues
    const { assignedToUlid, ...restData } = data
    
    // Prepare the final assignedToUlid value
    const finalAssignedToUlid = assignedToUlid && assignedToUlid.trim() !== '' 
      ? assignedToUlid 
      : null
    
    const updateData: LeadUpdate = {
      ...restData,
      assignedToUlid: finalAssignedToUlid,
      updatedAt: new Date().toISOString(),
      lastContactedAt: data.lastContactedAt || null,
      nextFollowUpDate: nextFollowUpDate,
      metadata: data.metadata as Json
    }
    
    const { error } = await supabase
      .from("EnterpriseLeads")
      .update(updateData)
      .eq("ulid", ulid)
    
    if (error) throw error
    
    revalidatePath("/dashboard/system/lead-mgmt")
    revalidatePath(`/dashboard/system/lead-mgmt/${ulid}`)
    return { data: { ulid }, error: null }
  } catch (error) {
    console.error("[UPDATE_LEAD_ERROR]", error)
    return { data: null, error: "Failed to update lead" }
  }
}

// Add a note to a lead
export async function addLeadNote(ulid: string, note: Omit<LeadNote, "id" | "createdAt">) {
  try {
    const supabase = createAuthClient()
    
    // Get current notes
    const { data: lead, error: fetchError } = await supabase
      .from("EnterpriseLeads")
      .select("notes")
      .eq("ulid", ulid)
      .single()
    
    if (fetchError) throw fetchError
    
    // Add new note
    const currentNotes = (lead.notes as LeadNote[] | null) || []
    const notes = [
      ...currentNotes,
      {
        id: generateUlid(),
        ...note,
        createdAt: new Date().toISOString()
      }
    ] as unknown as Json
    
    // Update lead with new notes
    const { error: updateError } = await supabase
      .from("EnterpriseLeads")
      .update({
        notes,
        lastContactedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq("ulid", ulid)
    
    if (updateError) throw updateError
    
    revalidatePath(`/dashboard/system/lead-mgmt/${ulid}`)
    return { data: { ulid }, error: null }
  } catch (error) {
    console.error("[ADD_LEAD_NOTE_ERROR]", error)
    return { data: null, error: "Failed to add note" }
  }
}

// Delete a lead
export async function deleteLead(ulid: string) {
  try {
    const supabase = createAuthClient()
    
    const { error } = await supabase
      .from("EnterpriseLeads")
      .delete()
      .eq("ulid", ulid)
    
    if (error) throw error
    
    revalidatePath("/dashboard/system/lead-mgmt")
    return { data: { ulid }, error: null }
  } catch (error) {
    console.error("[DELETE_LEAD_ERROR]", error)
    return { data: null, error: "Failed to delete lead" }
  }
}

// Get lead statistics
export async function getLeadStats() {
  try {
    const supabase = createAuthClient()
    
    // Only query for fields we know exist
    const { data, error } = await supabase
      .from("EnterpriseLeads")
      .select("status, priority")
    
    if (error) throw error
    
    // Calculate statistics
    const stats = {
      total: data.length,
      byStatus: data.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: data.reduce((acc, lead) => {
        acc[lead.priority] = (acc[lead.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return { data: stats, error: null }
  } catch (error) {
    console.error("[GET_LEAD_STATS_ERROR]", error)
    return { data: null, error: "Failed to fetch lead statistics" }
  }
} 