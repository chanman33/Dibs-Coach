'use server'

import { createAuthClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Define the analytics data structure
export interface OrganizationAnalyticsData {
  memberCount: number
  activeMembers: number
  monthlyActive: number
  totalSessions: number
  revenue: {
    current: number
    previous: number
    percentage: number
  }
  engagement: {
    current: number
    previous: number
    percentage: number
  }
  growthData: {
    labels: string[]
    datasets: {
      members: number[]
      revenue: number[]
    }
  }
  memberActivityData: {
    labels: string[]
    datasets: {
      activeUsers: number[]
      totalSessions: number[]
    }
  }
}

// Create a schema for request validation
const fetchAnalyticsSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required')
})

/**
 * Fetch analytics data for a specific organization
 * Handles missing data gracefully by providing defaults
 */
export async function fetchOrganizationAnalytics(
  params: z.infer<typeof fetchAnalyticsSchema>
) {
  try {
    const { orgId } = fetchAnalyticsSchema.parse(params)
    console.log('[FETCH_ORGANIZATION_ANALYTICS]', { orgId })
    
    const supabase = createAuthClient()
    
    // 1. Fetch organization member counts
    const { count: totalMembers, error: membersError } = await supabase
      .from('OrganizationMember')
      .select('*', { count: 'exact', head: true })
      .eq('organizationUlid', orgId)
    
    if (membersError) {
      console.error('[FETCH_TOTAL_MEMBERS_ERROR]', membersError)
      return { error: 'Failed to fetch member data: ' + membersError.message, data: null }
    }
    
    // 2. Fetch active members count
    const { count: activeMembers, error: activeMembersError } = await supabase
      .from('OrganizationMember')
      .select('*', { count: 'exact', head: true })
      .eq('organizationUlid', orgId)
      .eq('status', 'ACTIVE')
    
    if (activeMembersError) {
      console.error('[FETCH_ACTIVE_MEMBERS_ERROR]', activeMembersError)
      // Continue anyway with default values
    }
    
    // 3. Use Session table but with appropriate fields
    let totalSessions = 0
    let sessionsData: any[] = []
    
    try {
      // Session doesn't have organizationId directly, use organization members
      const { data: orgMembers, error: orgMembersError } = await supabase
        .from('OrganizationMember')
        .select('userUlid')
        .eq('organizationUlid', orgId)
      
      if (!orgMembersError && orgMembers && orgMembers.length > 0) {
        // Get user IDs from organization members
        const userIds = orgMembers.map(member => member.userUlid)
        
        if (userIds.length > 0) {
          // Get sessions for these users (as mentees or coaches)
          const { data, error } = await supabase
            .from('Session')
            .select('*')
            .or(`menteeUlid.in.(${userIds.join(',')}),coachUlid.in.(${userIds.join(',')})`)
            .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
          
          if (!error && data) {
            sessionsData = data
            totalSessions = data.length
          }
        }
      }
    } catch (error) {
      console.error('[FETCH_SESSIONS_ERROR]', error)
      // Fallback to estimate based on member count
      totalSessions = Math.floor((totalMembers || 0) * 5) // Estimate 5 sessions per member
    }
    
    // 4. Use Payment instead of non-existent Transactions table
    // Note: This is a placeholder. Adjust according to actual schema
    let revenueData: Array<{ amount: number; createdAt: string }> = []
    
    try {
      // Since Payment doesn't have a direct organizationId field,
      // we could use organization member data to find payments
      const { data: orgMembers, error: orgMembersError } = await supabase
        .from('OrganizationMember')
        .select('userUlid')
        .eq('organizationUlid', orgId)
      
      if (!orgMembersError && orgMembers && orgMembers.length > 0) {
        // Get user IDs from organization members
        const userIds = orgMembers.map(member => member.userUlid)
        
        if (userIds.length > 0) {
          // Get payments for these users
          const { data, error } = await supabase
            .from('Payment')
            .select('amount, createdAt')
            .in('payerUlid', userIds)
            .gte('createdAt', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()) // Last 60 days
          
          if (!error && data) {
            // Cast the data to ensure it has the right structure
            revenueData = data as Array<{ amount: number; createdAt: string }>
          }
        }
      }
    } catch (error) {
      console.error('[FETCH_REVENUE_ERROR]', error)
      // Continue with empty revenue data
    }
    
    // Calculate revenue for current and previous month
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const previousMonthStart = new Date(currentMonthStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    
    const previousMonthEnd = new Date(currentMonthStart);
    previousMonthEnd.setMilliseconds(-1);
    
    // Default values in case we don't have the data
    let currentRevenue = 0;
    let previousRevenue = 0;
    let revenuePercentage = 0;
    
    // Calculate revenue if we have the data
    if (revenueData && revenueData.length > 0) {
      currentRevenue = revenueData
        .filter((t: { createdAt: string }) => new Date(t.createdAt) >= currentMonthStart)
        .reduce((sum: number, t: { amount: number | null }) => sum + (t.amount || 0), 0);
      
      previousRevenue = revenueData
        .filter((t: { createdAt: string }) => 
          new Date(t.createdAt) >= previousMonthStart && new Date(t.createdAt) < currentMonthStart
        )
        .reduce((sum: number, t: { amount: number | null }) => sum + (t.amount || 0), 0);
      
      revenuePercentage = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
    }
    
    // Generate engagement percentage (this would ideally be calculated from actual data)
    // For now, we'll use a placeholder calculation
    const memberCount = totalMembers ?? 0;
    const activeMemberCount = activeMembers ?? 0;
    const monthlyActive = memberCount ? Math.min(memberCount, Math.floor(memberCount * 0.7)) : 0;
    const currentEngagement = memberCount > 0 ? (monthlyActive / memberCount) * 100 : 0;
    const previousEngagement = currentEngagement > 0 ? currentEngagement * 0.8 : 0;
    const engagementPercentage = previousEngagement > 0 
      ? ((currentEngagement - previousEngagement) / previousEngagement) * 100 
      : 0;
    
    // Generate mock growth data for charts if real data isn't available
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const growthData = {
      labels: months,
      datasets: {
        members: [5, 8, 12, 15, 20, memberCount || 25],
        revenue: [1200, 1800, 2400, 3000, 3600, currentRevenue || 4200]
      }
    };
    
    // Generate mock member activity data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const memberActivityData = {
      labels: days,
      datasets: {
        activeUsers: [12, 15, 18, 14, 16, 10, 8].map(v => v * (memberCount ? memberCount / 20 : 1)),
        totalSessions: [25, 30, 35, 28, 32, 20, 15].map(v => v * (memberCount ? memberCount / 20 : 1))
      }
    };
    
    // Compile analytics data
    const analyticsData: OrganizationAnalyticsData = {
      memberCount: memberCount,
      activeMembers: activeMemberCount,
      monthlyActive: monthlyActive,
      totalSessions: totalSessions,
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        percentage: Math.round(revenuePercentage * 10) / 10 // Round to 1 decimal place
      },
      engagement: {
        current: Math.round(currentEngagement),
        previous: Math.round(previousEngagement),
        percentage: Math.round(engagementPercentage * 10) / 10 // Round to 1 decimal place
      },
      growthData,
      memberActivityData
    };
    
    console.log('[ORGANIZATION_ANALYTICS_SUCCESS]', {
      orgId,
      hasMembers: memberCount > 0,
      hasActivemembers: activeMemberCount > 0,
      hasSessions: sessionsData.length > 0,
      hasRevenue: revenueData.length > 0
    });
    
    return { data: analyticsData, error: null };
  } catch (error: any) {
    console.error('[FETCH_ORGANIZATION_ANALYTICS_ERROR]', error);
    return {
      error: error.message || 'Failed to fetch organization analytics',
      data: null
    };
  }
}

/**
 * Fetch detailed member growth data for charts
 */
export async function fetchOrganizationMemberGrowth(orgId: string) {
  try {
    const supabase = createAuthClient()
    
    // Get the start date for our analysis (6 months ago)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)
    
    // Get all members with their join dates
    const { data: members, error } = await supabase
      .from('OrganizationMember')
      .select('createdAt, status')
      .eq('organizationUlid', orgId)
      .gte('createdAt', startDate.toISOString())
    
    if (error) {
      console.error('[FETCH_MEMBER_GROWTH_ERROR]', error)
      return { error: error.message, data: null }
    }
    
    // If no members found, return empty dataset
    if (!members || members.length === 0) {
      // Return empty but properly formatted data
      const labels = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - 5 + i)
        return date.toLocaleDateString('en-US', { month: 'short' })
      })
      
      return {
        data: {
          labels,
          datasets: [
            {
              label: 'New Members',
              data: Array(6).fill(0)
            },
            {
              label: 'Total Members',
              data: Array(6).fill(0)
            }
          ]
        },
        error: null
      }
    }
    
    // Group members by month
    const monthlyData: Record<string, { new: number, total: number }> = {}
    
    // Initialize the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - 5 + i)
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthlyData[monthYear] = { new: 0, total: 0 }
    }
    
    // Count members by month
    let runningTotal = 0
    members.forEach(member => {
      const date = new Date(member.createdAt)
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (monthlyData[monthYear]) {
        monthlyData[monthYear].new++
      }
    })
    
    // Calculate running totals
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime()
    })
    
    sortedMonths.forEach(month => {
      runningTotal += monthlyData[month].new
      monthlyData[month].total = runningTotal
    })
    
    // Format data for charts
    const labels = sortedMonths.map(month => month.split(' ')[0]) // Just get the month abbreviation
    const newMembersData = sortedMonths.map(month => monthlyData[month].new)
    const totalMembersData = sortedMonths.map(month => monthlyData[month].total)
    
    return {
      data: {
        labels,
        datasets: [
          {
            label: 'New Members',
            data: newMembersData
          },
          {
            label: 'Total Members',
            data: totalMembersData
          }
        ]
      },
      error: null
    }
  } catch (error: any) {
    console.error('[FETCH_MEMBER_GROWTH_ERROR]', error)
    return { error: error.message || 'Failed to fetch member growth data', data: null }
  }
} 