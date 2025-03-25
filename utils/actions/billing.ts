'use server'

import { createAuthClient } from "@/utils/auth";
import { withServerAction } from "@/utils/middleware/withServerAction";
import { generateUlid } from "@/utils/ulid";
import { z } from "zod";
import { BillingPeriodSchema, UpdateSubscriptionSchema } from "@/utils/types/billing";
import { ApiError } from "@/utils/types/api";

// Subscription management
export const fetchOrganizationSubscription = withServerAction(
  async (_, { userUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }

      const supabase = await createAuthClient();
      
      // Get current subscription
      const { data: subscription, error } = await supabase
        .from("Subscription")
        .select(`
          ulid,
          status,
          planType,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          totalSeats,
          usedSeats,
          seatPrice,
          billingCycle,
          autoRenew,
          metadata
        `)
        .eq("organizationUlid", organizationUlid)
        .eq("status", "active")
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[FETCH_SUBSCRIPTION_ERROR]', {
          error,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch subscription'
          } as ApiError
        };
      }

      return {
        data: subscription,
        error: null
      };
    } catch (error) {
      console.error('[FETCH_SUBSCRIPTION_ERROR]', {
        error,
        organizationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
);

// Update subscription details (seats, billing cycle)
export const updateSubscription = withServerAction<{ success: boolean }, z.infer<typeof UpdateSubscriptionSchema>>(
  async (params, { userUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }
      
      // Validate parameters
      const validatedData = UpdateSubscriptionSchema.safeParse(params);
      if (!validatedData.success) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid subscription data',
            details: validatedData.error.flatten()
          } as ApiError
        };
      }
      
      const { subscriptionUlid, totalSeats, billingCycle } = validatedData.data;
      
      // Get current subscription
      const supabase = await createAuthClient();
      const { data: subscription, error: fetchError } = await supabase
        .from("Subscription")
        .select("ulid, totalSeats, usedSeats, billingCycle")
        .eq("ulid", subscriptionUlid)
        .eq("organizationUlid", organizationUlid)
        .single();
      
      if (fetchError) {
        console.error('[UPDATE_SUBSCRIPTION_ERROR]', {
          error: fetchError,
          subscriptionUlid,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch subscription'
          } as ApiError
        };
      }
      
      // Check if reducing seats below used count
      if (totalSeats < subscription.usedSeats) {
        return {
          data: null,
          error: {
            code: 'INVALID_OPERATION',
            message: `Cannot reduce seats below current used count (${subscription.usedSeats})`
          } as ApiError
        };
      }
      
      // Update subscription
      const updates: Record<string, any> = {
        updatedAt: new Date().toISOString()
      };
      
      if (totalSeats !== undefined) {
        updates.totalSeats = totalSeats;
      }
      
      if (billingCycle && billingCycle !== subscription.billingCycle) {
        updates.billingCycle = billingCycle;
      }
      
      // Record billing event for the change
      const eventData = {
        ulid: generateUlid(),
        subscriptionUlid,
        organizationUlid,
        userUlid,
        type: 'subscription_updated',
        description: `Subscription updated: ${Object.keys(updates).filter(k => k !== 'updatedAt').join(', ')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Perform updates in a transaction
      const { error: updateError } = await supabase.rpc('update_subscription_with_event', {
        p_subscription_ulid: subscriptionUlid,
        p_subscription_updates: updates,
        p_event_data: eventData
      });
      
      if (updateError) {
        console.error('[UPDATE_SUBSCRIPTION_ERROR]', {
          error: updateError,
          subscriptionUlid,
          updates,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update subscription'
          } as ApiError
        };
      }
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[UPDATE_SUBSCRIPTION_ERROR]', {
        error,
        params,
        organizationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
);

// Fetch seat licenses
export const fetchSeatLicenses = withServerAction(
  async (_, { userUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }

      const supabase = await createAuthClient();
      
      // Get active subscription
      const { data: subscription, error: subError } = await supabase
        .from("Subscription")
        .select("ulid")
        .eq("organizationUlid", organizationUlid)
        .eq("status", "active")
        .single();
      
      if (subError) {
        console.error('[FETCH_SEAT_LICENSES_ERROR]', {
          error: subError,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'NO_SUBSCRIPTION',
            message: 'No active subscription found'
          } as ApiError
        };
      }
      
      // Get seat licenses with user details
      const { data: licenses, error } = await supabase
        .from("SeatLicense")
        .select(`
          ulid,
          status,
          departmentName,
          teamName,
          assignedAt,
          revokedAt,
          user:userUlid (
            ulid,
            firstName,
            lastName,
            email,
            profileImageUrl
          ),
          assignedBy:assignedByUserUlid (
            ulid,
            firstName,
            lastName,
            email
          )
        `)
        .eq("subscriptionUlid", subscription.ulid)
        .order('assignedAt', { ascending: false });
      
      if (error) {
        console.error('[FETCH_SEAT_LICENSES_ERROR]', {
          error,
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch seat licenses'
          } as ApiError
        };
      }

      return {
        data: licenses,
        error: null
      };
    } catch (error) {
      console.error('[FETCH_SEAT_LICENSES_ERROR]', {
        error,
        organizationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
);

// Assign a seat license to a user
export const assignSeatLicense = withServerAction<{ success: boolean }, { userUlid: string, departmentName?: string }>(
  async (params, { userUlid: assignerUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }
      
      const { userUlid, departmentName } = params;
      
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_USER',
            message: 'User ID is required'
          } as ApiError
        };
      }
      
      const supabase = await createAuthClient();
      
      // Get active subscription
      const { data: subscription, error: subError } = await supabase
        .from("Subscription")
        .select("ulid, totalSeats, usedSeats")
        .eq("organizationUlid", organizationUlid)
        .eq("status", "active")
        .single();
      
      if (subError) {
        console.error('[ASSIGN_SEAT_LICENSE_ERROR]', {
          error: subError,
          organizationUlid,
          assignerUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'NO_SUBSCRIPTION',
            message: 'No active subscription found'
          } as ApiError
        };
      }
      
      // Check if user is already a member of the organization
      const { data: membership, error: memberError } = await supabase
        .from("OrganizationMember")
        .select("ulid")
        .eq("organizationUlid", organizationUlid)
        .eq("userUlid", userUlid)
        .single();
      
      if (memberError) {
        return {
          data: null,
          error: {
            code: 'NOT_MEMBER',
            message: 'User is not a member of this organization'
          } as ApiError
        };
      }
      
      // Check if seats are available
      if (subscription.usedSeats >= subscription.totalSeats) {
        return {
          data: null,
          error: {
            code: 'NO_SEATS_AVAILABLE',
            message: 'No seats available in the subscription'
          } as ApiError
        };
      }
      
      // Check if user already has a license
      const { data: existingLicense, error: licenseError } = await supabase
        .from("SeatLicense")
        .select("ulid, status")
        .eq("subscriptionUlid", subscription.ulid)
        .eq("userUlid", userUlid)
        .single();
      
      if (existingLicense) {
        // If license exists but was revoked, reactivate it
        if (existingLicense.status === 'revoked') {
          const { error: reactivateError } = await supabase
            .from("SeatLicense")
            .update({
              status: 'active',
              assignedByUserUlid: assignerUlid,
              assignedAt: new Date().toISOString(),
              revokedAt: null,
              updatedAt: new Date().toISOString()
            })
            .eq("ulid", existingLicense.ulid);
          
          if (reactivateError) {
            console.error('[REACTIVATE_SEAT_LICENSE_ERROR]', {
              error: reactivateError,
              licenseUlid: existingLicense.ulid,
              organizationUlid,
              assignerUlid,
              userUlid,
              timestamp: new Date().toISOString()
            });
            
            return {
              data: null,
              error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to reactivate seat license'
              } as ApiError
            };
          }
          
          // Increment used seats count
          await supabase
            .from("Subscription")
            .update({
              usedSeats: subscription.usedSeats + 1,
              updatedAt: new Date().toISOString()
            })
            .eq("ulid", subscription.ulid);
          
          return {
            data: { success: true },
            error: null
          };
        }
        
        return {
          data: null,
          error: {
            code: 'LICENSE_EXISTS',
            message: 'User already has an active license'
          } as ApiError
        };
      }
      
      // Create new license
      const licenseUlid = generateUlid();
      const timestamp = new Date().toISOString();
      
      const { error: createError } = await supabase
        .from("SeatLicense")
        .insert({
          ulid: licenseUlid,
          subscriptionUlid: subscription.ulid,
          userUlid,
          assignedByUserUlid: assignerUlid,
          departmentName,
          status: 'active',
          assignedAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      
      if (createError) {
        console.error('[ASSIGN_SEAT_LICENSE_ERROR]', {
          error: createError,
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          assignerUlid,
          userUlid,
          timestamp
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create seat license'
          } as ApiError
        };
      }
      
      // Update subscription seat count
      const { error: updateError } = await supabase
        .from("Subscription")
        .update({
          usedSeats: subscription.usedSeats + 1,
          updatedAt: timestamp
        })
        .eq("ulid", subscription.ulid);
      
      if (updateError) {
        console.error('[UPDATE_SUBSCRIPTION_ERROR]', {
          error: updateError,
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          assignerUlid,
          userUlid,
          timestamp
        });
      }
      
      // Record billing event
      const { error: eventError } = await supabase
        .from("BillingEvent")
        .insert({
          ulid: generateUlid(),
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          userUlid,
          type: 'seat_assigned',
          description: `Seat license assigned to ${userUlid}`,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      
      if (eventError) {
        console.error('[BILLING_EVENT_ERROR]', {
          error: eventError,
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          assignerUlid,
          userUlid,
          timestamp
        });
      }
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[ASSIGN_SEAT_LICENSE_ERROR]', {
        error,
        params,
        organizationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
);

// Revoke a seat license
export const revokeSeatLicense = withServerAction<{ success: boolean }, { licenseUlid: string }>(
  async (params, { userUlid: revokerUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }
      
      const { licenseUlid } = params;
      
      if (!licenseUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_LICENSE',
            message: 'License ID is required'
          } as ApiError
        };
      }
      
      const supabase = await createAuthClient();
      
      // Get license details with subscription
      const { data: license, error: licenseError } = await supabase
        .from("SeatLicense")
        .select(`
          ulid,
          status,
          userUlid,
          subscription:subscriptionUlid (
            ulid,
            organizationUlid,
            usedSeats
          )
        `)
        .eq("ulid", licenseUlid)
        .single();
      
      if (licenseError) {
        console.error('[REVOKE_SEAT_LICENSE_ERROR]', {
          error: licenseError,
          licenseUlid,
          organizationUlid,
          revokerUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'LICENSE_NOT_FOUND',
            message: 'Seat license not found'
          } as ApiError
        };
      }
      
      // Verify license belongs to the organization
      if (license.subscription.organizationUlid !== organizationUlid) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'License does not belong to this organization'
          } as ApiError
        };
      }
      
      // Check if license is already revoked
      if (license.status === 'revoked') {
        return {
          data: null,
          error: {
            code: 'ALREADY_REVOKED',
            message: 'License is already revoked'
          } as ApiError
        };
      }
      
      const timestamp = new Date().toISOString();
      
      // Revoke license
      const { error: revokeError } = await supabase
        .from("SeatLicense")
        .update({
          status: 'revoked',
          revokedAt: timestamp,
          updatedAt: timestamp
        })
        .eq("ulid", licenseUlid);
      
      if (revokeError) {
        console.error('[REVOKE_SEAT_LICENSE_ERROR]', {
          error: revokeError,
          licenseUlid,
          organizationUlid,
          revokerUlid,
          timestamp
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to revoke seat license'
          } as ApiError
        };
      }
      
      // Update subscription used seats count
      const { error: updateError } = await supabase
        .from("Subscription")
        .update({
          usedSeats: Math.max(0, license.subscription.usedSeats - 1),
          updatedAt: timestamp
        })
        .eq("ulid", license.subscription.ulid);
      
      if (updateError) {
        console.error('[UPDATE_SUBSCRIPTION_ERROR]', {
          error: updateError,
          subscriptionUlid: license.subscription.ulid,
          organizationUlid,
          revokerUlid,
          timestamp
        });
      }
      
      // Record billing event
      const { error: eventError } = await supabase
        .from("BillingEvent")
        .insert({
          ulid: generateUlid(),
          subscriptionUlid: license.subscription.ulid,
          organizationUlid,
          userUlid: license.userUlid,
          type: 'seat_revoked',
          description: `Seat license revoked from ${license.userUlid}`,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      
      if (eventError) {
        console.error('[BILLING_EVENT_ERROR]', {
          error: eventError,
          subscriptionUlid: license.subscription.ulid,
          organizationUlid,
          revokerUlid,
          userUlid: license.userUlid,
          timestamp
        });
      }
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[REVOKE_SEAT_LICENSE_ERROR]', {
        error,
        params,
        organizationUlid,
        userUlid: revokerUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
);

// Fetch budget allocations
export const fetchBudgetAllocations = withServerAction(
  async (_, { userUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }

      const supabase = await createAuthClient();
      
      // Get active subscription
      const { data: subscription, error: subError } = await supabase
        .from("Subscription")
        .select("ulid")
        .eq("organizationUlid", organizationUlid)
        .eq("status", "active")
        .single();
      
      if (subError) {
        console.error('[FETCH_BUDGET_ALLOCATIONS_ERROR]', {
          error: subError,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'NO_SUBSCRIPTION',
            message: 'No active subscription found'
          } as ApiError
        };
      }
      
      // Get budget allocations with target user details for user-type budgets
      const { data: budgets, error } = await supabase
        .from("BudgetAllocation")
        .select(`
          ulid,
          name,
          type,
          amount,
          spent,
          startDate,
          endDate,
          autoRenew,
          targetUlid,
          user:targetUlid (
            ulid,
            firstName,
            lastName,
            email,
            profileImageUrl
          )
        `)
        .eq("subscriptionUlid", subscription.ulid)
        .order('endDate', { ascending: false });
      
      if (error) {
        console.error('[FETCH_BUDGET_ALLOCATIONS_ERROR]', {
          error,
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch budget allocations'
          } as ApiError
        };
      }

      return {
        data: budgets,
        error: null
      };
    } catch (error) {
      console.error('[FETCH_BUDGET_ALLOCATIONS_ERROR]', {
        error,
        organizationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
);

// Create budget allocation
export const createBudgetAllocation = withServerAction<{ success: boolean }, z.infer<typeof CreateBudgetAllocationSchema>>(
  async (params, { userUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }
      
      // Validate parameters
      const validatedData = CreateBudgetAllocationSchema.safeParse(params);
      if (!validatedData.success) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid budget allocation data',
            details: validatedData.error.flatten()
          } as ApiError
        };
      }
      
      const { name, type, targetUlid, amount, startDate, endDate, autoRenew } = validatedData.data;
      
      // If type is user, targetUlid is required
      if (type === 'user' && !targetUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_TARGET_USER',
            message: 'Target user ID is required for user-type budget allocations'
          } as ApiError
        };
      }
      
      const supabase = await createAuthClient();
      
      // Get active subscription
      const { data: subscription, error: subError } = await supabase
        .from("Subscription")
        .select("ulid")
        .eq("organizationUlid", organizationUlid)
        .eq("status", "active")
        .single();
      
      if (subError) {
        console.error('[CREATE_BUDGET_ALLOCATION_ERROR]', {
          error: subError,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'NO_SUBSCRIPTION',
            message: 'No active subscription found'
          } as ApiError
        };
      }
      
      // If targetUlid is provided, verify user is a member of the organization
      if (targetUlid) {
        const { data: membership, error: memberError } = await supabase
          .from("OrganizationMember")
          .select("ulid")
          .eq("organizationUlid", organizationUlid)
          .eq("userUlid", targetUlid)
          .single();
        
        if (memberError) {
          return {
            data: null,
            error: {
              code: 'TARGET_NOT_MEMBER',
              message: 'Target user is not a member of this organization'
            } as ApiError
          };
        }
      }
      
      // Create budget allocation
      const budgetUlid = generateUlid();
      const timestamp = new Date().toISOString();
      
      const { error: createError } = await supabase
        .from("BudgetAllocation")
        .insert({
          ulid: budgetUlid,
          subscriptionUlid: subscription.ulid,
          name,
          type,
          targetUlid,
          amount,
          spent: 0,
          startDate,
          endDate,
          autoRenew,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      
      if (createError) {
        console.error('[CREATE_BUDGET_ALLOCATION_ERROR]', {
          error: createError,
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          userUlid,
          params,
          timestamp
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create budget allocation'
          } as ApiError
        };
      }
      
      // Record billing event
      const { error: eventError } = await supabase
        .from("BillingEvent")
        .insert({
          ulid: generateUlid(),
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          userUlid: targetUlid || userUlid,
          type: 'budget_allocated',
          amount,
          description: `Budget allocated: ${name} (${type})`,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      
      if (eventError) {
        console.error('[BILLING_EVENT_ERROR]', {
          error: eventError,
          subscriptionUlid: subscription.ulid,
          organizationUlid,
          userUlid,
          timestamp
        });
      }
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[CREATE_BUDGET_ALLOCATION_ERROR]', {
        error,
        params,
        organizationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
);

// Update budget allocation
export const updateBudgetAllocation = withServerAction<{ success: boolean }, z.infer<typeof UpdateBudgetAllocationSchema>>(
  async (params, { userUlid, organizationUlid }) => {
    try {
      if (!organizationUlid) {
        return {
          data: null,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'Organization ID is required'
          } as ApiError
        };
      }
      
      // Validate parameters
      const validatedData = UpdateBudgetAllocationSchema.safeParse(params);
      if (!validatedData.success) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid budget update data',
            details: validatedData.error.flatten()
          } as ApiError
        };
      }
      
      const { budgetUlid, amount, endDate, autoRenew } = validatedData.data;
      
      const supabase = await createAuthClient();
      
      // Get budget allocation with subscription
      const { data: budget, error: budgetError } = await supabase
        .from("BudgetAllocation")
        .select(`
          ulid,
          name,
          type,
          amount,
          spent,
          targetUlid,
          subscription:subscriptionUlid (
            ulid,
            organizationUlid
          )
        `)
        .eq("ulid", budgetUlid)
        .single();
      
      if (budgetError) {
        console.error('[UPDATE_BUDGET_ALLOCATION_ERROR]', {
          error: budgetError,
          budgetUlid,
          organizationUlid,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'BUDGET_NOT_FOUND',
            message: 'Budget allocation not found'
          } as ApiError
        };
      }
      
      // Verify budget belongs to the organization
      if (budget.subscription.organizationUlid !== organizationUlid) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Budget does not belong to this organization'
          } as ApiError
        };
      }
      
      // If reducing amount, verify it's not less than spent
      if (amount !== undefined && amount < budget.spent) {
        return {
          data: null,
          error: {
            code: 'INVALID_AMOUNT',
            message: `Budget amount cannot be less than spent amount (${budget.spent})`
          } as ApiError
        };
      }
      
      const timestamp = new Date().toISOString();
      
      // Prepare updates
      const updates: Record<string, any> = {
        updatedAt: timestamp
      };
      
      if (amount !== undefined) {
        updates.amount = amount;
      }
      
      if (endDate !== undefined) {
        updates.endDate = endDate;
      }
      
      if (autoRenew !== undefined) {
        updates.autoRenew = autoRenew;
      }
      
      // Update budget allocation
      const { error: updateError } = await supabase
        .from("BudgetAllocation")
        .update(updates)
        .eq("ulid", budgetUlid);
      
      if (updateError) {
        console.error('[UPDATE_BUDGET_ALLOCATION_ERROR]', {
          error: updateError,
          budgetUlid,
          updates,
          organizationUlid,
          userUlid,
          timestamp
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update budget allocation'
          } as ApiError
        };
      }
      
      // Record billing event
      const { error: eventError } = await supabase
        .from("BillingEvent")
        .insert({
          ulid: generateUlid(),
          subscriptionUlid: budget.subscription.ulid,
          organizationUlid,
          userUlid: budget.targetUlid || userUlid,
          type: 'budget_updated',
          amount: amount,
          description: `Budget updated: ${budget.name} (${budget.type})`,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      
      if (eventError) {
        console.error('[BILLING_EVENT_ERROR]', {
          error: eventError,
          subscriptionUlid: budget.subscription.ulid,
          organizationUlid,
          userUlid,
          timestamp
        });
      }
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[UPDATE_BUDGET_ALLOCATION_ERROR]', {
        error,
        params,
        organizationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        } as ApiError
      };
    }
  }
); 