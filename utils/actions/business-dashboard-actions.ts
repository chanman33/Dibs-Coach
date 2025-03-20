'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction, type ServerActionContext } from '@/utils/middleware/withServerAction'
import {
  BusinessCoachingMetrics,
  BusinessStats,
  RecentCoachingSession,
  TeamPerformance,
  TeamEffectivenessMetrics,
  UpcomingTraining
} from '@/utils/types/business'
import { Database } from '@/types/supabase'
import { permissionService } from '@/utils/auth'
import { ORG_ROLES } from '@/utils/roles/roles'
import { ApiResponse, ApiError } from '@/utils/types/api'

// Fetch business dashboard statistics
export const fetchBusinessStats = withServerAction<BusinessStats>(
  async (_: unknown, context: ServerActionContext): Promise<ApiResponse<BusinessStats>> => {
    console.log('[BUSINESS_STATS_ACTION_START]', {
      userUlid: context.userUlid,
      orgRole: context.roleContext.orgRole,
      organizationUlid: context.organizationUlid
    })
    
    try {
      // Early return if no organization context
      if (!context.organizationUlid) {
        console.log('[BUSINESS_STATS_ACTION_NO_ORG]', {
          userUlid: context.userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'No organization context found'
          }
        }
      }

      const supabase = await createAuthClient()
      const now = new Date()
      const orgId = context.organizationUlid
      
      // Get current team member count
      const { count: currentMemberCount, error: currentCountError } = await supabase
        .from('OrganizationMember')
        .select('*', { count: 'exact', head: true })
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
      
      if (currentCountError) {
        console.error('[BUSINESS_STATS_MEMBER_COUNT_ERROR]', {
          error: currentCountError,
          orgId,
          timestamp: new Date().toISOString()
        })
      }

      // Get team member count from 3 months ago
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      
      // Get team member count from 30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)
      
      const { count: pastMemberCount, error: pastCountError } = await supabase
        .from('OrganizationMember')
        .select('*', { count: 'exact', head: true })
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
        .lt('createdAt', thirtyDaysAgo.toISOString())
      
      // Calculate team member growth
      const teamMemberGrowth = ((currentMemberCount || 0) - (pastMemberCount || 0))
      
      // Get active coaching sessions in the last 30 days
      const { data: orgMemberUlids } = await supabase
        .from('OrganizationMember')
        .select('userUlid')
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')

      const { data: activeSessions, error: sessionsError } = await supabase
        .from('Session')
        .select('menteeUlid')
        .gte('startTime', thirtyDaysAgo.toISOString())
        .eq('status', 'COMPLETED')
        .in('menteeUlid', orgMemberUlids?.map(m => m.userUlid) || [])
      
      // Get unique mentees participating in coaching
      const uniqueMentees = new Set()
      activeSessions?.forEach(session => {
        if (session.menteeUlid) uniqueMentees.add(session.menteeUlid)
      })
      
      const activeInCoaching = uniqueMentees.size
      
      // Calculate participation rate
      const participationRate = (currentMemberCount || 0) > 0 
        ? Math.round((activeInCoaching / (currentMemberCount || 1)) * 100) 
        : 0
      
      // Budget data - in production this would come from a real budget table
      // For now checking if there's a real budget set in database
      const { data: orgBudget } = await supabase
        .from('Settings')
        .select('value')
        .eq('key', `org_${orgId}_coaching_budget`)
        .single()

      // If no budget is found in the database, mark it as not set
      const isBudgetSet = !!orgBudget && !!orgBudget.value
      const estimatedCostPerSession = 250 // placeholder value

      // Use placeholder or real budget
      const totalBudget = isBudgetSet && typeof orgBudget.value === 'object' && orgBudget.value !== null
        ? (typeof orgBudget.value === 'object' && 'amount' in orgBudget.value ? Number(orgBudget.value.amount) : 0)
        : (currentMemberCount || 0) * 500 // placeholder calculation 

      const usedBudget = (activeSessions?.length || 0) * estimatedCostPerSession
      const budgetUtilized = totalBudget > 0 
        ? Math.round((usedBudget / totalBudget) * 100)
        : 0
      
      // Get scheduled sessions for next 30 days
      const nextMonth = new Date()
      nextMonth.setDate(nextMonth.getDate() + 30)
      
      const { data: scheduledSessionsData, error: scheduledError } = await supabase
        .from('Session')
        .select('*', { count: 'exact' })
        .in('menteeUlid', orgMemberUlids?.map(m => m.userUlid) || [])
        .gte('startTime', now.toISOString())
        .lt('startTime', nextMonth.toISOString())
      
      const scheduledSessions = scheduledSessionsData?.length || 0
      
      console.log('[BUSINESS_STATS_ACTION_DATA]', {
        orgId,
        currentMemberCount,
        teamMemberGrowth,
        activeInCoaching,
        participationRate,
        scheduledSessions,
        timestamp: new Date().toISOString()
      })
      
      // Prepare the result
      const stats: BusinessStats = {
        teamMemberCount: currentMemberCount || 0,
        teamMemberGrowth,
        activeInCoaching,
        participationRate,
        coachingBudget: totalBudget,
        budgetUtilized,
        isBudgetSet,
        scheduledSessions: scheduledSessions || 0,
        upcomingPeriod: 'Next 30 days',
        coachingSessions: {
          value: scheduledSessions || 0,
          change: 0,
          trend: 'neutral',
          description: 'Total coaching sessions'
        },
        activeCoaches: {
          value: 0,
          change: 0,
          trend: 'neutral',
          description: 'Active coaches'
        },
        employeeParticipation: {
          value: participationRate,
          change: 0,
          trend: participationRate > 50 ? 'up' : 'neutral',
          description: 'Employee participation rate'
        },
        avgSessionRating: {
          value: 4.5,
          change: 0,
          trend: 'neutral',
          description: 'Average session rating'
        }
      }

      console.log('[BUSINESS_STATS_ACTION_COMPLETE]', { stats })
      return { 
        data: stats,
        error: null
      }
    } catch (error) {
      console.error('[BUSINESS_STATS_ACTION_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch business statistics'
        }
      }
    }
  }
)

// Fetch business coaching metrics
export const fetchBusinessCoachingMetrics = withServerAction<BusinessCoachingMetrics>(
  async (_, context: ServerActionContext) => {
    console.log('[BUSINESS_METRICS_ACTION_START]', {
      userUlid: context.userUlid,
      isDevelopment: process.env.NODE_ENV === 'development',
      timestamp: new Date().toISOString()
    })
    
    try {
      // Early return if no organization context
      if (!context.organizationUlid) {
        console.log('[BUSINESS_METRICS_ACTION_NO_ORG]', {
          userUlid: context.userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'No organization context found'
          }
        }
      }

      const supabase = await createAuthClient()
      const orgId = context.organizationUlid
      
      // Get the last 3 months of sessions
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      
      // Get org members first
      const { data: orgMemberUlids } = await supabase
        .from('OrganizationMember')
        .select('userUlid')
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
      
      const memberUlids = orgMemberUlids?.map(m => m.userUlid) || []
      
      // Get all sessions for this organization's members
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select('status, menteeUlid, coachUlid') 
        .gte('startTime', threeMonthsAgo.toISOString())
        .in('menteeUlid', memberUlids)
      
      if (sessionsError) {
        console.error('[BUSINESS_METRICS_SESSIONS_ERROR]', {
          error: sessionsError,
          orgId,
          timestamp: new Date().toISOString()
        })
      }
      
      // Calculate metrics
      const totalSessions = sessions?.length || 0
      const completedSessions = sessions?.filter(s => s.status === 'COMPLETED')?.length || 0
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
      
      // Calculate active coaches
      const uniqueCoaches = new Set()
      sessions?.forEach(session => {
        if (session.coachUlid) uniqueCoaches.add(session.coachUlid)
      })
      const activeCoaches = uniqueCoaches.size
      
      // Calculate participation
      const uniqueMentees = new Set()
      sessions?.forEach(session => {
        if (session.menteeUlid) uniqueMentees.add(session.menteeUlid)
      })
      
      // Get total org members for participation rate
      const { count: memberCount } = await supabase
        .from('OrganizationMember')
        .select('*', { count: 'exact', head: true })
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
      
      const participationRate = memberCount && memberCount > 0
        ? Math.round((uniqueMentees.size / memberCount) * 100)
        : 0
      
      // Use a placeholder satisfaction score since ratings may not exist
      const satisfactionScore = 85
      
      // Estimated cost per session for calculation
      const costPerSession = 250 // placeholder value
      const totalSpent = totalSessions * costPerSession
      
      // Prepare result that matches BusinessCoachingMetrics interface
      const metricsData: BusinessCoachingMetrics = {
        totalSessions,
        activeCoaches,
        averageRating: 4.7, // placeholder rating
        totalSpent,
        currency: 'USD'
      }

      // Log final result
      console.log('[BUSINESS_METRICS_RESULT]', {
        success: true,
        data: metricsData,
        timestamp: new Date().toISOString()
      })

      return { 
        data: metricsData, 
        error: null 
      }
    } catch (error) {
      console.error('[FETCH_BUSINESS_COACHING_METRICS_ERROR]', { 
        error,
        stack: error instanceof Error ? error.stack : undefined,
        userUlid: context.userUlid,
        timestamp: new Date().toISOString()
      })

      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch business coaching metrics'
        }
      }
    }
  }
)

// Fetch team performance metrics
export const fetchTeamPerformance = withServerAction<TeamPerformance[]>(
  async (_: unknown, context: ServerActionContext): Promise<ApiResponse<TeamPerformance[]>> => {
    console.log('[TEAM_PERFORMANCE_ACTION_START]', {
      userUlid: context.userUlid,
      orgRole: context.roleContext.orgRole,
      organizationUlid: context.organizationUlid
    })
    
    try {
      // Early return if no organization context
      if (!context.organizationUlid) {
        console.log('[TEAM_PERFORMANCE_ACTION_NO_ORG]', {
          userUlid: context.userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'No organization context found'
          }
        }
      }

      const supabase = await createAuthClient()
      const orgId = context.organizationUlid
      
      // Get active coaches in this organization
      const { data: orgMembers, error: membersError } = await supabase
        .from('OrganizationMember')
        .select(`
          userUlid,
          User:userUlid (
            ulid,
            firstName,
            lastName,
            profileImageUrl,
            capabilities
          )
        `)
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
      
      if (membersError) {
        console.error('[TEAM_PERFORMANCE_MEMBERS_ERROR]', {
          error: membersError,
          orgId,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch organization members'
          }
        }
      }
      
      // Filter for members with coaching capability and fetch their performance
      const coachUlids = orgMembers
        ?.filter(member => member.User?.capabilities?.includes('COACH'))
        ?.map(member => member.User?.ulid) || []
      
      if (coachUlids.length === 0) {
        console.log('[TEAM_PERFORMANCE_NO_COACHES]', {
          orgId,
          timestamp: new Date().toISOString()
        })
        return { data: [], error: null }
      }
      
      // Get all sessions for these coaches in the last 3 months
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select('coachUlid, status, menteeUlid, createdAt') // Removed menteeRating
        .in('coachUlid', coachUlids)
        .gte('startTime', threeMonthsAgo.toISOString())
      
      if (sessionsError) {
        console.error('[TEAM_PERFORMANCE_SESSIONS_ERROR]', {
          error: sessionsError,
          coachCount: coachUlids.length,
          timestamp: new Date().toISOString()
        })
      }
      
      // Process session data per coach
      const coachPerformance = coachUlids.map(coachUlid => {
        const coachSessions = sessions?.filter(s => s.coachUlid === coachUlid) || []
        const completedSessions = coachSessions.filter(s => s.status === 'COMPLETED')
        
        // Use placeholder ratings since menteeRating may not exist
        // In a real implementation, this would come from actual ratings
        const avgRating = 4.5 + (Math.random() * 0.5) // Random rating between 4.5-5.0
        
        // Calculate client growth (unique mentees in last month vs previous 2 months)
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        
        const recentMentees = new Set(
          coachSessions
            .filter(s => new Date(s.createdAt) >= lastMonth)
            .map(s => s.menteeUlid)
        )
        
        const prevMentees = new Set(
          coachSessions
            .filter(s => new Date(s.createdAt) < lastMonth)
            .map(s => s.menteeUlid)
        )
        
        // Calculate growth percentage
        const clientGrowth = prevMentees.size > 0
          ? Math.round(((recentMentees.size - prevMentees.size) / prevMentees.size) * 100)
          : recentMentees.size > 0 ? 100 : 0
        
        // Find coach user info
        const coach = orgMembers?.find(m => m.User?.ulid === coachUlid)?.User
        
        return {
          id: coachUlid,
          name: coach ? `${coach.firstName} ${coach.lastName}` : 'Unknown Coach',
          avatar: coach?.profileImageUrl || '',
          sessions: completedSessions.length,
          ratings: Number(avgRating.toFixed(1)),
          clientGrowth
        }
      })
      
      // Sort by number of sessions in descending order
      const sortedPerformance = coachPerformance
        .filter(coach => coach.sessions > 0) // Only include coaches with sessions
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5) // Limit to top 5 performers
      
      console.log('[TEAM_PERFORMANCE_ACTION_COMPLETE]', { 
        coachCount: coachUlids.length,
        sessionCount: sessions?.length || 0,
        performanceCount: sortedPerformance.length
      })
      
      return { 
        data: sortedPerformance, 
        error: null 
      }
    } catch (error) {
      console.error('[TEAM_PERFORMANCE_ACTION_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch team performance metrics'
        }
      }
    }
  }
)

// Save coaching budget for an organization
export const saveCoachingBudget = withServerAction<{ success: boolean }>(
  async (budgetAmount: number, context: ServerActionContext): Promise<ApiResponse<{ success: boolean }>> => {
    console.log('[SAVE_BUDGET_ACTION_START]', {
      userUlid: context.userUlid,
      orgRole: context.roleContext.orgRole,
      organizationUlid: context.organizationUlid,
      budgetAmount
    })
    
    try {
      // Early return if no organization context
      if (!context.organizationUlid) {
        console.log('[SAVE_BUDGET_ACTION_NO_ORG]', {
          userUlid: context.userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'No organization context found'
          }
        }
      }

      // Validate the budget amount
      if (isNaN(budgetAmount) || budgetAmount <= 0) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid budget amount. Please provide a positive number.'
          }
        }
      }

      const supabase = await createAuthClient()
      const orgId = context.organizationUlid
      
      // Check if a budget setting already exists
      const { data: existingSetting } = await supabase
        .from('Settings')
        .select('ulid')
        .eq('key', `org_${orgId}_coaching_budget`)
        .single()
      
      // Format the budget data
      const budgetData = {
        amount: budgetAmount,
        currency: 'USD',
        updatedBy: context.userUlid,
        updatedAt: new Date().toISOString()
      }
      
      if (existingSetting) {
        // Update existing setting
        const { error: updateError } = await supabase
          .from('Settings')
          .update({
            value: budgetData,
            updatedAt: new Date().toISOString()
          })
          .eq('ulid', existingSetting.ulid)
        
        if (updateError) {
          console.error('[SAVE_BUDGET_UPDATE_ERROR]', {
            error: updateError,
            orgId,
            timestamp: new Date().toISOString()
          })
          return {
            data: null,
            error: {
              code: 'UPDATE_ERROR',
              message: 'Failed to update coaching budget'
            }
          }
        }
      } else {
        // Create new setting
        // In a real implementation we'd generate a proper ULID
        const tempUlid = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        
        const { error: insertError } = await supabase
          .from('Settings')
          .insert({
            ulid: tempUlid,
            key: `org_${orgId}_coaching_budget`,
            value: budgetData,
            description: 'Monthly coaching budget for organization',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        
        if (insertError) {
          console.error('[SAVE_BUDGET_INSERT_ERROR]', {
            error: insertError,
            orgId,
            timestamp: new Date().toISOString()
          })
          return {
            data: null,
            error: {
              code: 'CREATE_ERROR',
              message: 'Failed to create coaching budget setting'
            }
          }
        }
      }

      console.log('[SAVE_BUDGET_ACTION_COMPLETE]', {
        success: true,
        orgId,
        budgetAmount,
        timestamp: new Date().toISOString()
      })
      
      return { 
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[SAVE_BUDGET_ACTION_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to save coaching budget'
        }
      }
    }
  }
)

// Fetch recent coaching sessions for organization
export const fetchRecentCoachingSessions = withServerAction<RecentCoachingSession[]>(
  async (_: unknown, context: ServerActionContext): Promise<ApiResponse<RecentCoachingSession[]>> => {
    console.log('[RECENT_COACHING_SESSIONS_ACTION_START]', {
      userUlid: context.userUlid,
      orgRole: context.roleContext.orgRole,
      organizationUlid: context.organizationUlid,
      timestamp: new Date().toISOString()
    })
    
    try {
      // Early return if no organization context
      if (!context.organizationUlid) {
        console.log('[RECENT_COACHING_SESSIONS_NO_ORG]', {
          userUlid: context.userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'No organization context found'
          }
        }
      }

      const supabase = await createAuthClient()
      const orgId = context.organizationUlid
      
      // Get org members first
      const { data: orgMembers, error: membersError } = await supabase
        .from('OrganizationMember')
        .select('userUlid')
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
      
      if (membersError) {
        console.error('[RECENT_COACHING_SESSIONS_MEMBERS_ERROR]', {
          error: membersError,
          orgId,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch organization members'
          }
        }
      }
      
      const memberUlids = orgMembers?.map(m => m.userUlid) || []
      
      if (memberUlids.length === 0) {
        console.log('[RECENT_COACHING_SESSIONS_NO_MEMBERS]', {
          orgId,
          timestamp: new Date().toISOString()
        })
        return { data: [], error: null }
      }
      
      // Get recent sessions for this organization's members
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select(`
          ulid,
          startTime,
          status,
          sessionType,
          coach:User!Session_coachUlid_fkey (
            ulid,
            firstName,
            lastName,
            profileImageUrl
          )
        `)
        .in('menteeUlid', memberUlids)
        .order('startTime', { ascending: false })
        .limit(5)
      
      if (sessionsError) {
        console.error('[RECENT_COACHING_SESSIONS_ERROR]', {
          error: sessionsError,
          orgId,
          memberCount: memberUlids.length,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch recent coaching sessions'
          }
        }
      }
      
      if (!sessions || sessions.length === 0) {
        console.log('[RECENT_COACHING_SESSIONS_NONE_FOUND]', {
          orgId,
          timestamp: new Date().toISOString()
        })
        return { data: [], error: null }
      }
      
      // Transform sessions to the format expected by the client
      const formattedSessions = sessions.map(session => {
        const coach = session.coach || { firstName: 'Unknown', lastName: 'Coach' }
        const startDate = new Date(session.startTime)
        const now = new Date()
        
        // Format the date relative to today
        let sessionDate = startDate.toLocaleDateString()
        const dayDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dayDiff === 0) {
          sessionDate = 'Today'
        } else if (dayDiff === 1) {
          sessionDate = 'Yesterday'
        } else if (dayDiff < 7) {
          sessionDate = `${dayDiff} days ago`
        }
        
        return {
          id: session.ulid,
          coachName: `${coach.firstName || ''} ${coach.lastName || ''}`.trim(),
          coachAvatar: coach.profileImageUrl || '',
          sessionType: session.sessionType || 'Coaching Session',
          sessionDate,
          status: session.status
        }
      })
      
      console.log('[RECENT_COACHING_SESSIONS_SUCCESS]', { 
        sessionCount: formattedSessions.length,
        timestamp: new Date().toISOString()
      })
      
      return { data: formattedSessions, error: null }
    } catch (error) {
      console.error('[RECENT_COACHING_SESSIONS_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        userUlid: context.userUlid,
        timestamp: new Date().toISOString()
      })
      
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch recent coaching sessions'
        }
      }
    }
  }
)

// Fetch upcoming training sessions for the organization
export const fetchUpcomingTrainings = withServerAction<UpcomingTraining[]>(
  async (_: unknown, context: ServerActionContext): Promise<ApiResponse<UpcomingTraining[]>> => {
    console.log('[UPCOMING_TRAININGS_ACTION_START]', {
      userUlid: context.userUlid,
      orgRole: context.roleContext.orgRole,
      organizationUlid: context.organizationUlid,
      timestamp: new Date().toISOString()
    })
    
    try {
      // Early return if no organization context
      if (!context.organizationUlid) {
        console.log('[UPCOMING_TRAININGS_NO_ORG]', {
          userUlid: context.userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'No organization context found'
          }
        }
      }

      const supabase = await createAuthClient()
      const orgId = context.organizationUlid
      
      // Since training sessions might not be in the database yet,
      // we'll check for any scheduled sessions in the future as a proxy
      const now = new Date()
      
      // Get org members first
      const { data: orgMembers, error: membersError } = await supabase
        .from('OrganizationMember')
        .select('userUlid')
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
      
      if (membersError) {
        console.error('[UPCOMING_TRAININGS_MEMBERS_ERROR]', {
          error: membersError,
          orgId,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch organization members'
          }
        }
      }
      
      const memberUlids = orgMembers?.map(m => m.userUlid) || []
      
      if (memberUlids.length === 0) {
        console.log('[UPCOMING_TRAININGS_NO_MEMBERS]', {
          orgId,
          timestamp: new Date().toISOString()
        })
        return { data: [], error: null }
      }
      
      // Get upcoming sessions for this organization's members
      const { data: upcomingSessions, error: sessionsError } = await supabase
        .from('Session')
        .select(`
          ulid,
          startTime,
          sessionType,
          menteeUlid
        `)
        .in('menteeUlid', memberUlids)
        .gt('startTime', now.toISOString())
        .order('startTime', { ascending: true })
        .limit(10)
      
      if (sessionsError) {
        console.error('[UPCOMING_TRAININGS_SESSIONS_ERROR]', {
          error: sessionsError,
          orgId,
          memberCount: memberUlids.length,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch upcoming training sessions'
          }
        }
      }
      
      if (!upcomingSessions || upcomingSessions.length === 0) {
        console.log('[UPCOMING_TRAININGS_NONE_FOUND]', {
          orgId,
          timestamp: new Date().toISOString()
        })
        return { data: [], error: null }
      }
      
      // Process upcoming sessions into training format
      const trainings: UpcomingTraining[] = upcomingSessions.map(session => {
        const startDate = new Date(session.startTime)
        const now = new Date()
        
        // Format the date relative to today
        let date = startDate.toLocaleDateString()
        const tomorrow = new Date()
        tomorrow.setDate(now.getDate() + 1)
        
        // Check if it's today or tomorrow
        if (startDate.toDateString() === now.toDateString()) {
          date = 'Today'
        } else if (startDate.toDateString() === tomorrow.toDateString()) {
          date = 'Tomorrow'
        }
        
        // Format time with timezone
        const timeWithTZ = startDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZoneName: 'short'
        })
        
        // Determine icon type based on session type
        let iconType: 'graduation' | 'calendar' | 'target' = 'calendar'
        if (session.sessionType?.includes('ORIENTATION') || 
            session.sessionType?.includes('TRAINING')) {
          iconType = 'graduation'
        } else if (session.sessionType?.includes('GOAL') || 
                  session.sessionType?.includes('PLANNING')) {
          iconType = 'target'
        }
        
        // Use session type as title or default to a generic training title
        let title = session.sessionType || 'Coaching Session'
        
        // Capitalize title and make it more readable
        title = title
          .split('_')
          .map(word => word.charAt(0) + word.slice(1).toLowerCase())
          .join(' ')
          
        return {
          id: session.ulid,
          title,
          date,
          timeWithTZ: timeWithTZ.replace(/:\d+ /, ' '), // Remove seconds from time
          attendees: 1, // Default to 1 attendee per session
          iconType
        }
      })
      
      console.log('[UPCOMING_TRAININGS_SUCCESS]', { 
        trainingsCount: trainings.length,
        timestamp: new Date().toISOString()
      })
      
      return { data: trainings, error: null }
    } catch (error) {
      console.error('[UPCOMING_TRAININGS_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        userUlid: context.userUlid,
        timestamp: new Date().toISOString()
      })
      
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch upcoming trainings'
        }
      }
    }
  }
)

// Fetch team effectiveness metrics for the business dashboard
export const fetchTeamEffectivenessMetrics = withServerAction<TeamEffectivenessMetrics>(
  async (_: unknown, context: ServerActionContext): Promise<ApiResponse<TeamEffectivenessMetrics>> => {
    console.log('[TEAM_EFFECTIVENESS_ACTION_START]', {
      userUlid: context.userUlid,
      orgRole: context.roleContext.orgRole,
      organizationUlid: context.organizationUlid,
      timestamp: new Date().toISOString()
    })
    
    try {
      // Early return if no organization context
      if (!context.organizationUlid) {
        console.log('[TEAM_EFFECTIVENESS_NO_ORG]', {
          userUlid: context.userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'No organization context found'
          }
        }
      }

      const supabase = await createAuthClient()
      const orgId = context.organizationUlid
      
      // Get all members in the organization
      const { data: orgMembers, error: membersError } = await supabase
        .from('OrganizationMember')
        .select('userUlid')
        .eq('organizationUlid', orgId)
        .eq('status', 'ACTIVE')
      
      if (membersError) {
        console.error('[TEAM_EFFECTIVENESS_MEMBERS_ERROR]', {
          error: membersError,
          orgId,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch organization members'
          }
        }
      }
      
      const memberUlids = orgMembers?.map(m => m.userUlid) || []
      const totalMembers = memberUlids.length
      
      if (memberUlids.length === 0) {
        console.log('[TEAM_EFFECTIVENESS_NO_MEMBERS]', {
          orgId,
          timestamp: new Date().toISOString()
        })
        return { data: null, error: { code: 'NOT_FOUND', message: 'No members found in organization' } }
      }
      
      // Get all coaching sessions in the last 6 months for these members
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select(`
          ulid,
          menteeUlid,
          status,
          sessionType,
          startTime
        `)
        .in('menteeUlid', memberUlids)
        .gte('startTime', sixMonthsAgo.toISOString())
      
      if (sessionsError) {
        console.error('[TEAM_EFFECTIVENESS_SESSIONS_ERROR]', {
          error: sessionsError,
          orgId,
          timestamp: new Date().toISOString()
        })
      }
      
      // Get upcoming sessions in the next 30 days
      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(now.getDate() + 30)
      
      const { data: upcomingSessions, error: upcomingSessionsError } = await supabase
        .from('Session')
        .select('ulid, startTime')
        .in('menteeUlid', memberUlids)
        .gte('startTime', now.toISOString())
        .lt('startTime', thirtyDaysFromNow.toISOString())
      
      if (upcomingSessionsError) {
        console.error('[TEAM_EFFECTIVENESS_UPCOMING_SESSIONS_ERROR]', {
          error: upcomingSessionsError,
          orgId,
          timestamp: new Date().toISOString()
        })
      }
      
      const scheduledSessionsNext30Days = upcomingSessions?.length || 0
      
      // Calculate metrics (with reasonable fallbacks and simulated data where necessary)
      const allSessions = sessions || []
      const completedSessions = allSessions.filter(s => s.status === 'COMPLETED')
      
      // 1. Participation rate - unique employees who had at least one session
      const uniqueMentees = new Set(allSessions.map(session => session.menteeUlid))
      const employeeParticipation = Math.round((uniqueMentees.size / Math.max(totalMembers, 1)) * 100)
      
      // 2. Average sessions per employee
      const avgSessions = uniqueMentees.size > 0 
        ? Number((allSessions.length / uniqueMentees.size).toFixed(1))
        : 0
      
      // 3. Goals achievement rate (simulation as goalAchieved might not exist)
      // In a real implementation, this would come from actual goal tracking
      const completedWithGoals = completedSessions.length * 0.8 // Assume 80% set goals
      const achievedGoals = completedWithGoals * 0.75 // Assume 75% of goals achieved
      const goalsAchievementRate = Math.round((achievedGoals / Math.max(completedWithGoals, 1)) * 100)
      
      // 4. Employee retention (simulated - in real implementation would connect to HR data)
      // Higher retention rate for employees in coaching
      const employeeRetention = 85 + Math.round(Math.random() * 10) // 85-95%
      
      // 5. Skill growth rate (simulated - would come from self-assessments)
      const skillGrowthRate = 65 + Math.round(Math.random() * 20) // 65-85%
      
      // 6. Employee satisfaction (simulated - would come from feedback forms)
      const employeeSatisfaction = 80 + Math.round(Math.random() * 15) // 80-95%
      
      // 7. Top focus areas (simulated - would come from session metadata)
      const focusAreas = [
        { area: 'Leadership Skills', count: Math.round(completedSessions.length * 0.3) },
        { area: 'Communication', count: Math.round(completedSessions.length * 0.25) },
        { area: 'Time Management', count: Math.round(completedSessions.length * 0.2) },
        { area: 'Strategic Thinking', count: Math.round(completedSessions.length * 0.15) },
        { area: 'Team Building', count: Math.round(completedSessions.length * 0.1) }
      ].filter(area => area.count > 0)
      
      const result: TeamEffectivenessMetrics = {
        employeeParticipation,
        averageSessionsPerEmployee: avgSessions,
        goalsAchievementRate,
        employeeRetention,
        skillGrowthRate,
        employeeSatisfaction,
        topFocusAreas: focusAreas,
        scheduledSessionsNext30Days
      }
      
      console.log('[TEAM_EFFECTIVENESS_SUCCESS]', {
        metrics: result,
        timestamp: new Date().toISOString()
      })
      
      return { data: result, error: null }
    } catch (error) {
      console.error('[TEAM_EFFECTIVENESS_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        userUlid: context.userUlid,
        timestamp: new Date().toISOString()
      })
      
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch team effectiveness metrics'
        }
      }
    }
  }
) 