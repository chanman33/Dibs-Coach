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

// Get enhanced lead analytics data for visualization
export async function getLeadAnalytics(period: string = 'all') {
  try {
    const supabase = createAuthClient()
    
    // Calculate the start date based on the period
    const startDate = new Date()
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'all':
      default:
        // Use a far past date to include everything
        startDate.setFullYear(2000)
        break
    }
    
    // Format date for Supabase query
    const formattedStartDate = startDate.toISOString()
    
    // Query for all lead data needed for analytics with date filter
    const { data, error } = await supabase
      .from("EnterpriseLeads")
      .select("*")
      .gte("createdAt", formattedStartDate)
    
    if (error) throw error
    
    // Get date range for monthly metrics - last 6 months
    const today = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(today.getMonth() - 6)
    
    // Use either the filter start date or six months ago, whichever is more recent
    const monthlyMetricsStartDate = startDate > sixMonthsAgo ? startDate : sixMonthsAgo
    
    // Calculate analytics metrics
    const analytics = {
      // Basic stats
      total: data.length,
      byStatus: data.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: data.reduce((acc, lead) => {
        acc[lead.priority] = (acc[lead.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      
      // Conversion metrics
      conversionMetrics: {
        // Calculate average time from NEW to QUALIFIED (in days)
        avgTimeToQualify: calculateAvgDaysBetweenStatuses(data, "NEW", "QUALIFIED"),
        
        // Calculate average time from QUALIFIED to WON/LOST (in days)
        avgTimeToClose: calculateAvgDaysBetweenStatuses(data, "QUALIFIED", ["WON", "LOST"]),
        
        // Lead-to-deal ratio (percentage of leads that converted to WON)
        leadToDealRatio: calculateLeadToDealRatio(data),
      },
      
      // Assigned vs Unassigned 
      assignmentMetrics: {
        assigned: data.filter(lead => lead.assignedToUlid).length,
        unassigned: data.filter(lead => !lead.assignedToUlid).length,
      },
      
      // Monthly metrics for the last 6 months
      monthlyMetrics: getMonthlyLeadMetrics(data, monthlyMetricsStartDate),
      
      // Growth rate compared to previous period
      growthRate: calculateGrowthRate(data, period),
    }
    
    return { data: analytics, error: null }
  } catch (error) {
    console.error("[GET_LEAD_ANALYTICS_ERROR]", error)
    return { data: null, error: "Failed to fetch lead analytics" }
  }
}

// Helper function to calculate average days between statuses
function calculateAvgDaysBetweenStatuses(
  leads: any[], 
  fromStatus: string, 
  toStatus: string | string[]
) {
  // Filter leads that have both createdAt and updatedAt timestamps
  const relevantLeads = leads.filter(lead => {
    const targetStatus = Array.isArray(toStatus) ? toStatus.includes(lead.status) : lead.status === toStatus
    return lead.createdAt && lead.updatedAt && targetStatus
  })
  
  if (relevantLeads.length === 0) return 0
  
  // Calculate the average time difference in days
  const totalDays = relevantLeads.reduce((total, lead) => {
    const createdDate = new Date(lead.createdAt)
    const updatedDate = new Date(lead.updatedAt)
    const diffTime = Math.abs(updatedDate.getTime() - createdDate.getTime())
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return total + diffDays
  }, 0)
  
  return parseFloat((totalDays / relevantLeads.length).toFixed(1))
}

// Helper function to calculate lead-to-deal ratio
function calculateLeadToDealRatio(leads: any[]) {
  if (leads.length === 0) return 0
  
  const wonLeads = leads.filter(lead => lead.status === "WON").length
  return parseFloat(((wonLeads / leads.length) * 100).toFixed(1))
}

// Helper function to get monthly lead metrics for the past 6 months
function getMonthlyLeadMetrics(leads: any[], startDate: Date) {
  const months: string[] = []
  const newLeadsByMonth: Record<string, number> = {}
  const qualifiedLeadsByMonth: Record<string, number> = {}
  
  // Create array of month names
  for (let i = 0; i < 6; i++) {
    const date = new Date(startDate)
    date.setMonth(startDate.getMonth() + i)
    const monthName = date.toLocaleString('default', { month: 'short' })
    months.push(monthName)
    newLeadsByMonth[monthName] = 0
    qualifiedLeadsByMonth[monthName] = 0
  }
  
  // Count leads by month
  leads.forEach(lead => {
    const createdDate = new Date(lead.createdAt)
    
    // Only include leads from the last 6 months
    if (createdDate >= startDate) {
      const monthName = createdDate.toLocaleString('default', { month: 'short' })
      
      // Increment new leads count for this month
      if (newLeadsByMonth[monthName] !== undefined) {
        newLeadsByMonth[monthName]++
      }
      
      // Increment qualified leads if the status is QUALIFIED or further
      const qualifiedStatuses = ["QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"]
      if (qualifiedLeadsByMonth[monthName] !== undefined && qualifiedStatuses.includes(lead.status)) {
        qualifiedLeadsByMonth[monthName]++
      }
    }
  })
  
  return {
    months,
    newLeadsByMonth,
    qualifiedLeadsByMonth
  }
}

// Helper function to calculate growth rate compared to previous period
function calculateGrowthRate(leads: any[], period: string = 'all') {
  const now = new Date()
  let currentPeriodStart: Date
  let previousPeriodStart: Date
  let previousPeriodEnd: Date
  
  // Set the period boundaries based on the selected time period
  switch (period) {
    case '7d':
      currentPeriodStart = new Date(now)
      currentPeriodStart.setDate(now.getDate() - 7)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setDate(currentPeriodStart.getDate() - 7)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1)
      break
    case '30d':
      currentPeriodStart = new Date(now)
      currentPeriodStart.setDate(now.getDate() - 30)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setDate(currentPeriodStart.getDate() - 30)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1)
      break
    case '90d':
      currentPeriodStart = new Date(now)
      currentPeriodStart.setDate(now.getDate() - 90)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setDate(currentPeriodStart.getDate() - 90)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1)
      break
    case '1y':
      currentPeriodStart = new Date(now)
      currentPeriodStart.setFullYear(now.getFullYear() - 1)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setFullYear(currentPeriodStart.getFullYear() - 1)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1)
      break
    case 'all':
    default:
      // For all time, compare last month vs previous month
      currentPeriodStart = new Date(now)
      currentPeriodStart.setMonth(now.getMonth() - 1)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setMonth(currentPeriodStart.getMonth() - 1)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1)
      break
  }
  
  // Count leads in current period
  const currentPeriodLeads = leads.filter(lead => {
    const createdDate = new Date(lead.createdAt)
    return createdDate >= currentPeriodStart && createdDate <= now
  }).length
  
  // Count leads in previous period
  const previousPeriodLeads = leads.filter(lead => {
    const createdDate = new Date(lead.createdAt)
    return createdDate >= previousPeriodStart && createdDate <= previousPeriodEnd
  }).length
  
  // Calculate growth rate
  if (previousPeriodLeads === 0) return currentPeriodLeads > 0 ? 100 : 0 // If no leads last period, 100% growth if we have any leads
  
  const growthRate = ((currentPeriodLeads - previousPeriodLeads) / previousPeriodLeads) * 100
  return parseFloat(growthRate.toFixed(1))
} 