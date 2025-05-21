export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      AdminActivity: {
        Row: {
          createdAt: string
          description: string
          severity: string
          title: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string | null
        }
        Insert: {
          createdAt?: string
          description: string
          severity: string
          title: string
          type: string
          ulid: string
          updatedAt: string
          userUlid?: string | null
        }
        Update: {
          createdAt?: string
          description?: string
          severity?: string
          title?: string
          type?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string | null
        }
        Relationships: []
      }
      AdminAuditLog: {
        Row: {
          action: string
          adminUlid: string
          createdAt: string
          details: Json
          targetType: string
          targetUlid: string
          ulid: string
        }
        Insert: {
          action: string
          adminUlid: string
          createdAt?: string
          details: Json
          targetType: string
          targetUlid: string
          ulid: string
        }
        Update: {
          action?: string
          adminUlid?: string
          createdAt?: string
          details?: Json
          targetType?: string
          targetUlid?: string
          ulid?: string
        }
        Relationships: [
          {
            foreignKeyName: "AdminAuditLog_adminUlid_fkey"
            columns: ["adminUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      AdminMetrics: {
        Row: {
          activeCoaches: number
          activeUsers: number
          completedSessions: number
          createdAt: string
          monthlyRevenue: number
          pendingCoaches: number
          totalCoaches: number
          totalRevenue: number
          totalSessions: number
          totalUsers: number
          ulid: string
          updatedAt: string
        }
        Insert: {
          activeCoaches: number
          activeUsers: number
          completedSessions: number
          createdAt?: string
          monthlyRevenue: number
          pendingCoaches: number
          totalCoaches: number
          totalRevenue: number
          totalSessions: number
          totalUsers: number
          ulid: string
          updatedAt: string
        }
        Update: {
          activeCoaches?: number
          activeUsers?: number
          completedSessions?: number
          createdAt?: string
          monthlyRevenue?: number
          pendingCoaches?: number
          totalCoaches?: number
          totalRevenue?: number
          totalSessions?: number
          totalUsers?: number
          ulid?: string
          updatedAt?: string
        }
        Relationships: []
      }
      BillingEvent: {
        Row: {
          amount: number | null
          createdAt: string
          description: string
          metadata: Json | null
          organizationUlid: string | null
          paymentMethodUlid: string | null
          subscriptionUlid: string | null
          type: string
          ulid: string
          updatedAt: string
          userUlid: string | null
        }
        Insert: {
          amount?: number | null
          createdAt?: string
          description: string
          metadata?: Json | null
          organizationUlid?: string | null
          paymentMethodUlid?: string | null
          subscriptionUlid?: string | null
          type: string
          ulid: string
          updatedAt: string
          userUlid?: string | null
        }
        Update: {
          amount?: number | null
          createdAt?: string
          description?: string
          metadata?: Json | null
          organizationUlid?: string | null
          paymentMethodUlid?: string | null
          subscriptionUlid?: string | null
          type?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "BillingEvent_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "BillingEvent_paymentMethodUlid_fkey"
            columns: ["paymentMethodUlid"]
            isOneToOne: false
            referencedRelation: "PaymentMethod"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "BillingEvent_subscriptionUlid_fkey"
            columns: ["subscriptionUlid"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "BillingEvent_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      BudgetAllocation: {
        Row: {
          amount: number
          autoRenew: boolean
          createdAt: string
          endDate: string
          metadata: Json | null
          name: string
          spent: number
          startDate: string
          subscriptionUlid: string
          targetUlid: string | null
          type: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          amount: number
          autoRenew?: boolean
          createdAt?: string
          endDate: string
          metadata?: Json | null
          name: string
          spent?: number
          startDate: string
          subscriptionUlid: string
          targetUlid?: string | null
          type: string
          ulid: string
          updatedAt: string
        }
        Update: {
          amount?: number
          autoRenew?: boolean
          createdAt?: string
          endDate?: string
          metadata?: Json | null
          name?: string
          spent?: number
          startDate?: string
          subscriptionUlid?: string
          targetUlid?: string | null
          type?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "BudgetAllocation_subscriptionUlid_fkey"
            columns: ["subscriptionUlid"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "BudgetAllocation_targetUlid_fkey"
            columns: ["targetUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CalBooking: {
        Row: {
          allAttendees: string | null
          attendeeEmail: string
          attendeeLanguage: string | null
          attendeeName: string | null
          attendeePhoneNumber: string | null
          attendeeTimeZone: string | null
          bookingFieldsResponses: Json | null
          calBookingId: number | null
          calBookingUid: string
          calHostId: number | null
          coachUserUlid: string | null
          createdAt: string
          description: string | null
          duration: number | null
          endTime: string
          eventTypeId: number | null
          eventTypeSlug: string | null
          guests: Json | null
          hostEmail: string | null
          hostName: string | null
          hosts: Json | null
          hostTimeZone: string | null
          hostUsername: string | null
          icsUid: string | null
          location: string | null
          meetingUrl: string | null
          metadata: Json | null
          rating: number | null
          startTime: string
          status: Database["public"]["Enums"]["CalBookingStatus"]
          title: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          allAttendees?: string | null
          attendeeEmail: string
          attendeeLanguage?: string | null
          attendeeName?: string | null
          attendeePhoneNumber?: string | null
          attendeeTimeZone?: string | null
          bookingFieldsResponses?: Json | null
          calBookingId?: number | null
          calBookingUid: string
          calHostId?: number | null
          coachUserUlid?: string | null
          createdAt?: string
          description?: string | null
          duration?: number | null
          endTime: string
          eventTypeId?: number | null
          eventTypeSlug?: string | null
          guests?: Json | null
          hostEmail?: string | null
          hostName?: string | null
          hosts?: Json | null
          hostTimeZone?: string | null
          hostUsername?: string | null
          icsUid?: string | null
          location?: string | null
          meetingUrl?: string | null
          metadata?: Json | null
          rating?: number | null
          startTime: string
          status?: Database["public"]["Enums"]["CalBookingStatus"]
          title: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          allAttendees?: string | null
          attendeeEmail?: string
          attendeeLanguage?: string | null
          attendeeName?: string | null
          attendeePhoneNumber?: string | null
          attendeeTimeZone?: string | null
          bookingFieldsResponses?: Json | null
          calBookingId?: number | null
          calBookingUid?: string
          calHostId?: number | null
          coachUserUlid?: string | null
          createdAt?: string
          description?: string | null
          duration?: number | null
          endTime?: string
          eventTypeId?: number | null
          eventTypeSlug?: string | null
          guests?: Json | null
          hostEmail?: string | null
          hostName?: string | null
          hosts?: Json | null
          hostTimeZone?: string | null
          hostUsername?: string | null
          icsUid?: string | null
          location?: string | null
          meetingUrl?: string | null
          metadata?: Json | null
          rating?: number | null
          startTime?: string
          status?: Database["public"]["Enums"]["CalBookingStatus"]
          title?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "CalBooking_coachUserUlid_fkey"
            columns: ["coachUserUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "CalBooking_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CalendarIntegration: {
        Row: {
          calAccessToken: string
          calAccessTokenExpiresAt: string
          calManagedUserId: number
          calRefreshToken: string
          calUsername: string
          createdAt: string
          defaultScheduleId: number | null
          googleCalendarConnected: boolean | null
          lastSyncedAt: string | null
          locale: string | null
          office365CalendarConnected: boolean | null
          provider: string
          syncEnabled: boolean
          timeFormat: number | null
          timeZone: string | null
          ulid: string
          updatedAt: string
          userUlid: string
          weekStart: string | null
        }
        Insert: {
          calAccessToken: string
          calAccessTokenExpiresAt: string
          calManagedUserId: number
          calRefreshToken: string
          calUsername: string
          createdAt?: string
          defaultScheduleId?: number | null
          googleCalendarConnected?: boolean | null
          lastSyncedAt?: string | null
          locale?: string | null
          office365CalendarConnected?: boolean | null
          provider?: string
          syncEnabled?: boolean
          timeFormat?: number | null
          timeZone?: string | null
          ulid: string
          updatedAt: string
          userUlid: string
          weekStart?: string | null
        }
        Update: {
          calAccessToken?: string
          calAccessTokenExpiresAt?: string
          calManagedUserId?: number
          calRefreshToken?: string
          calUsername?: string
          createdAt?: string
          defaultScheduleId?: number | null
          googleCalendarConnected?: boolean | null
          lastSyncedAt?: string | null
          locale?: string | null
          office365CalendarConnected?: boolean | null
          provider?: string
          syncEnabled?: boolean
          timeFormat?: number | null
          timeZone?: string | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
          weekStart?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CalendarIntegration_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CalEventType: {
        Row: {
          afterEventBuffer: number | null
          beforeEventBuffer: number | null
          bookerLayouts: Json | null
          bookingLimits: Json | null
          calendarIntegrationUlid: string
          calEventTypeId: number | null
          color: Json | null
          createdAt: string
          currency: string | null
          customName: string | null
          description: string | null
          disableGuests: boolean | null
          discountPercentage: number | null
          hidden: boolean
          hideCalendarEventDetails: boolean | null
          isActive: boolean
          isDefault: boolean
          isFree: boolean
          lengthInMinutes: number
          locations: Json | null
          maxParticipants: number | null
          metadata: Json | null
          minimumBookingNotice: number | null
          name: string
          organizationUlid: string | null
          position: number | null
          price: number | null
          requiresConfirmation: boolean
          scheduling: Database["public"]["Enums"]["CalSchedulingType"]
          slotInterval: number | null
          slug: string | null
          successRedirectUrl: string | null
          ulid: string
          updatedAt: string
          useDestinationCalendarEmail: boolean | null
        }
        Insert: {
          afterEventBuffer?: number | null
          beforeEventBuffer?: number | null
          bookerLayouts?: Json | null
          bookingLimits?: Json | null
          calendarIntegrationUlid: string
          calEventTypeId?: number | null
          color?: Json | null
          createdAt?: string
          currency?: string | null
          customName?: string | null
          description?: string | null
          disableGuests?: boolean | null
          discountPercentage?: number | null
          hidden?: boolean
          hideCalendarEventDetails?: boolean | null
          isActive?: boolean
          isDefault?: boolean
          isFree?: boolean
          lengthInMinutes: number
          locations?: Json | null
          maxParticipants?: number | null
          metadata?: Json | null
          minimumBookingNotice?: number | null
          name: string
          organizationUlid?: string | null
          position?: number | null
          price?: number | null
          requiresConfirmation?: boolean
          scheduling?: Database["public"]["Enums"]["CalSchedulingType"]
          slotInterval?: number | null
          slug?: string | null
          successRedirectUrl?: string | null
          ulid: string
          updatedAt: string
          useDestinationCalendarEmail?: boolean | null
        }
        Update: {
          afterEventBuffer?: number | null
          beforeEventBuffer?: number | null
          bookerLayouts?: Json | null
          bookingLimits?: Json | null
          calendarIntegrationUlid?: string
          calEventTypeId?: number | null
          color?: Json | null
          createdAt?: string
          currency?: string | null
          customName?: string | null
          description?: string | null
          disableGuests?: boolean | null
          discountPercentage?: number | null
          hidden?: boolean
          hideCalendarEventDetails?: boolean | null
          isActive?: boolean
          isDefault?: boolean
          isFree?: boolean
          lengthInMinutes?: number
          locations?: Json | null
          maxParticipants?: number | null
          metadata?: Json | null
          minimumBookingNotice?: number | null
          name?: string
          organizationUlid?: string | null
          position?: number | null
          price?: number | null
          requiresConfirmation?: boolean
          scheduling?: Database["public"]["Enums"]["CalSchedulingType"]
          slotInterval?: number | null
          slug?: string | null
          successRedirectUrl?: string | null
          ulid?: string
          updatedAt?: string
          useDestinationCalendarEmail?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "CalEventType_calendarIntegrationUlid_fkey"
            columns: ["calendarIntegrationUlid"]
            isOneToOne: false
            referencedRelation: "CalendarIntegration"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Chargeback: {
        Row: {
          createdAt: string
          paymentUlid: string
          reason: string | null
          status: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          paymentUlid: string
          reason?: string | null
          status?: string
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          paymentUlid?: string
          reason?: string | null
          status?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Chargeback_paymentUlid_fkey"
            columns: ["paymentUlid"]
            isOneToOne: false
            referencedRelation: "Payment"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CoachApplication: {
        Row: {
          aboutYou: string | null
          applicantUlid: string
          createdAt: string
          draftData: Json | null
          draftVersion: number
          isDraft: boolean
          lastSavedAt: string | null
          linkedIn: string | null
          primaryDomain: string | null
          primarySocialMedia: string | null
          realEstateDomains: string[] | null
          resumeUrl: string | null
          reviewDate: string | null
          reviewerUlid: string | null
          reviewNotes: string | null
          status: Database["public"]["Enums"]["CoachApplicationStatus"]
          superPower: string
          ulid: string
          updatedAt: string
          yearsOfExperience: number
        }
        Insert: {
          aboutYou?: string | null
          applicantUlid: string
          createdAt?: string
          draftData?: Json | null
          draftVersion?: number
          isDraft?: boolean
          lastSavedAt?: string | null
          linkedIn?: string | null
          primaryDomain?: string | null
          primarySocialMedia?: string | null
          realEstateDomains?: string[] | null
          resumeUrl?: string | null
          reviewDate?: string | null
          reviewerUlid?: string | null
          reviewNotes?: string | null
          status?: Database["public"]["Enums"]["CoachApplicationStatus"]
          superPower: string
          ulid: string
          updatedAt: string
          yearsOfExperience: number
        }
        Update: {
          aboutYou?: string | null
          applicantUlid?: string
          createdAt?: string
          draftData?: Json | null
          draftVersion?: number
          isDraft?: boolean
          lastSavedAt?: string | null
          linkedIn?: string | null
          primaryDomain?: string | null
          primarySocialMedia?: string | null
          realEstateDomains?: string[] | null
          resumeUrl?: string | null
          reviewDate?: string | null
          reviewerUlid?: string | null
          reviewNotes?: string | null
          status?: Database["public"]["Enums"]["CoachApplicationStatus"]
          superPower?: string
          ulid?: string
          updatedAt?: string
          yearsOfExperience?: number
        }
        Relationships: [
          {
            foreignKeyName: "CoachApplication_applicantUlid_fkey"
            columns: ["applicantUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "CoachApplication_reviewerUlid_fkey"
            columns: ["reviewerUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CoachingAvailabilitySchedule: {
        Row: {
          active: boolean
          allowCustomDuration: boolean
          availability: Json
          averageRating: number | null
          bufferAfter: number
          bufferBefore: number
          calendlyEnabled: boolean
          calScheduleId: number | null
          createdAt: string
          defaultDuration: number
          isDefault: boolean
          lastSyncedAt: string | null
          maximumDuration: number
          minimumDuration: number
          name: string
          overrides: Json | null
          syncSource: string
          timeZone: string
          totalSessions: number
          ulid: string
          updatedAt: string
          userUlid: string
          zoomEnabled: boolean
        }
        Insert: {
          active?: boolean
          allowCustomDuration?: boolean
          availability: Json
          averageRating?: number | null
          bufferAfter?: number
          bufferBefore?: number
          calendlyEnabled?: boolean
          calScheduleId?: number | null
          createdAt?: string
          defaultDuration?: number
          isDefault?: boolean
          lastSyncedAt?: string | null
          maximumDuration?: number
          minimumDuration?: number
          name: string
          overrides?: Json | null
          syncSource?: string
          timeZone: string
          totalSessions?: number
          ulid: string
          updatedAt: string
          userUlid: string
          zoomEnabled?: boolean
        }
        Update: {
          active?: boolean
          allowCustomDuration?: boolean
          availability?: Json
          averageRating?: number | null
          bufferAfter?: number
          bufferBefore?: number
          calendlyEnabled?: boolean
          calScheduleId?: number | null
          createdAt?: string
          defaultDuration?: number
          isDefault?: boolean
          lastSyncedAt?: string | null
          maximumDuration?: number
          minimumDuration?: number
          name?: string
          overrides?: Json | null
          syncSource?: string
          timeZone?: string
          totalSessions?: number
          ulid?: string
          updatedAt?: string
          userUlid?: string
          zoomEnabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "CoachingAvailabilitySchedule_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CoachProfile: {
        Row: {
          allowCustomDuration: boolean
          averageRating: number | null
          coachPrimaryDomain:
            | Database["public"]["Enums"]["RealEstateDomain"]
            | null
          coachRealEstateDomains:
            | Database["public"]["Enums"]["RealEstateDomain"][]
            | null
          coachSkills: string[] | null
          completionPercentage: number
          createdAt: string
          defaultDuration: number
          eventTypeUrl: string | null
          facebookUrl: string | null
          hourlyRate: number | null
          instagramUrl: string | null
          isActive: boolean
          lastSlugUpdateAt: string | null
          linkedinUrl: string | null
          maximumDuration: number
          minimumDuration: number
          profileSlug: string | null
          profileStatus: Database["public"]["Enums"]["ProfileStatus"]
          slogan: string | null
          tiktokUrl: string | null
          totalSessions: number
          ulid: string
          updatedAt: string
          userUlid: string
          websiteUrl: string | null
          xUrl: string | null
          yearsCoaching: number | null
          youtubeUrl: string | null
        }
        Insert: {
          allowCustomDuration?: boolean
          averageRating?: number | null
          coachPrimaryDomain?:
            | Database["public"]["Enums"]["RealEstateDomain"]
            | null
          coachRealEstateDomains?:
            | Database["public"]["Enums"]["RealEstateDomain"][]
            | null
          coachSkills?: string[] | null
          completionPercentage?: number
          createdAt?: string
          defaultDuration?: number
          eventTypeUrl?: string | null
          facebookUrl?: string | null
          hourlyRate?: number | null
          instagramUrl?: string | null
          isActive?: boolean
          lastSlugUpdateAt?: string | null
          linkedinUrl?: string | null
          maximumDuration?: number
          minimumDuration?: number
          profileSlug?: string | null
          profileStatus?: Database["public"]["Enums"]["ProfileStatus"]
          slogan?: string | null
          tiktokUrl?: string | null
          totalSessions?: number
          ulid: string
          updatedAt: string
          userUlid: string
          websiteUrl?: string | null
          xUrl?: string | null
          yearsCoaching?: number | null
          youtubeUrl?: string | null
        }
        Update: {
          allowCustomDuration?: boolean
          averageRating?: number | null
          coachPrimaryDomain?:
            | Database["public"]["Enums"]["RealEstateDomain"]
            | null
          coachRealEstateDomains?:
            | Database["public"]["Enums"]["RealEstateDomain"][]
            | null
          coachSkills?: string[] | null
          completionPercentage?: number
          createdAt?: string
          defaultDuration?: number
          eventTypeUrl?: string | null
          facebookUrl?: string | null
          hourlyRate?: number | null
          instagramUrl?: string | null
          isActive?: boolean
          lastSlugUpdateAt?: string | null
          linkedinUrl?: string | null
          maximumDuration?: number
          minimumDuration?: number
          profileSlug?: string | null
          profileStatus?: Database["public"]["Enums"]["ProfileStatus"]
          slogan?: string | null
          tiktokUrl?: string | null
          totalSessions?: number
          ulid?: string
          updatedAt?: string
          userUlid?: string
          websiteUrl?: string | null
          xUrl?: string | null
          yearsCoaching?: number | null
          youtubeUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CoachProfile_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CoachZoomConfig: {
        Row: {
          coachUlid: string
          createdAt: string
          defaultSettings: Json | null
          isActive: boolean
          ulid: string
          updatedAt: string
          zoomAccountEmail: string | null
          zoomAccountId: string | null
          zoomApiKey: string
          zoomApiSecret: string
        }
        Insert: {
          coachUlid: string
          createdAt?: string
          defaultSettings?: Json | null
          isActive?: boolean
          ulid: string
          updatedAt: string
          zoomAccountEmail?: string | null
          zoomAccountId?: string | null
          zoomApiKey: string
          zoomApiSecret: string
        }
        Update: {
          coachUlid?: string
          createdAt?: string
          defaultSettings?: Json | null
          isActive?: boolean
          ulid?: string
          updatedAt?: string
          zoomAccountEmail?: string | null
          zoomAccountId?: string | null
          zoomApiKey?: string
          zoomApiSecret?: string
        }
        Relationships: [
          {
            foreignKeyName: "CoachZoomConfig_coachUlid_fkey"
            columns: ["coachUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Dispute: {
        Row: {
          amount: number
          createdAt: string
          currency: string
          evidence: Json
          evidenceDueBy: string
          paymentUlid: string | null
          reason: string
          sessionUlid: string | null
          status: string
          stripeDisputeId: string
          stripePaymentIntentId: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          amount: number
          createdAt?: string
          currency: string
          evidence: Json
          evidenceDueBy: string
          paymentUlid?: string | null
          reason: string
          sessionUlid?: string | null
          status: string
          stripeDisputeId: string
          stripePaymentIntentId: string
          ulid: string
          updatedAt: string
        }
        Update: {
          amount?: number
          createdAt?: string
          currency?: string
          evidence?: Json
          evidenceDueBy?: string
          paymentUlid?: string | null
          reason?: string
          sessionUlid?: string | null
          status?: string
          stripeDisputeId?: string
          stripePaymentIntentId?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Dispute_paymentUlid_fkey"
            columns: ["paymentUlid"]
            isOneToOne: false
            referencedRelation: "Payment"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Dispute_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
        ]
      }
      EnterpriseLeads: {
        Row: {
          assignedToUlid: string | null
          companyName: string
          createdAt: string
          email: string
          fullName: string
          industry: Database["public"]["Enums"]["OrgIndustry"]
          jobTitle: string
          lastContactedAt: string | null
          metadata: Json | null
          multipleOffices: boolean
          nextFollowUpDate: string | null
          notes: Json | null
          phone: string
          priority: string
          status: string
          teamSize: string
          ulid: string
          updatedAt: string
          website: string | null
        }
        Insert: {
          assignedToUlid?: string | null
          companyName: string
          createdAt?: string
          email: string
          fullName: string
          industry: Database["public"]["Enums"]["OrgIndustry"]
          jobTitle: string
          lastContactedAt?: string | null
          metadata?: Json | null
          multipleOffices?: boolean
          nextFollowUpDate?: string | null
          notes?: Json | null
          phone: string
          priority?: string
          status?: string
          teamSize: string
          ulid: string
          updatedAt: string
          website?: string | null
        }
        Update: {
          assignedToUlid?: string | null
          companyName?: string
          createdAt?: string
          email?: string
          fullName?: string
          industry?: Database["public"]["Enums"]["OrgIndustry"]
          jobTitle?: string
          lastContactedAt?: string | null
          metadata?: Json | null
          multipleOffices?: boolean
          nextFollowUpDate?: string | null
          notes?: Json | null
          phone?: string
          priority?: string
          status?: string
          teamSize?: string
          ulid?: string
          updatedAt?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "EnterpriseLeads_assignedToUlid_fkey"
            columns: ["assignedToUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Goal: {
        Row: {
          completedAt: string | null
          createdAt: string
          description: string | null
          dueDate: string
          growthPlan: string | null
          milestones: Json | null
          organizationUlid: string | null
          progress: Json | null
          startDate: string
          status: Database["public"]["Enums"]["GoalStatus"]
          target: Json | null
          title: string
          type: Database["public"]["Enums"]["GoalType"]
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string
          description?: string | null
          dueDate: string
          growthPlan?: string | null
          milestones?: Json | null
          organizationUlid?: string | null
          progress?: Json | null
          startDate: string
          status?: Database["public"]["Enums"]["GoalStatus"]
          target?: Json | null
          title: string
          type: Database["public"]["Enums"]["GoalType"]
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string
          description?: string | null
          dueDate?: string
          growthPlan?: string | null
          milestones?: Json | null
          organizationUlid?: string | null
          progress?: Json | null
          startDate?: string
          status?: Database["public"]["Enums"]["GoalStatus"]
          target?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["GoalType"]
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "Goal_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Goal_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Invoice: {
        Row: {
          amount: number
          createdAt: string
          currency: string
          dueDate: string
          metadata: Json | null
          paidAt: string | null
          status: string
          stripeInvoiceId: string
          subscriptionUlid: string
          ulid: string
          updatedAt: string
          userUlid: string | null
        }
        Insert: {
          amount: number
          createdAt?: string
          currency: string
          dueDate: string
          metadata?: Json | null
          paidAt?: string | null
          status: string
          stripeInvoiceId: string
          subscriptionUlid: string
          ulid: string
          updatedAt: string
          userUlid?: string | null
        }
        Update: {
          amount?: number
          createdAt?: string
          currency?: string
          dueDate?: string
          metadata?: Json | null
          paidAt?: string | null
          status?: string
          stripeInvoiceId?: string
          subscriptionUlid?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Invoice_subscriptionUlid_fkey"
            columns: ["subscriptionUlid"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Invoice_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      MarketingProfile: {
        Row: {
          blogUrl: string | null
          brandAssets: Json | null
          brandColors: Json | null
          brandGuidelines: Json | null
          campaignHistory: Json | null
          createdAt: string
          facebookPixelId: string | null
          geographicFocus: Json | null
          googleAnalyticsId: string | null
          logoUrl: string | null
          marketingAreas: string[] | null
          marketingMaterials: Json | null
          marketingTeam: Json | null
          organizationUlid: string | null
          pressFeatures: Json | null
          slogan: string | null
          socialMediaLinks: Json
          targetAudience: string[] | null
          testimonials: Json | null
          ulid: string
          updatedAt: string
          userUlid: string | null
          websiteUrl: string | null
        }
        Insert: {
          blogUrl?: string | null
          brandAssets?: Json | null
          brandColors?: Json | null
          brandGuidelines?: Json | null
          campaignHistory?: Json | null
          createdAt?: string
          facebookPixelId?: string | null
          geographicFocus?: Json | null
          googleAnalyticsId?: string | null
          logoUrl?: string | null
          marketingAreas?: string[] | null
          marketingMaterials?: Json | null
          marketingTeam?: Json | null
          organizationUlid?: string | null
          pressFeatures?: Json | null
          slogan?: string | null
          socialMediaLinks: Json
          targetAudience?: string[] | null
          testimonials?: Json | null
          ulid: string
          updatedAt: string
          userUlid?: string | null
          websiteUrl?: string | null
        }
        Update: {
          blogUrl?: string | null
          brandAssets?: Json | null
          brandColors?: Json | null
          brandGuidelines?: Json | null
          campaignHistory?: Json | null
          createdAt?: string
          facebookPixelId?: string | null
          geographicFocus?: Json | null
          googleAnalyticsId?: string | null
          logoUrl?: string | null
          marketingAreas?: string[] | null
          marketingMaterials?: Json | null
          marketingTeam?: Json | null
          organizationUlid?: string | null
          pressFeatures?: Json | null
          slogan?: string | null
          socialMediaLinks?: Json
          targetAudience?: string[] | null
          testimonials?: Json | null
          ulid?: string
          updatedAt?: string
          userUlid?: string | null
          websiteUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "MarketingProfile_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "MarketingProfile_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      MenteeProfile: {
        Row: {
          createdAt: string
          experienceLevel: string | null
          focusAreas: string[] | null
          isActive: boolean
          lastSessionDate: string | null
          learningStyle: string | null
          sessionsCompleted: number
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          experienceLevel?: string | null
          focusAreas?: string[] | null
          isActive?: boolean
          lastSessionDate?: string | null
          learningStyle?: string | null
          sessionsCompleted?: number
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          experienceLevel?: string | null
          focusAreas?: string[] | null
          isActive?: boolean
          lastSessionDate?: string | null
          learningStyle?: string | null
          sessionsCompleted?: number
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "MenteeProfile_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Message: {
        Row: {
          content: string
          createdAt: string
          readStatus: string
          recipientUlid: string
          senderUlid: string
          sentAt: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          content: string
          createdAt?: string
          readStatus?: string
          recipientUlid: string
          senderUlid: string
          sentAt?: string
          ulid: string
          updatedAt: string
        }
        Update: {
          content?: string
          createdAt?: string
          readStatus?: string
          recipientUlid?: string
          senderUlid?: string
          sentAt?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_recipientUlid_fkey"
            columns: ["recipientUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Message_senderUlid_fkey"
            columns: ["senderUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Note: {
        Row: {
          authorUlid: string
          content: string
          createdAt: string
          relatedUserUlid: string | null
          sessionUlid: string | null
          ulid: string
          updatedAt: string
          visibility: string
        }
        Insert: {
          authorUlid: string
          content: string
          createdAt?: string
          relatedUserUlid?: string | null
          sessionUlid?: string | null
          ulid: string
          updatedAt: string
          visibility?: string
        }
        Update: {
          authorUlid?: string
          content?: string
          createdAt?: string
          relatedUserUlid?: string | null
          sessionUlid?: string | null
          ulid?: string
          updatedAt?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "Note_authorUlid_fkey"
            columns: ["authorUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Note_relatedUserUlid_fkey"
            columns: ["relatedUserUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Note_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Organization: {
        Row: {
          createdAt: string
          description: string | null
          industry: Database["public"]["Enums"]["OrgIndustry"] | null
          level: Database["public"]["Enums"]["OrgLevel"]
          licenseNumbers: Json | null
          metadata: Json | null
          name: string
          parentUlid: string | null
          specializations: string[] | null
          status: string
          tier: Database["public"]["Enums"]["OrgTier"]
          type: Database["public"]["Enums"]["OrgType"]
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          industry?: Database["public"]["Enums"]["OrgIndustry"] | null
          level?: Database["public"]["Enums"]["OrgLevel"]
          licenseNumbers?: Json | null
          metadata?: Json | null
          name: string
          parentUlid?: string | null
          specializations?: string[] | null
          status?: string
          tier?: Database["public"]["Enums"]["OrgTier"]
          type?: Database["public"]["Enums"]["OrgType"]
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          industry?: Database["public"]["Enums"]["OrgIndustry"] | null
          level?: Database["public"]["Enums"]["OrgLevel"]
          licenseNumbers?: Json | null
          metadata?: Json | null
          name?: string
          parentUlid?: string | null
          specializations?: string[] | null
          status?: string
          tier?: Database["public"]["Enums"]["OrgTier"]
          type?: Database["public"]["Enums"]["OrgType"]
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Organization_parentUlid_fkey"
            columns: ["parentUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
        ]
      }
      OrganizationMember: {
        Row: {
          createdAt: string
          customPermissions: Json | null
          metadata: Json | null
          organizationUlid: string
          role: Database["public"]["Enums"]["OrgRole"]
          scope: string | null
          status: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          customPermissions?: Json | null
          metadata?: Json | null
          organizationUlid: string
          role?: Database["public"]["Enums"]["OrgRole"]
          scope?: string | null
          status?: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          customPermissions?: Json | null
          metadata?: Json | null
          organizationUlid?: string
          role?: Database["public"]["Enums"]["OrgRole"]
          scope?: string | null
          status?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrganizationMember_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "OrganizationMember_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Payment: {
        Row: {
          amount: number
          createdAt: string
          currency: Database["public"]["Enums"]["Currency"]
          payeeUlid: string
          payerUlid: string
          sessionUlid: string | null
          status: Database["public"]["Enums"]["PaymentStatus"]
          stripePaymentId: string | null
          ulid: string
          updatedAt: string
        }
        Insert: {
          amount: number
          createdAt?: string
          currency?: Database["public"]["Enums"]["Currency"]
          payeeUlid: string
          payerUlid: string
          sessionUlid?: string | null
          status?: Database["public"]["Enums"]["PaymentStatus"]
          stripePaymentId?: string | null
          ulid: string
          updatedAt: string
        }
        Update: {
          amount?: number
          createdAt?: string
          currency?: Database["public"]["Enums"]["Currency"]
          payeeUlid?: string
          payerUlid?: string
          sessionUlid?: string | null
          status?: Database["public"]["Enums"]["PaymentStatus"]
          stripePaymentId?: string | null
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Payment_payeeUlid_fkey"
            columns: ["payeeUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Payment_payerUlid_fkey"
            columns: ["payerUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Payment_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
        ]
      }
      PaymentMethod: {
        Row: {
          billingAddress: Json | null
          brand: string | null
          country: string | null
          createdAt: string
          expMonth: number | null
          expYear: number | null
          isDefault: boolean
          last4: string
          metadata: Json | null
          organizationUlid: string | null
          stripePaymentId: string
          type: Database["public"]["Enums"]["PaymentMethodType"]
          ulid: string
          updatedAt: string
          userUlid: string | null
        }
        Insert: {
          billingAddress?: Json | null
          brand?: string | null
          country?: string | null
          createdAt?: string
          expMonth?: number | null
          expYear?: number | null
          isDefault?: boolean
          last4: string
          metadata?: Json | null
          organizationUlid?: string | null
          stripePaymentId: string
          type: Database["public"]["Enums"]["PaymentMethodType"]
          ulid: string
          updatedAt: string
          userUlid?: string | null
        }
        Update: {
          billingAddress?: Json | null
          brand?: string | null
          country?: string | null
          createdAt?: string
          expMonth?: number | null
          expYear?: number | null
          isDefault?: boolean
          last4?: string
          metadata?: Json | null
          organizationUlid?: string | null
          stripePaymentId?: string
          type?: Database["public"]["Enums"]["PaymentMethodType"]
          ulid?: string
          updatedAt?: string
          userUlid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PaymentMethod_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "PaymentMethod_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Payout: {
        Row: {
          amount: number
          createdAt: string
          currency: string
          payeeUlid: string
          processedAt: string | null
          scheduledDate: string
          status: Database["public"]["Enums"]["PayoutStatus"]
          stripeTransferId: string | null
          ulid: string
          updatedAt: string
        }
        Insert: {
          amount: number
          createdAt?: string
          currency?: string
          payeeUlid: string
          processedAt?: string | null
          scheduledDate: string
          status?: Database["public"]["Enums"]["PayoutStatus"]
          stripeTransferId?: string | null
          ulid: string
          updatedAt: string
        }
        Update: {
          amount?: number
          createdAt?: string
          currency?: string
          payeeUlid?: string
          processedAt?: string | null
          scheduledDate?: string
          status?: Database["public"]["Enums"]["PayoutStatus"]
          stripeTransferId?: string | null
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Payout_payeeUlid_fkey"
            columns: ["payeeUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      PortfolioItem: {
        Row: {
          address: string | null
          commercialDealType:
            | Database["public"]["Enums"]["CommercialDealType"]
            | null
          commercialPropertyType:
            | Database["public"]["Enums"]["CommercialPropertyType"]
            | null
          createdAt: string
          date: string
          description: string | null
          featured: boolean
          financialDetails: Json | null
          imageUrls: Json | null
          insuranceType: Database["public"]["Enums"]["InsuranceType"] | null
          investmentStrategy:
            | Database["public"]["Enums"]["InvestmentStrategy"]
            | null
          isVisible: boolean
          loanType: Database["public"]["Enums"]["LoanType"] | null
          location: Json | null
          metrics: Json | null
          privateCreditLoanType:
            | Database["public"]["Enums"]["PrivateCreditLoanType"]
            | null
          propertyManagerType:
            | Database["public"]["Enums"]["PropertyManagerType"]
            | null
          propertySubType: Database["public"]["Enums"]["PropertySubType"] | null
          propertyType: Database["public"]["Enums"]["PropertyType"] | null
          tags: string[] | null
          title: string
          titleEscrowType: Database["public"]["Enums"]["TitleEscrowType"] | null
          type: Database["public"]["Enums"]["PortfolioItemType"]
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          address?: string | null
          commercialDealType?:
            | Database["public"]["Enums"]["CommercialDealType"]
            | null
          commercialPropertyType?:
            | Database["public"]["Enums"]["CommercialPropertyType"]
            | null
          createdAt?: string
          date: string
          description?: string | null
          featured?: boolean
          financialDetails?: Json | null
          imageUrls?: Json | null
          insuranceType?: Database["public"]["Enums"]["InsuranceType"] | null
          investmentStrategy?:
            | Database["public"]["Enums"]["InvestmentStrategy"]
            | null
          isVisible?: boolean
          loanType?: Database["public"]["Enums"]["LoanType"] | null
          location?: Json | null
          metrics?: Json | null
          privateCreditLoanType?:
            | Database["public"]["Enums"]["PrivateCreditLoanType"]
            | null
          propertyManagerType?:
            | Database["public"]["Enums"]["PropertyManagerType"]
            | null
          propertySubType?:
            | Database["public"]["Enums"]["PropertySubType"]
            | null
          propertyType?: Database["public"]["Enums"]["PropertyType"] | null
          tags?: string[] | null
          title: string
          titleEscrowType?:
            | Database["public"]["Enums"]["TitleEscrowType"]
            | null
          type: Database["public"]["Enums"]["PortfolioItemType"]
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          address?: string | null
          commercialDealType?:
            | Database["public"]["Enums"]["CommercialDealType"]
            | null
          commercialPropertyType?:
            | Database["public"]["Enums"]["CommercialPropertyType"]
            | null
          createdAt?: string
          date?: string
          description?: string | null
          featured?: boolean
          financialDetails?: Json | null
          imageUrls?: Json | null
          insuranceType?: Database["public"]["Enums"]["InsuranceType"] | null
          investmentStrategy?:
            | Database["public"]["Enums"]["InvestmentStrategy"]
            | null
          isVisible?: boolean
          loanType?: Database["public"]["Enums"]["LoanType"] | null
          location?: Json | null
          metrics?: Json | null
          privateCreditLoanType?:
            | Database["public"]["Enums"]["PrivateCreditLoanType"]
            | null
          propertyManagerType?:
            | Database["public"]["Enums"]["PropertyManagerType"]
            | null
          propertySubType?:
            | Database["public"]["Enums"]["PropertySubType"]
            | null
          propertyType?: Database["public"]["Enums"]["PropertyType"] | null
          tags?: string[] | null
          title?: string
          titleEscrowType?:
            | Database["public"]["Enums"]["TitleEscrowType"]
            | null
          type?: Database["public"]["Enums"]["PortfolioItemType"]
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "PortfolioItem_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      ProfessionalRecognition: {
        Row: {
          coachUlid: string | null
          createdAt: string
          description: string | null
          expiryDate: string | null
          industryType: string | null
          issueDate: string
          issuer: string | null
          isVisible: boolean
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["RecognitionType"]
          ulid: string
          updatedAt: string
          userUlid: string
          verificationUrl: string | null
        }
        Insert: {
          coachUlid?: string | null
          createdAt?: string
          description?: string | null
          expiryDate?: string | null
          industryType?: string | null
          issueDate: string
          issuer?: string | null
          isVisible?: boolean
          metadata?: Json | null
          title: string
          type: Database["public"]["Enums"]["RecognitionType"]
          ulid: string
          updatedAt: string
          userUlid: string
          verificationUrl?: string | null
        }
        Update: {
          coachUlid?: string | null
          createdAt?: string
          description?: string | null
          expiryDate?: string | null
          industryType?: string | null
          issueDate?: string
          issuer?: string | null
          isVisible?: boolean
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["RecognitionType"]
          ulid?: string
          updatedAt?: string
          userUlid?: string
          verificationUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ProfessionalRecognition_coachUlid_fkey"
            columns: ["coachUlid"]
            isOneToOne: false
            referencedRelation: "CoachProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "ProfessionalRecognition_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Referral: {
        Row: {
          createdAt: string
          refereeUlid: string
          referralCode: string
          referrerUlid: string
          status: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          refereeUlid: string
          referralCode: string
          referrerUlid: string
          status?: string
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          refereeUlid?: string
          referralCode?: string
          referrerUlid?: string
          status?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Referral_refereeUlid_fkey"
            columns: ["refereeUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Referral_referrerUlid_fkey"
            columns: ["referrerUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Refund: {
        Row: {
          createdAt: string
          paymentUlid: string
          reason: string | null
          status: Database["public"]["Enums"]["RefundStatus"]
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          paymentUlid: string
          reason?: string | null
          status?: Database["public"]["Enums"]["RefundStatus"]
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          paymentUlid?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["RefundStatus"]
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Refund_paymentUlid_fkey"
            columns: ["paymentUlid"]
            isOneToOne: false
            referencedRelation: "Payment"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Region: {
        Row: {
          createdAt: string
          metadata: Json | null
          name: string
          organizationUlid: string
          parentUlid: string | null
          type: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          metadata?: Json | null
          name: string
          organizationUlid: string
          parentUlid?: string | null
          type: string
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          metadata?: Json | null
          name?: string
          organizationUlid?: string
          parentUlid?: string | null
          type?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Region_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Region_parentUlid_fkey"
            columns: ["parentUlid"]
            isOneToOne: false
            referencedRelation: "Region"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Reminder: {
        Row: {
          createdAt: string
          message: string
          remindAt: string
          sessionUlid: string | null
          status: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          message: string
          remindAt: string
          sessionUlid?: string | null
          status?: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          message?: string
          remindAt?: string
          sessionUlid?: string | null
          status?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "Reminder_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Reminder_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Review: {
        Row: {
          comment: string | null
          createdAt: string
          isVerified: boolean
          rating: number
          revieweeUlid: string
          reviewerUlid: string
          sessionUlid: string | null
          status: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          comment?: string | null
          createdAt?: string
          isVerified?: boolean
          rating: number
          revieweeUlid: string
          reviewerUlid: string
          sessionUlid?: string | null
          status?: string
          ulid: string
          updatedAt: string
        }
        Update: {
          comment?: string | null
          createdAt?: string
          isVerified?: boolean
          rating?: number
          revieweeUlid?: string
          reviewerUlid?: string
          sessionUlid?: string | null
          status?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Review_revieweeUlid_fkey"
            columns: ["revieweeUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Review_reviewerUlid_fkey"
            columns: ["reviewerUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Review_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
        ]
      }
      RolePermission: {
        Row: {
          createdAt: string
          metadata: Json | null
          organizationUlid: string
          permissions: Json
          role: Database["public"]["Enums"]["OrgRole"]
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          metadata?: Json | null
          organizationUlid: string
          permissions: Json
          role: Database["public"]["Enums"]["OrgRole"]
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          metadata?: Json | null
          organizationUlid?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["OrgRole"]
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "RolePermission_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
        ]
      }
      SeatLicense: {
        Row: {
          assignedAt: string
          assignedByUserUlid: string | null
          createdAt: string
          departmentName: string | null
          metadata: Json | null
          revokedAt: string | null
          status: string
          subscriptionUlid: string
          teamName: string | null
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          assignedAt?: string
          assignedByUserUlid?: string | null
          createdAt?: string
          departmentName?: string | null
          metadata?: Json | null
          revokedAt?: string | null
          status?: string
          subscriptionUlid: string
          teamName?: string | null
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          assignedAt?: string
          assignedByUserUlid?: string | null
          createdAt?: string
          departmentName?: string | null
          metadata?: Json | null
          revokedAt?: string | null
          status?: string
          subscriptionUlid?: string
          teamName?: string | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "SeatLicense_assignedByUserUlid_fkey"
            columns: ["assignedByUserUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "SeatLicense_subscriptionUlid_fkey"
            columns: ["subscriptionUlid"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "SeatLicense_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Session: {
        Row: {
          absenceHistory: Json | null
          absentCoach: boolean | null
          absentCoachMarkedAt: string | null
          absentCoachMarkedBy: string | null
          absentMentee: boolean | null
          absentMenteeMarkedAt: string | null
          absentMenteeMarkedBy: string | null
          calBookingUlid: string | null
          calEventTypeUlid: string | null
          cancellationFee: number | null
          cancellationHistory: Json | null
          cancellationPolicy: string | null
          cancellationReason: string | null
          cancelledAt: string | null
          cancelledBy: string | null
          cancelledByUlid: string | null
          coachUlid: string
          createdAt: string
          currency: string | null
          endTime: string
          isRefundable: boolean
          menteeUlid: string
          originalSessionUlid: string | null
          paymentIntentId: string | null
          paymentMethod: string | null
          paymentStatus: string | null
          price: number | null
          refundAmount: number | null
          refundReason: string | null
          refundStatus: string | null
          rescheduledBy: string | null
          rescheduledFromUlid: string | null
          rescheduledToUlid: string | null
          reschedulingHistory: Json | null
          reschedulingReason: string | null
          sessionNotes: string | null
          sessionType: Database["public"]["Enums"]["SessionType"]
          startTime: string
          status: Database["public"]["Enums"]["SessionStatus"]
          ulid: string
          updatedAt: string
          zoomJoinUrl: string | null
          zoomMeetingId: string | null
          zoomMeetingPassword: string | null
          zoomMeetingSettings: Json | null
          zoomMetadata: Json | null
          zoomStartUrl: string | null
        }
        Insert: {
          absenceHistory?: Json | null
          absentCoach?: boolean | null
          absentCoachMarkedAt?: string | null
          absentCoachMarkedBy?: string | null
          absentMentee?: boolean | null
          absentMenteeMarkedAt?: string | null
          absentMenteeMarkedBy?: string | null
          calBookingUlid?: string | null
          calEventTypeUlid?: string | null
          cancellationFee?: number | null
          cancellationHistory?: Json | null
          cancellationPolicy?: string | null
          cancellationReason?: string | null
          cancelledAt?: string | null
          cancelledBy?: string | null
          cancelledByUlid?: string | null
          coachUlid: string
          createdAt?: string
          currency?: string | null
          endTime: string
          isRefundable?: boolean
          menteeUlid: string
          originalSessionUlid?: string | null
          paymentIntentId?: string | null
          paymentMethod?: string | null
          paymentStatus?: string | null
          price?: number | null
          refundAmount?: number | null
          refundReason?: string | null
          refundStatus?: string | null
          rescheduledBy?: string | null
          rescheduledFromUlid?: string | null
          rescheduledToUlid?: string | null
          reschedulingHistory?: Json | null
          reschedulingReason?: string | null
          sessionNotes?: string | null
          sessionType: Database["public"]["Enums"]["SessionType"]
          startTime: string
          status: Database["public"]["Enums"]["SessionStatus"]
          ulid: string
          updatedAt: string
          zoomJoinUrl?: string | null
          zoomMeetingId?: string | null
          zoomMeetingPassword?: string | null
          zoomMeetingSettings?: Json | null
          zoomMetadata?: Json | null
          zoomStartUrl?: string | null
        }
        Update: {
          absenceHistory?: Json | null
          absentCoach?: boolean | null
          absentCoachMarkedAt?: string | null
          absentCoachMarkedBy?: string | null
          absentMentee?: boolean | null
          absentMenteeMarkedAt?: string | null
          absentMenteeMarkedBy?: string | null
          calBookingUlid?: string | null
          calEventTypeUlid?: string | null
          cancellationFee?: number | null
          cancellationHistory?: Json | null
          cancellationPolicy?: string | null
          cancellationReason?: string | null
          cancelledAt?: string | null
          cancelledBy?: string | null
          cancelledByUlid?: string | null
          coachUlid?: string
          createdAt?: string
          currency?: string | null
          endTime?: string
          isRefundable?: boolean
          menteeUlid?: string
          originalSessionUlid?: string | null
          paymentIntentId?: string | null
          paymentMethod?: string | null
          paymentStatus?: string | null
          price?: number | null
          refundAmount?: number | null
          refundReason?: string | null
          refundStatus?: string | null
          rescheduledBy?: string | null
          rescheduledFromUlid?: string | null
          rescheduledToUlid?: string | null
          reschedulingHistory?: Json | null
          reschedulingReason?: string | null
          sessionNotes?: string | null
          sessionType?: Database["public"]["Enums"]["SessionType"]
          startTime?: string
          status?: Database["public"]["Enums"]["SessionStatus"]
          ulid?: string
          updatedAt?: string
          zoomJoinUrl?: string | null
          zoomMeetingId?: string | null
          zoomMeetingPassword?: string | null
          zoomMeetingSettings?: Json | null
          zoomMetadata?: Json | null
          zoomStartUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Session_calBookingUlid_fkey"
            columns: ["calBookingUlid"]
            isOneToOne: false
            referencedRelation: "CalBooking"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Session_calEventTypeUlid_fkey"
            columns: ["calEventTypeUlid"]
            isOneToOne: false
            referencedRelation: "CalEventType"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Session_coachUlid_fkey"
            columns: ["coachUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Session_menteeUlid_fkey"
            columns: ["menteeUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Session_originalSessionUlid_fkey"
            columns: ["originalSessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Session_rescheduledFromUlid_fkey"
            columns: ["rescheduledFromUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Session_rescheduledToUlid_fkey"
            columns: ["rescheduledToUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Settings: {
        Row: {
          createdAt: string
          description: string | null
          key: string
          metadata: Json | null
          ulid: string
          updatedAt: string
          value: Json
        }
        Insert: {
          createdAt?: string
          description?: string | null
          key: string
          metadata?: Json | null
          ulid: string
          updatedAt: string
          value: Json
        }
        Update: {
          createdAt?: string
          description?: string | null
          key?: string
          metadata?: Json | null
          ulid?: string
          updatedAt?: string
          value?: Json
        }
        Relationships: []
      }
      SetupIntent: {
        Row: {
          createdAt: string
          status: string
          stripeSetupIntentId: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          status: string
          stripeSetupIntentId: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          status?: string
          stripeSetupIntentId?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "SetupIntent_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      StripeConnectedAccount: {
        Row: {
          chargesEnabled: boolean
          country: string
          createdAt: string
          deauthorizedAt: string | null
          defaultCurrency: string
          detailsSubmitted: boolean
          payoutsEnabled: boolean
          requiresOnboarding: boolean
          stripeAccountId: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          chargesEnabled?: boolean
          country: string
          createdAt?: string
          deauthorizedAt?: string | null
          defaultCurrency?: string
          detailsSubmitted?: boolean
          payoutsEnabled?: boolean
          requiresOnboarding?: boolean
          stripeAccountId: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          chargesEnabled?: boolean
          country?: string
          createdAt?: string
          deauthorizedAt?: string | null
          defaultCurrency?: string
          detailsSubmitted?: boolean
          payoutsEnabled?: boolean
          requiresOnboarding?: boolean
          stripeAccountId?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "StripeConnectedAccount_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      StripePaymentMethod: {
        Row: {
          createdAt: string
          isDefault: boolean
          metadata: Json
          stripePaymentMethodId: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          isDefault?: boolean
          metadata?: Json
          stripePaymentMethodId: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          isDefault?: boolean
          metadata?: Json
          stripePaymentMethodId?: string
          type?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "StripePaymentMethod_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Subscription: {
        Row: {
          autoRenew: boolean
          billingCycle: string
          billingDay: number | null
          cancelAtPeriodEnd: boolean
          canceledAt: string | null
          createdAt: string
          currentPeriodEnd: string
          currentPeriodStart: string
          metadata: Json | null
          organizationUlid: string | null
          planType: Database["public"]["Enums"]["PlanType"]
          seatPrice: number | null
          status: string
          stripeSubscriptionId: string
          totalSeats: number
          ulid: string
          updatedAt: string
          usedSeats: number
          userUlid: string | null
        }
        Insert: {
          autoRenew?: boolean
          billingCycle?: string
          billingDay?: number | null
          cancelAtPeriodEnd?: boolean
          canceledAt?: string | null
          createdAt?: string
          currentPeriodEnd: string
          currentPeriodStart: string
          metadata?: Json | null
          organizationUlid?: string | null
          planType: Database["public"]["Enums"]["PlanType"]
          seatPrice?: number | null
          status: string
          stripeSubscriptionId: string
          totalSeats?: number
          ulid: string
          updatedAt: string
          usedSeats?: number
          userUlid?: string | null
        }
        Update: {
          autoRenew?: boolean
          billingCycle?: string
          billingDay?: number | null
          cancelAtPeriodEnd?: boolean
          canceledAt?: string | null
          createdAt?: string
          currentPeriodEnd?: string
          currentPeriodStart?: string
          metadata?: Json | null
          organizationUlid?: string | null
          planType?: Database["public"]["Enums"]["PlanType"]
          seatPrice?: number | null
          status?: string
          stripeSubscriptionId?: string
          totalSeats?: number
          ulid?: string
          updatedAt?: string
          usedSeats?: number
          userUlid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Subscription_organizationUlid_fkey"
            columns: ["organizationUlid"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Subscription_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      SupportTicket: {
        Row: {
          createdAt: string
          description: string
          status: Database["public"]["Enums"]["TicketStatus"]
          title: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          description: string
          status?: Database["public"]["Enums"]["TicketStatus"]
          title: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          description?: string
          status?: Database["public"]["Enums"]["TicketStatus"]
          title?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "SupportTicket_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      SystemActivity: {
        Row: {
          createdAt: string
          description: string
          severity: string | null
          title: string
          type: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description: string
          severity?: string | null
          title: string
          type: string
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          description?: string
          severity?: string | null
          title?: string
          type?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: []
      }
      SystemAlerts: {
        Row: {
          createdAt: string
          message: string
          severity: string
          title: string
          type: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          message: string
          severity: string
          title: string
          type: string
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          message?: string
          severity?: string
          title?: string
          type?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: []
      }
      SystemHealth: {
        Row: {
          activeSessions: number
          createdAt: string
          pendingReviews: number
          securityAlerts: number
          status: number
          ulid: string
          updatedAt: string
          uptime: number
        }
        Insert: {
          activeSessions: number
          createdAt?: string
          pendingReviews: number
          securityAlerts: number
          status: number
          ulid: string
          updatedAt: string
          uptime: number
        }
        Update: {
          activeSessions?: number
          createdAt?: string
          pendingReviews?: number
          securityAlerts?: number
          status?: number
          ulid?: string
          updatedAt?: string
          uptime?: number
        }
        Relationships: []
      }
      Transaction: {
        Row: {
          amount: number
          coachPayout: number | null
          coachUlid: string
          createdAt: string
          currency: string
          metadata: Json
          payerUlid: string
          platformFee: number | null
          sessionUlid: string | null
          status: string
          stripePaymentIntentId: string | null
          stripeTransferId: string | null
          type: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          amount: number
          coachPayout?: number | null
          coachUlid: string
          createdAt?: string
          currency: string
          metadata?: Json
          payerUlid: string
          platformFee?: number | null
          sessionUlid?: string | null
          status: string
          stripePaymentIntentId?: string | null
          stripeTransferId?: string | null
          type: string
          ulid: string
          updatedAt: string
        }
        Update: {
          amount?: number
          coachPayout?: number | null
          coachUlid?: string
          createdAt?: string
          currency?: string
          metadata?: Json
          payerUlid?: string
          platformFee?: number | null
          sessionUlid?: string | null
          status?: string
          stripePaymentIntentId?: string | null
          stripeTransferId?: string | null
          type?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Transaction_coachUlid_fkey"
            columns: ["coachUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Transaction_payerUlid_fkey"
            columns: ["payerUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "Transaction_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
        ]
      }
      User: {
        Row: {
          bio: string | null
          capabilities: Database["public"]["Enums"]["UserCapability"][] | null
          createdAt: string
          displayName: string | null
          email: string
          firstName: string | null
          isCoach: boolean
          isMentee: boolean
          languages: Database["public"]["Enums"]["Language"][] | null
          lastName: string | null
          phoneNumber: string | null
          primaryDomain: Database["public"]["Enums"]["RealEstateDomain"] | null
          primaryMarket: string | null
          profileImageUrl: string | null
          realEstateDomains:
            | Database["public"]["Enums"]["RealEstateDomain"][]
            | null
          status: Database["public"]["Enums"]["UserStatus"]
          stripeConnectAccountId: string | null
          stripeCustomerId: string | null
          systemRole: Database["public"]["Enums"]["UserRole"]
          totalYearsRE: number
          ulid: string
          updatedAt: string
          userId: string
        }
        Insert: {
          bio?: string | null
          capabilities?: Database["public"]["Enums"]["UserCapability"][] | null
          createdAt?: string
          displayName?: string | null
          email: string
          firstName?: string | null
          isCoach?: boolean
          isMentee?: boolean
          languages?: Database["public"]["Enums"]["Language"][] | null
          lastName?: string | null
          phoneNumber?: string | null
          primaryDomain?: Database["public"]["Enums"]["RealEstateDomain"] | null
          primaryMarket?: string | null
          profileImageUrl?: string | null
          realEstateDomains?:
            | Database["public"]["Enums"]["RealEstateDomain"][]
            | null
          status?: Database["public"]["Enums"]["UserStatus"]
          stripeConnectAccountId?: string | null
          stripeCustomerId?: string | null
          systemRole?: Database["public"]["Enums"]["UserRole"]
          totalYearsRE?: number
          ulid: string
          updatedAt: string
          userId: string
        }
        Update: {
          bio?: string | null
          capabilities?: Database["public"]["Enums"]["UserCapability"][] | null
          createdAt?: string
          displayName?: string | null
          email?: string
          firstName?: string | null
          isCoach?: boolean
          isMentee?: boolean
          languages?: Database["public"]["Enums"]["Language"][] | null
          lastName?: string | null
          phoneNumber?: string | null
          primaryDomain?: Database["public"]["Enums"]["RealEstateDomain"] | null
          primaryMarket?: string | null
          profileImageUrl?: string | null
          realEstateDomains?:
            | Database["public"]["Enums"]["RealEstateDomain"][]
            | null
          status?: Database["public"]["Enums"]["UserStatus"]
          stripeConnectAccountId?: string | null
          stripeCustomerId?: string | null
          systemRole?: Database["public"]["Enums"]["UserRole"]
          totalYearsRE?: number
          ulid?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ActivitySeverity: "INFO" | "WARNING" | "ERROR"
      ActivityType: "USER" | "COACH" | "SYSTEM" | "SECURITY"
      ApplicationStatus: "PENDING" | "APPROVED" | "REJECTED"
      CalBookingStatus:
        | "CONFIRMED"
        | "PENDING"
        | "CANCELLED"
        | "REJECTED"
        | "ABSENT"
      CalSchedulingType: "MANAGED" | "OFFICE_HOURS" | "GROUP_SESSION"
      CertificationStatus: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING"
      CoachApplicationStatus: "PENDING" | "APPROVED" | "REJECTED"
      CommercialDealType:
        | "SALES"
        | "LEASING"
        | "INVESTMENT"
        | "DEVELOPMENT"
        | "PROPERTY_MANAGEMENT"
        | "CONSULTING"
      CommercialPropertyType:
        | "OFFICE"
        | "RETAIL"
        | "INDUSTRIAL"
        | "MULTIFAMILY"
        | "MIXED_USE"
        | "LAND"
        | "HOTEL"
        | "MEDICAL"
        | "SELF_STORAGE"
        | "OTHER"
      Currency: "USD" | "EUR" | "GBP" | "CAD"
      DisputeStatus: "OPEN" | "RESOLVED" | "REJECTED"
      DomainStatus: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED"
      ExpertiseLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
      GoalStatus: "IN_PROGRESS" | "COMPLETED" | "OVERDUE"
      GoalType:
        | "sales_volume"
        | "commission_income"
        | "gci"
        | "avg_sale_price"
        | "listings"
        | "buyer_transactions"
        | "closed_deals"
        | "days_on_market"
        | "coaching_sessions"
        | "group_sessions"
        | "session_revenue"
        | "active_mentees"
        | "mentee_satisfaction"
        | "response_time"
        | "session_completion"
        | "mentee_milestones"
        | "new_clients"
        | "referrals"
        | "client_retention"
        | "reviews"
        | "market_share"
        | "territory_expansion"
        | "social_media"
        | "website_traffic"
        | "certifications"
        | "training_hours"
        | "networking_events"
        | "custom"
      InsuranceType:
        | "PROPERTY_CASUALTY"
        | "TITLE_INSURANCE"
        | "ERRORS_OMISSIONS"
        | "LIABILITY"
        | "HOMEOWNERS"
        | "FLOOD"
        | "OTHER"
      InvestmentStrategy:
        | "FIX_AND_FLIP"
        | "BUY_AND_HOLD"
        | "WHOLESALE"
        | "COMMERCIAL"
        | "MULTIFAMILY"
        | "LAND_DEVELOPMENT"
        | "REIT"
        | "SYNDICATION"
        | "OTHER"
      InviteStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"
      Language:
        | "en"
        | "es"
        | "zh"
        | "tl"
        | "vi"
        | "ar"
        | "fr"
        | "ko"
        | "ru"
        | "de"
        | "hi"
        | "pt"
        | "it"
        | "ja"
      ListingStatus:
        | "Active"
        | "ActiveUnderContract"
        | "Canceled"
        | "Closed"
        | "ComingSoon"
        | "Delete"
        | "Expired"
        | "Hold"
        | "Incomplete"
        | "Pending"
        | "Withdrawn"
      LoanType:
        | "CONVENTIONAL"
        | "FHA"
        | "VA"
        | "USDA"
        | "JUMBO"
        | "REVERSE"
        | "CONSTRUCTION"
        | "COMMERCIAL"
        | "HELOC"
        | "OTHER"
      MemberStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
      OrgIndustry:
        | "REAL_ESTATE_SALES"
        | "MORTGAGE_LENDING"
        | "PROPERTY_MANAGEMENT"
        | "REAL_ESTATE_INVESTMENT"
        | "TITLE_ESCROW"
        | "INSURANCE"
        | "COMMERCIAL"
        | "PRIVATE_CREDIT"
        | "OTHER"
      OrgLevel: "GLOBAL" | "REGIONAL" | "LOCAL" | "BRANCH"
      OrgRole:
        | "GLOBAL_OWNER"
        | "GLOBAL_DIRECTOR"
        | "GLOBAL_MANAGER"
        | "REGIONAL_OWNER"
        | "REGIONAL_DIRECTOR"
        | "REGIONAL_MANAGER"
        | "LOCAL_OWNER"
        | "LOCAL_DIRECTOR"
        | "LOCAL_MANAGER"
        | "OWNER"
        | "DIRECTOR"
        | "MANAGER"
        | "MEMBER"
        | "GUEST"
      OrgStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING" | "ARCHIVED"
      OrgTier: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | "PARTNER"
      OrgType:
        | "INDIVIDUAL"
        | "TEAM"
        | "BUSINESS"
        | "ENTERPRISE"
        | "FRANCHISE"
        | "NETWORK"
      PaymentMethodType: "credit_card" | "debit_card" | "bank_transfer"
      PaymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      PayoutStatus: "PENDING" | "PROCESSED" | "FAILED"
      PlanType: "INDIVIDUAL" | "TEAM" | "ENTERPRISE"
      PortfolioItemType:
        | "PROPERTY_SALE"
        | "PROPERTY_PURCHASE"
        | "LOAN_ORIGINATION"
        | "PROPERTY_MANAGEMENT"
        | "INSURANCE_POLICY"
        | "COMMERCIAL_DEAL"
        | "PRIVATE_LENDING"
        | "TITLE_SERVICE"
        | "OTHER"
      PrivateCreditLoanType:
        | "BRIDGE"
        | "CONSTRUCTION"
        | "VALUE_ADD"
        | "ACQUISITION"
        | "REFINANCE"
        | "MEZZANINE"
        | "PREFERRED_EQUITY"
        | "OTHER"
      ProfileStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      PropertyManagerType:
        | "RESIDENTIAL"
        | "COMMERCIAL"
        | "MIXED_USE"
        | "VACATION_RENTAL"
        | "HOA"
        | "STUDENT_HOUSING"
        | "SENIOR_LIVING"
        | "OTHER"
      PropertySubType:
        | "Apartment"
        | "Cabin"
        | "Condominium"
        | "Duplex"
        | "ManufacturedHome"
        | "SingleFamilyDetached"
        | "SingleFamilyAttached"
        | "Mobile"
        | "Townhouse"
        | "Triplex"
        | "Quadruplex"
        | "Hotel"
        | "CommercialIndustrial"
        | "CommercialMixedUse"
        | "MultiFamily"
        | "Office"
        | "Retail"
        | "Restaurant"
        | "Warehouse"
        | "AgriculturalLand"
        | "CommercialLand"
        | "IndustrialLand"
        | "LandMixedUse"
        | "ResidentialLand"
        | "Equestrian"
        | "Ranch"
        | "TimberLand"
        | "Vineyard"
        | "BusinessOnly"
        | "BusinessWithProperty"
        | "BusinessWithRealEstate"
        | "DoubleWide"
        | "SingleWide"
        | "TripleWide"
        | "Other"
      PropertyType:
        | "BusinessOpportunity"
        | "CommercialLease"
        | "CommercialSale"
        | "Farm"
        | "Land"
        | "ManufacturedInPark"
        | "Residential"
      RealEstateDomain:
        | "REALTOR"
        | "INVESTOR"
        | "MORTGAGE"
        | "PROPERTY_MANAGER"
        | "TITLE_ESCROW"
        | "INSURANCE"
        | "COMMERCIAL"
        | "PRIVATE_CREDIT"
      RecognitionType:
        | "AWARD"
        | "ACHIEVEMENT"
        | "CERTIFICATION"
        | "DESIGNATION"
        | "LICENSE"
        | "EDUCATION"
        | "MEMBERSHIP"
      RefundStatus: "PENDING" | "COMPLETED" | "FAILED"
      ReviewStatus: "PENDING" | "PUBLISHED" | "HIDDEN"
      SessionStatus:
        | "SCHEDULED"
        | "COMPLETED"
        | "RESCHEDULED"
        | "CANCELLED"
        | "ABSENT"
      SessionType: "MANAGED" | "GROUP_SESSION" | "OFFICE_HOURS"
      SocialMediaPlatform:
        | "FACEBOOK"
        | "INSTAGRAM"
        | "LINKEDIN"
        | "YOUTUBE"
        | "TWITTER"
        | "TIKTOK"
        | "PINTEREST"
        | "OTHER"
      TicketStatus: "OPEN" | "IN_PROGRESS" | "CLOSED"
      TitleEscrowType:
        | "TITLE_AGENT"
        | "ESCROW_OFFICER"
        | "CLOSING_AGENT"
        | "TITLE_EXAMINER"
        | "UNDERWRITER"
        | "OTHER"
      UserCapability: "COACH" | "MENTEE"
      UserRole: "SYSTEM_OWNER" | "SYSTEM_MODERATOR" | "USER"
      UserStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
      VerificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED"
      VerificationType:
        | "LICENSE"
        | "CERTIFICATION"
        | "EMPLOYMENT"
        | "REFERENCE"
        | "BACKGROUND_CHECK"
        | "DOCUMENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ActivitySeverity: ["INFO", "WARNING", "ERROR"],
      ActivityType: ["USER", "COACH", "SYSTEM", "SECURITY"],
      ApplicationStatus: ["PENDING", "APPROVED", "REJECTED"],
      CalBookingStatus: [
        "CONFIRMED",
        "PENDING",
        "CANCELLED",
        "REJECTED",
        "ABSENT",
      ],
      CalSchedulingType: ["MANAGED", "OFFICE_HOURS", "GROUP_SESSION"],
      CertificationStatus: ["ACTIVE", "EXPIRED", "REVOKED", "PENDING"],
      CoachApplicationStatus: ["PENDING", "APPROVED", "REJECTED"],
      CommercialDealType: [
        "SALES",
        "LEASING",
        "INVESTMENT",
        "DEVELOPMENT",
        "PROPERTY_MANAGEMENT",
        "CONSULTING",
      ],
      CommercialPropertyType: [
        "OFFICE",
        "RETAIL",
        "INDUSTRIAL",
        "MULTIFAMILY",
        "MIXED_USE",
        "LAND",
        "HOTEL",
        "MEDICAL",
        "SELF_STORAGE",
        "OTHER",
      ],
      Currency: ["USD", "EUR", "GBP", "CAD"],
      DisputeStatus: ["OPEN", "RESOLVED", "REJECTED"],
      DomainStatus: ["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"],
      ExpertiseLevel: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
      GoalStatus: ["IN_PROGRESS", "COMPLETED", "OVERDUE"],
      GoalType: [
        "sales_volume",
        "commission_income",
        "gci",
        "avg_sale_price",
        "listings",
        "buyer_transactions",
        "closed_deals",
        "days_on_market",
        "coaching_sessions",
        "group_sessions",
        "session_revenue",
        "active_mentees",
        "mentee_satisfaction",
        "response_time",
        "session_completion",
        "mentee_milestones",
        "new_clients",
        "referrals",
        "client_retention",
        "reviews",
        "market_share",
        "territory_expansion",
        "social_media",
        "website_traffic",
        "certifications",
        "training_hours",
        "networking_events",
        "custom",
      ],
      InsuranceType: [
        "PROPERTY_CASUALTY",
        "TITLE_INSURANCE",
        "ERRORS_OMISSIONS",
        "LIABILITY",
        "HOMEOWNERS",
        "FLOOD",
        "OTHER",
      ],
      InvestmentStrategy: [
        "FIX_AND_FLIP",
        "BUY_AND_HOLD",
        "WHOLESALE",
        "COMMERCIAL",
        "MULTIFAMILY",
        "LAND_DEVELOPMENT",
        "REIT",
        "SYNDICATION",
        "OTHER",
      ],
      InviteStatus: ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"],
      Language: [
        "en",
        "es",
        "zh",
        "tl",
        "vi",
        "ar",
        "fr",
        "ko",
        "ru",
        "de",
        "hi",
        "pt",
        "it",
        "ja",
      ],
      ListingStatus: [
        "Active",
        "ActiveUnderContract",
        "Canceled",
        "Closed",
        "ComingSoon",
        "Delete",
        "Expired",
        "Hold",
        "Incomplete",
        "Pending",
        "Withdrawn",
      ],
      LoanType: [
        "CONVENTIONAL",
        "FHA",
        "VA",
        "USDA",
        "JUMBO",
        "REVERSE",
        "CONSTRUCTION",
        "COMMERCIAL",
        "HELOC",
        "OTHER",
      ],
      MemberStatus: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      OrgIndustry: [
        "REAL_ESTATE_SALES",
        "MORTGAGE_LENDING",
        "PROPERTY_MANAGEMENT",
        "REAL_ESTATE_INVESTMENT",
        "TITLE_ESCROW",
        "INSURANCE",
        "COMMERCIAL",
        "PRIVATE_CREDIT",
        "OTHER",
      ],
      OrgLevel: ["GLOBAL", "REGIONAL", "LOCAL", "BRANCH"],
      OrgRole: [
        "GLOBAL_OWNER",
        "GLOBAL_DIRECTOR",
        "GLOBAL_MANAGER",
        "REGIONAL_OWNER",
        "REGIONAL_DIRECTOR",
        "REGIONAL_MANAGER",
        "LOCAL_OWNER",
        "LOCAL_DIRECTOR",
        "LOCAL_MANAGER",
        "OWNER",
        "DIRECTOR",
        "MANAGER",
        "MEMBER",
        "GUEST",
      ],
      OrgStatus: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING", "ARCHIVED"],
      OrgTier: ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE", "PARTNER"],
      OrgType: [
        "INDIVIDUAL",
        "TEAM",
        "BUSINESS",
        "ENTERPRISE",
        "FRANCHISE",
        "NETWORK",
      ],
      PaymentMethodType: ["credit_card", "debit_card", "bank_transfer"],
      PaymentStatus: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      PayoutStatus: ["PENDING", "PROCESSED", "FAILED"],
      PlanType: ["INDIVIDUAL", "TEAM", "ENTERPRISE"],
      PortfolioItemType: [
        "PROPERTY_SALE",
        "PROPERTY_PURCHASE",
        "LOAN_ORIGINATION",
        "PROPERTY_MANAGEMENT",
        "INSURANCE_POLICY",
        "COMMERCIAL_DEAL",
        "PRIVATE_LENDING",
        "TITLE_SERVICE",
        "OTHER",
      ],
      PrivateCreditLoanType: [
        "BRIDGE",
        "CONSTRUCTION",
        "VALUE_ADD",
        "ACQUISITION",
        "REFINANCE",
        "MEZZANINE",
        "PREFERRED_EQUITY",
        "OTHER",
      ],
      ProfileStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      PropertyManagerType: [
        "RESIDENTIAL",
        "COMMERCIAL",
        "MIXED_USE",
        "VACATION_RENTAL",
        "HOA",
        "STUDENT_HOUSING",
        "SENIOR_LIVING",
        "OTHER",
      ],
      PropertySubType: [
        "Apartment",
        "Cabin",
        "Condominium",
        "Duplex",
        "ManufacturedHome",
        "SingleFamilyDetached",
        "SingleFamilyAttached",
        "Mobile",
        "Townhouse",
        "Triplex",
        "Quadruplex",
        "Hotel",
        "CommercialIndustrial",
        "CommercialMixedUse",
        "MultiFamily",
        "Office",
        "Retail",
        "Restaurant",
        "Warehouse",
        "AgriculturalLand",
        "CommercialLand",
        "IndustrialLand",
        "LandMixedUse",
        "ResidentialLand",
        "Equestrian",
        "Ranch",
        "TimberLand",
        "Vineyard",
        "BusinessOnly",
        "BusinessWithProperty",
        "BusinessWithRealEstate",
        "DoubleWide",
        "SingleWide",
        "TripleWide",
        "Other",
      ],
      PropertyType: [
        "BusinessOpportunity",
        "CommercialLease",
        "CommercialSale",
        "Farm",
        "Land",
        "ManufacturedInPark",
        "Residential",
      ],
      RealEstateDomain: [
        "REALTOR",
        "INVESTOR",
        "MORTGAGE",
        "PROPERTY_MANAGER",
        "TITLE_ESCROW",
        "INSURANCE",
        "COMMERCIAL",
        "PRIVATE_CREDIT",
      ],
      RecognitionType: [
        "AWARD",
        "ACHIEVEMENT",
        "CERTIFICATION",
        "DESIGNATION",
        "LICENSE",
        "EDUCATION",
        "MEMBERSHIP",
      ],
      RefundStatus: ["PENDING", "COMPLETED", "FAILED"],
      ReviewStatus: ["PENDING", "PUBLISHED", "HIDDEN"],
      SessionStatus: [
        "SCHEDULED",
        "COMPLETED",
        "RESCHEDULED",
        "CANCELLED",
        "ABSENT",
      ],
      SessionType: ["MANAGED", "GROUP_SESSION", "OFFICE_HOURS"],
      SocialMediaPlatform: [
        "FACEBOOK",
        "INSTAGRAM",
        "LINKEDIN",
        "YOUTUBE",
        "TWITTER",
        "TIKTOK",
        "PINTEREST",
        "OTHER",
      ],
      TicketStatus: ["OPEN", "IN_PROGRESS", "CLOSED"],
      TitleEscrowType: [
        "TITLE_AGENT",
        "ESCROW_OFFICER",
        "CLOSING_AGENT",
        "TITLE_EXAMINER",
        "UNDERWRITER",
        "OTHER",
      ],
      UserCapability: ["COACH", "MENTEE"],
      UserRole: ["SYSTEM_OWNER", "SYSTEM_MODERATOR", "USER"],
      UserStatus: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      VerificationStatus: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"],
      VerificationType: [
        "LICENSE",
        "CERTIFICATION",
        "EMPLOYMENT",
        "REFERENCE",
        "BACKGROUND_CHECK",
        "DOCUMENT",
      ],
    },
  },
} as const
