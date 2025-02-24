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
      Achievement: {
        Row: {
          createdAt: string
          earnedAt: string
          metadata: Json | null
          milestone: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          earnedAt?: string
          metadata?: Json | null
          milestone: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          earnedAt?: string
          metadata?: Json | null
          milestone?: string
          type?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "Achievement_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
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
      AIMessage: {
        Row: {
          content: string
          createdAt: string
          model: string
          role: string
          threadUlid: string
          tokens: number
          ulid: string
          updatedAt: string
        }
        Insert: {
          content: string
          createdAt?: string
          model: string
          role: string
          threadUlid: string
          tokens?: number
          ulid: string
          updatedAt: string
        }
        Update: {
          content?: string
          createdAt?: string
          model?: string
          role?: string
          threadUlid?: string
          tokens?: number
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "AIMessage_threadUlid_fkey"
            columns: ["threadUlid"]
            isOneToOne: false
            referencedRelation: "AIThread"
            referencedColumns: ["ulid"]
          },
        ]
      }
      AIThread: {
        Row: {
          category: string
          createdAt: string
          status: string
          title: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          category: string
          createdAt?: string
          status?: string
          title: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          category?: string
          createdAt?: string
          status?: string
          title?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "AIThread_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CalendlyEvent: {
        Row: {
          createdAt: string
          eventType: string
          eventUuid: string
          inviteeEmail: string
          inviteeName: string
          sessionUlid: string | null
          status: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          eventType: string
          eventUuid: string
          inviteeEmail: string
          inviteeName: string
          sessionUlid?: string | null
          status: string
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          eventType?: string
          eventUuid?: string
          inviteeEmail?: string
          inviteeName?: string
          sessionUlid?: string | null
          status?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "CalendlyEvent_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "CalendlyEvent_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CalendlyIntegration: {
        Row: {
          accessToken: string
          createdAt: string
          eventTypeId: string | null
          expiresAt: string
          failedRefreshCount: number
          lastSyncAt: string | null
          organization: string | null
          organizationUrl: string | null
          refreshToken: string
          schedulingUrl: string
          scope: string
          status: string
          ulid: string
          updatedAt: string
          userId: string
          userUlid: string
        }
        Insert: {
          accessToken: string
          createdAt?: string
          eventTypeId?: string | null
          expiresAt: string
          failedRefreshCount?: number
          lastSyncAt?: string | null
          organization?: string | null
          organizationUrl?: string | null
          refreshToken: string
          schedulingUrl: string
          scope: string
          status?: string
          ulid: string
          updatedAt: string
          userId: string
          userUlid: string
        }
        Update: {
          accessToken?: string
          createdAt?: string
          eventTypeId?: string | null
          expiresAt?: string
          failedRefreshCount?: number
          lastSyncAt?: string | null
          organization?: string | null
          organizationUrl?: string | null
          refreshToken?: string
          schedulingUrl?: string
          scope?: string
          status?: string
          ulid?: string
          updatedAt?: string
          userId?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "CalendlyIntegration_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      CalendlyWebhookEvent: {
        Row: {
          createdAt: string
          error: string | null
          eventType: string
          payload: Json
          processed: boolean
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          error?: string | null
          eventType: string
          payload: Json
          processed?: boolean
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          error?: string | null
          eventType?: string
          payload?: Json
          processed?: boolean
          ulid?: string
          updatedAt?: string
        }
        Relationships: []
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
          additionalInfo: string | null
          applicantUlid: string
          applicationDate: string
          createdAt: string
          draftData: Json | null
          draftVersion: number
          experience: string
          isDraft: boolean
          lastSavedAt: string | null
          linkedIn: string | null
          notes: string | null
          primarySocialMedia: string | null
          resumeUrl: string | null
          reviewDate: string | null
          reviewerUlid: string | null
          specialties: string[] | null
          status: Database["public"]["Enums"]["CoachApplicationStatus"]
          ulid: string
          updatedAt: string
        }
        Insert: {
          additionalInfo?: string | null
          applicantUlid: string
          applicationDate?: string
          createdAt?: string
          draftData?: Json | null
          draftVersion?: number
          experience: string
          isDraft?: boolean
          lastSavedAt?: string | null
          linkedIn?: string | null
          notes?: string | null
          primarySocialMedia?: string | null
          resumeUrl?: string | null
          reviewDate?: string | null
          reviewerUlid?: string | null
          specialties?: string[] | null
          status?: Database["public"]["Enums"]["CoachApplicationStatus"]
          ulid: string
          updatedAt: string
        }
        Update: {
          additionalInfo?: string | null
          applicantUlid?: string
          applicationDate?: string
          createdAt?: string
          draftData?: Json | null
          draftVersion?: number
          experience?: string
          isDraft?: boolean
          lastSavedAt?: string | null
          linkedIn?: string | null
          notes?: string | null
          primarySocialMedia?: string | null
          resumeUrl?: string | null
          reviewDate?: string | null
          reviewerUlid?: string | null
          specialties?: string[] | null
          status?: Database["public"]["Enums"]["CoachApplicationStatus"]
          ulid?: string
          updatedAt?: string
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
          averageRating: number | null
          bufferAfter: number
          bufferBefore: number
          calendlyEnabled: boolean
          createdAt: string
          defaultDuration: number
          isDefault: boolean
          maximumDuration: number
          minimumDuration: number
          name: string
          rules: Json
          timezone: string
          totalSessions: number
          ulid: string
          updatedAt: string
          userUlid: string
          zoomEnabled: boolean
        }
        Insert: {
          active?: boolean
          allowCustomDuration?: boolean
          averageRating?: number | null
          bufferAfter?: number
          bufferBefore?: number
          calendlyEnabled?: boolean
          createdAt?: string
          defaultDuration?: number
          isDefault?: boolean
          maximumDuration?: number
          minimumDuration?: number
          name: string
          rules: Json
          timezone: string
          totalSessions?: number
          ulid: string
          updatedAt: string
          userUlid: string
          zoomEnabled?: boolean
        }
        Update: {
          active?: boolean
          allowCustomDuration?: boolean
          averageRating?: number | null
          bufferAfter?: number
          bufferBefore?: number
          calendlyEnabled?: boolean
          createdAt?: string
          defaultDuration?: number
          isDefault?: boolean
          maximumDuration?: number
          minimumDuration?: number
          name?: string
          rules?: Json
          timezone?: string
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
          activeDomains: string[] | null
          allowCustomDuration: boolean
          averageRating: number | null
          calendlyUrl: string | null
          coachingSpecialties: string[] | null
          completionPercentage: number
          createdAt: string
          defaultDuration: number
          eventTypeUrl: string | null
          hourlyRate: number | null
          isActive: boolean
          maximumDuration: number
          minimumDuration: number
          profileStatus: Database["public"]["Enums"]["ProfileStatus"]
          totalSessions: number
          ulid: string
          updatedAt: string
          userUlid: string
          yearsCoaching: number | null
        }
        Insert: {
          activeDomains?: string[] | null
          allowCustomDuration?: boolean
          averageRating?: number | null
          calendlyUrl?: string | null
          coachingSpecialties?: string[] | null
          completionPercentage?: number
          createdAt?: string
          defaultDuration?: number
          eventTypeUrl?: string | null
          hourlyRate?: number | null
          isActive?: boolean
          maximumDuration?: number
          minimumDuration?: number
          profileStatus?: Database["public"]["Enums"]["ProfileStatus"]
          totalSessions?: number
          ulid: string
          updatedAt: string
          userUlid: string
          yearsCoaching?: number | null
        }
        Update: {
          activeDomains?: string[] | null
          allowCustomDuration?: boolean
          averageRating?: number | null
          calendlyUrl?: string | null
          coachingSpecialties?: string[] | null
          completionPercentage?: number
          createdAt?: string
          defaultDuration?: number
          eventTypeUrl?: string | null
          hourlyRate?: number | null
          isActive?: boolean
          maximumDuration?: number
          minimumDuration?: number
          profileStatus?: Database["public"]["Enums"]["ProfileStatus"]
          totalSessions?: number
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsCoaching?: number | null
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
      DomainExpertise: {
        Row: {
          coachProfileUlid: string | null
          createdAt: string
          description: string | null
          isActive: boolean
          level: string
          menteeProfileUlid: string | null
          metadata: Json | null
          status: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience: number
        }
        Insert: {
          coachProfileUlid?: string | null
          createdAt?: string
          description?: string | null
          isActive?: boolean
          level: string
          menteeProfileUlid?: string | null
          metadata?: Json | null
          status?: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience?: number
        }
        Update: {
          coachProfileUlid?: string | null
          createdAt?: string
          description?: string | null
          isActive?: boolean
          level?: string
          menteeProfileUlid?: string | null
          metadata?: Json | null
          status?: string
          type?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsExperience?: number
        }
        Relationships: [
          {
            foreignKeyName: "DomainExpertise_coachProfileUlid_fkey"
            columns: ["coachProfileUlid"]
            isOneToOne: false
            referencedRelation: "CoachProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "DomainExpertise_menteeProfileUlid_fkey"
            columns: ["menteeProfileUlid"]
            isOneToOne: false
            referencedRelation: "MenteeProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "DomainExpertise_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      DomainVerification: {
        Row: {
          createdAt: string
          documentUrl: string | null
          domainExpertiseUlid: string
          expiresAt: string | null
          metadata: Json | null
          status: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
          verificationData: Json | null
        }
        Insert: {
          createdAt?: string
          documentUrl?: string | null
          domainExpertiseUlid: string
          expiresAt?: string | null
          metadata?: Json | null
          status?: string
          type: string
          ulid: string
          updatedAt: string
          userUlid: string
          verificationData?: Json | null
        }
        Update: {
          createdAt?: string
          documentUrl?: string | null
          domainExpertiseUlid?: string
          expiresAt?: string | null
          metadata?: Json | null
          status?: string
          type?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string
          verificationData?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "DomainVerification_domainExpertiseUlid_fkey"
            columns: ["domainExpertiseUlid"]
            isOneToOne: false
            referencedRelation: "DomainExpertise"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "DomainVerification_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Goal: {
        Row: {
          createdAt: string
          current: number
          deadline: string
          description: string | null
          status: Database["public"]["Enums"]["GoalStatus"]
          target: number
          title: string
          type: Database["public"]["Enums"]["GoalType"]
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Insert: {
          createdAt?: string
          current?: number
          deadline: string
          description?: string | null
          status?: Database["public"]["Enums"]["GoalStatus"]
          target: number
          title: string
          type: Database["public"]["Enums"]["GoalType"]
          ulid: string
          updatedAt: string
          userUlid: string
        }
        Update: {
          createdAt?: string
          current?: number
          deadline?: string
          description?: string | null
          status?: Database["public"]["Enums"]["GoalStatus"]
          target?: number
          title?: string
          type?: Database["public"]["Enums"]["GoalType"]
          ulid?: string
          updatedAt?: string
          userUlid?: string
        }
        Relationships: [
          {
            foreignKeyName: "Goal_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      InsuranceProfile: {
        Row: {
          certifications: string[] | null
          claimProcessingTime: number | null
          companyName: string | null
          createdAt: string
          geographicFocus: Json | null
          insuranceTypes: Database["public"]["Enums"]["InsuranceType"][] | null
          languages: string[] | null
          licensedStates: string[] | null
          licenseNumber: string | null
          policiesIssued: number | null
          primaryMarket: string | null
          specializations: string[] | null
          totalPremiumVolume: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience: number | null
        }
        Insert: {
          certifications?: string[] | null
          claimProcessingTime?: number | null
          companyName?: string | null
          createdAt?: string
          geographicFocus?: Json | null
          insuranceTypes?: Database["public"]["Enums"]["InsuranceType"][] | null
          languages?: string[] | null
          licensedStates?: string[] | null
          licenseNumber?: string | null
          policiesIssued?: number | null
          primaryMarket?: string | null
          specializations?: string[] | null
          totalPremiumVolume?: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience?: number | null
        }
        Update: {
          certifications?: string[] | null
          claimProcessingTime?: number | null
          companyName?: string | null
          createdAt?: string
          geographicFocus?: Json | null
          insuranceTypes?: Database["public"]["Enums"]["InsuranceType"][] | null
          languages?: string[] | null
          licensedStates?: string[] | null
          licenseNumber?: string | null
          policiesIssued?: number | null
          primaryMarket?: string | null
          specializations?: string[] | null
          totalPremiumVolume?: number | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsExperience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "InsuranceProfile_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      InvestorProfile: {
        Row: {
          certifications: string[] | null
          companyName: string | null
          completedDeals: number | null
          createdAt: string
          geographicFocus: Json | null
          investmentStrategies:
            | Database["public"]["Enums"]["InvestmentStrategy"][]
            | null
          languages: string[] | null
          maxInvestmentAmount: number | null
          minInvestmentAmount: number | null
          preferredPropertyTypes: string[] | null
          primaryMarket: string | null
          propertiesOwned: number | null
          specializations: string[] | null
          targetMarkets: string[] | null
          targetRoi: number | null
          totalPortfolioValue: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience: number | null
        }
        Insert: {
          certifications?: string[] | null
          companyName?: string | null
          completedDeals?: number | null
          createdAt?: string
          geographicFocus?: Json | null
          investmentStrategies?:
            | Database["public"]["Enums"]["InvestmentStrategy"][]
            | null
          languages?: string[] | null
          maxInvestmentAmount?: number | null
          minInvestmentAmount?: number | null
          preferredPropertyTypes?: string[] | null
          primaryMarket?: string | null
          propertiesOwned?: number | null
          specializations?: string[] | null
          targetMarkets?: string[] | null
          targetRoi?: number | null
          totalPortfolioValue?: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience?: number | null
        }
        Update: {
          certifications?: string[] | null
          companyName?: string | null
          completedDeals?: number | null
          createdAt?: string
          geographicFocus?: Json | null
          investmentStrategies?:
            | Database["public"]["Enums"]["InvestmentStrategy"][]
            | null
          languages?: string[] | null
          maxInvestmentAmount?: number | null
          minInvestmentAmount?: number | null
          preferredPropertyTypes?: string[] | null
          primaryMarket?: string | null
          propertiesOwned?: number | null
          specializations?: string[] | null
          targetMarkets?: string[] | null
          targetRoi?: number | null
          totalPortfolioValue?: number | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsExperience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "InvestorProfile_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      Invoice: {
        Row: {
          amountDue: number | null
          amountPaid: number
          createdAt: string
          currency: string
          dueDate: string | null
          invoiceId: string
          status: string
          subscriptionId: string
          ulid: string
          updatedAt: string
          userUlid: string | null
        }
        Insert: {
          amountDue?: number | null
          amountPaid: number
          createdAt?: string
          currency: string
          dueDate?: string | null
          invoiceId: string
          status: string
          subscriptionId: string
          ulid: string
          updatedAt: string
          userUlid?: string | null
        }
        Update: {
          amountDue?: number | null
          amountPaid?: number
          createdAt?: string
          currency?: string
          dueDate?: string | null
          invoiceId?: string
          status?: string
          subscriptionId?: string
          ulid?: string
          updatedAt?: string
          userUlid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Invoice_subscriptionId_fkey"
            columns: ["subscriptionId"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["subscriptionId"]
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
      Listing: {
        Row: {
          appliances: string[] | null
          architecturalStyle:
            | Database["public"]["Enums"]["ArchitecturalStyle"]
            | null
          basement: Database["public"]["Enums"]["BasementType"] | null
          bathroomsTotal: number | null
          bedroomsTotal: number | null
          city: string
          closeDate: string | null
          closePrice: number | null
          cooling: string[] | null
          createdAt: string
          electricityAvailable: boolean
          elementarySchool: string | null
          exteriorFeatures: string[] | null
          featuredOrder: number | null
          furnished: Database["public"]["Enums"]["FurnishedStatus"] | null
          garageSpaces: number | null
          gasAvailable: boolean
          hasDeck: boolean
          hasFireplace: boolean
          hasPatio: boolean
          hasPorch: boolean
          heating: string[] | null
          highSchool: string | null
          hoaFeeAmount: number | null
          hoaFeeFrequency: string | null
          hoaName: string | null
          interiorFeatures: string[] | null
          isFeatured: boolean
          isWaterfront: boolean
          listingAgreement:
            | Database["public"]["Enums"]["ListingAgreement"]
            | null
          listingContractDate: string | null
          listingKey: string | null
          listingTerms: Database["public"]["Enums"]["ListingTerms"][] | null
          listPrice: number
          livingArea: number | null
          lotDimensionsSource: string | null
          lotSize: number | null
          lotSizeDimensions: string | null
          middleSchool: string | null
          mlsId: string | null
          mlsLink: string | null
          mlsSource: string | null
          modificationTimestamp: string | null
          originalListPrice: number | null
          parcelNumber: string | null
          parkingTotal: number | null
          photos: Json | null
          postalCode: string
          priceChangeTimestamp: string | null
          privateRemarks: string | null
          propertyCondition:
            | Database["public"]["Enums"]["PropertyCondition"][]
            | null
          propertySubType: Database["public"]["Enums"]["PropertySubType"] | null
          propertyType: Database["public"]["Enums"]["PropertyType"]
          publicListingUrl: string | null
          publicRemarks: string | null
          realtorProfileUlid: string
          roofType: Database["public"]["Enums"]["RoofType"] | null
          schoolDistrict: string | null
          sewerAvailable: boolean
          source: string
          stateOrProvince: string
          status: Database["public"]["Enums"]["ListingStatus"]
          statusChangeTimestamp: string | null
          stories: number | null
          streetName: string
          streetNumber: string
          taxAnnualAmount: number | null
          taxBlock: string | null
          taxLegalDescription: string | null
          taxLot: string | null
          taxMapNumber: string | null
          taxYear: number | null
          ulid: string
          unitNumber: string | null
          updatedAt: string
          view: Database["public"]["Enums"]["ViewType"][] | null
          virtualTours: Json | null
          waterAvailable: boolean
          yearBuilt: number | null
          zoning: string | null
          zoningDescription: string | null
        }
        Insert: {
          appliances?: string[] | null
          architecturalStyle?:
            | Database["public"]["Enums"]["ArchitecturalStyle"]
            | null
          basement?: Database["public"]["Enums"]["BasementType"] | null
          bathroomsTotal?: number | null
          bedroomsTotal?: number | null
          city: string
          closeDate?: string | null
          closePrice?: number | null
          cooling?: string[] | null
          createdAt?: string
          electricityAvailable?: boolean
          elementarySchool?: string | null
          exteriorFeatures?: string[] | null
          featuredOrder?: number | null
          furnished?: Database["public"]["Enums"]["FurnishedStatus"] | null
          garageSpaces?: number | null
          gasAvailable?: boolean
          hasDeck?: boolean
          hasFireplace?: boolean
          hasPatio?: boolean
          hasPorch?: boolean
          heating?: string[] | null
          highSchool?: string | null
          hoaFeeAmount?: number | null
          hoaFeeFrequency?: string | null
          hoaName?: string | null
          interiorFeatures?: string[] | null
          isFeatured?: boolean
          isWaterfront?: boolean
          listingAgreement?:
            | Database["public"]["Enums"]["ListingAgreement"]
            | null
          listingContractDate?: string | null
          listingKey?: string | null
          listingTerms?: Database["public"]["Enums"]["ListingTerms"][] | null
          listPrice: number
          livingArea?: number | null
          lotDimensionsSource?: string | null
          lotSize?: number | null
          lotSizeDimensions?: string | null
          middleSchool?: string | null
          mlsId?: string | null
          mlsLink?: string | null
          mlsSource?: string | null
          modificationTimestamp?: string | null
          originalListPrice?: number | null
          parcelNumber?: string | null
          parkingTotal?: number | null
          photos?: Json | null
          postalCode: string
          priceChangeTimestamp?: string | null
          privateRemarks?: string | null
          propertyCondition?:
            | Database["public"]["Enums"]["PropertyCondition"][]
            | null
          propertySubType?:
            | Database["public"]["Enums"]["PropertySubType"]
            | null
          propertyType: Database["public"]["Enums"]["PropertyType"]
          publicListingUrl?: string | null
          publicRemarks?: string | null
          realtorProfileUlid: string
          roofType?: Database["public"]["Enums"]["RoofType"] | null
          schoolDistrict?: string | null
          sewerAvailable?: boolean
          source?: string
          stateOrProvince: string
          status?: Database["public"]["Enums"]["ListingStatus"]
          statusChangeTimestamp?: string | null
          stories?: number | null
          streetName: string
          streetNumber: string
          taxAnnualAmount?: number | null
          taxBlock?: string | null
          taxLegalDescription?: string | null
          taxLot?: string | null
          taxMapNumber?: string | null
          taxYear?: number | null
          ulid: string
          unitNumber?: string | null
          updatedAt: string
          view?: Database["public"]["Enums"]["ViewType"][] | null
          virtualTours?: Json | null
          waterAvailable?: boolean
          yearBuilt?: number | null
          zoning?: string | null
          zoningDescription?: string | null
        }
        Update: {
          appliances?: string[] | null
          architecturalStyle?:
            | Database["public"]["Enums"]["ArchitecturalStyle"]
            | null
          basement?: Database["public"]["Enums"]["BasementType"] | null
          bathroomsTotal?: number | null
          bedroomsTotal?: number | null
          city?: string
          closeDate?: string | null
          closePrice?: number | null
          cooling?: string[] | null
          createdAt?: string
          electricityAvailable?: boolean
          elementarySchool?: string | null
          exteriorFeatures?: string[] | null
          featuredOrder?: number | null
          furnished?: Database["public"]["Enums"]["FurnishedStatus"] | null
          garageSpaces?: number | null
          gasAvailable?: boolean
          hasDeck?: boolean
          hasFireplace?: boolean
          hasPatio?: boolean
          hasPorch?: boolean
          heating?: string[] | null
          highSchool?: string | null
          hoaFeeAmount?: number | null
          hoaFeeFrequency?: string | null
          hoaName?: string | null
          interiorFeatures?: string[] | null
          isFeatured?: boolean
          isWaterfront?: boolean
          listingAgreement?:
            | Database["public"]["Enums"]["ListingAgreement"]
            | null
          listingContractDate?: string | null
          listingKey?: string | null
          listingTerms?: Database["public"]["Enums"]["ListingTerms"][] | null
          listPrice?: number
          livingArea?: number | null
          lotDimensionsSource?: string | null
          lotSize?: number | null
          lotSizeDimensions?: string | null
          middleSchool?: string | null
          mlsId?: string | null
          mlsLink?: string | null
          mlsSource?: string | null
          modificationTimestamp?: string | null
          originalListPrice?: number | null
          parcelNumber?: string | null
          parkingTotal?: number | null
          photos?: Json | null
          postalCode?: string
          priceChangeTimestamp?: string | null
          privateRemarks?: string | null
          propertyCondition?:
            | Database["public"]["Enums"]["PropertyCondition"][]
            | null
          propertySubType?:
            | Database["public"]["Enums"]["PropertySubType"]
            | null
          propertyType?: Database["public"]["Enums"]["PropertyType"]
          publicListingUrl?: string | null
          publicRemarks?: string | null
          realtorProfileUlid?: string
          roofType?: Database["public"]["Enums"]["RoofType"] | null
          schoolDistrict?: string | null
          sewerAvailable?: boolean
          source?: string
          stateOrProvince?: string
          status?: Database["public"]["Enums"]["ListingStatus"]
          statusChangeTimestamp?: string | null
          stories?: number | null
          streetName?: string
          streetNumber?: string
          taxAnnualAmount?: number | null
          taxBlock?: string | null
          taxLegalDescription?: string | null
          taxLot?: string | null
          taxMapNumber?: string | null
          taxYear?: number | null
          ulid?: string
          unitNumber?: string | null
          updatedAt?: string
          view?: Database["public"]["Enums"]["ViewType"][] | null
          virtualTours?: Json | null
          waterAvailable?: boolean
          yearBuilt?: number | null
          zoning?: string | null
          zoningDescription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Listing_realtorProfileUlid_fkey"
            columns: ["realtorProfileUlid"]
            isOneToOne: false
            referencedRelation: "RealtorProfile"
            referencedColumns: ["ulid"]
          },
        ]
      }
      LoanOfficerProfile: {
        Row: {
          averageLoanSize: number | null
          branchLocation: string | null
          certifications: string[] | null
          closedLoansCount: number | null
          createdAt: string
          geographicFocus: Json | null
          languages: string[] | null
          lenderName: string | null
          licensedStates: string[] | null
          loanTypes: Database["public"]["Enums"]["LoanType"][] | null
          maxLoanAmount: number | null
          minLoanAmount: number | null
          nmls: string | null
          primaryMarket: string | null
          specializations: string[] | null
          totalLoanVolume: number | null
          typicalTurnaroundDays: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience: number | null
        }
        Insert: {
          averageLoanSize?: number | null
          branchLocation?: string | null
          certifications?: string[] | null
          closedLoansCount?: number | null
          createdAt?: string
          geographicFocus?: Json | null
          languages?: string[] | null
          lenderName?: string | null
          licensedStates?: string[] | null
          loanTypes?: Database["public"]["Enums"]["LoanType"][] | null
          maxLoanAmount?: number | null
          minLoanAmount?: number | null
          nmls?: string | null
          primaryMarket?: string | null
          specializations?: string[] | null
          totalLoanVolume?: number | null
          typicalTurnaroundDays?: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience?: number | null
        }
        Update: {
          averageLoanSize?: number | null
          branchLocation?: string | null
          certifications?: string[] | null
          closedLoansCount?: number | null
          createdAt?: string
          geographicFocus?: Json | null
          languages?: string[] | null
          lenderName?: string | null
          licensedStates?: string[] | null
          loanTypes?: Database["public"]["Enums"]["LoanType"][] | null
          maxLoanAmount?: number | null
          minLoanAmount?: number | null
          nmls?: string | null
          primaryMarket?: string | null
          specializations?: string[] | null
          totalLoanVolume?: number | null
          typicalTurnaroundDays?: number | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsExperience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "LoanOfficerProfile_userUlid_fkey"
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
          activeDomains: string[] | null
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
          activeDomains?: string[] | null
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
          activeDomains?: string[] | null
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
          activeAgents: number | null
          certifications: string[] | null
          createdAt: string
          description: string | null
          industry: Database["public"]["Enums"]["OrgIndustry"] | null
          level: Database["public"]["Enums"]["OrgLevel"]
          licenseNumbers: Json | null
          metadata: Json | null
          name: string
          parentUlid: string | null
          primaryDomain: Database["public"]["Enums"]["DomainType"] | null
          serviceAreas: string[] | null
          specializations: string[] | null
          status: string
          tier: Database["public"]["Enums"]["OrgTier"]
          totalTransactions: number | null
          transactionVolume: number | null
          type: Database["public"]["Enums"]["OrgType"]
          ulid: string
          updatedAt: string
        }
        Insert: {
          activeAgents?: number | null
          certifications?: string[] | null
          createdAt?: string
          description?: string | null
          industry?: Database["public"]["Enums"]["OrgIndustry"] | null
          level?: Database["public"]["Enums"]["OrgLevel"]
          licenseNumbers?: Json | null
          metadata?: Json | null
          name: string
          parentUlid?: string | null
          primaryDomain?: Database["public"]["Enums"]["DomainType"] | null
          serviceAreas?: string[] | null
          specializations?: string[] | null
          status?: string
          tier?: Database["public"]["Enums"]["OrgTier"]
          totalTransactions?: number | null
          transactionVolume?: number | null
          type?: Database["public"]["Enums"]["OrgType"]
          ulid: string
          updatedAt: string
        }
        Update: {
          activeAgents?: number | null
          certifications?: string[] | null
          createdAt?: string
          description?: string | null
          industry?: Database["public"]["Enums"]["OrgIndustry"] | null
          level?: Database["public"]["Enums"]["OrgLevel"]
          licenseNumbers?: Json | null
          metadata?: Json | null
          name?: string
          parentUlid?: string | null
          primaryDomain?: Database["public"]["Enums"]["DomainType"] | null
          serviceAreas?: string[] | null
          specializations?: string[] | null
          status?: string
          tier?: Database["public"]["Enums"]["OrgTier"]
          totalTransactions?: number | null
          transactionVolume?: number | null
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
      ProfessionalRecognition: {
        Row: {
          certificateUrl: string | null
          createdAt: string
          description: string | null
          expiryDate: string | null
          insuranceProfileUlid: string | null
          investorProfileUlid: string | null
          issueDate: string
          issuer: string
          loanOfficerProfileUlid: string | null
          propertyManagerProfileUlid: string | null
          realtorProfileUlid: string | null
          status: Database["public"]["Enums"]["CertificationStatus"]
          title: string
          titleEscrowProfileUlid: string | null
          type: Database["public"]["Enums"]["RecognitionType"]
          ulid: string
          updatedAt: string
          userUlid: string
          verificationUrl: string | null
        }
        Insert: {
          certificateUrl?: string | null
          createdAt?: string
          description?: string | null
          expiryDate?: string | null
          insuranceProfileUlid?: string | null
          investorProfileUlid?: string | null
          issueDate: string
          issuer: string
          loanOfficerProfileUlid?: string | null
          propertyManagerProfileUlid?: string | null
          realtorProfileUlid?: string | null
          status?: Database["public"]["Enums"]["CertificationStatus"]
          title: string
          titleEscrowProfileUlid?: string | null
          type: Database["public"]["Enums"]["RecognitionType"]
          ulid: string
          updatedAt: string
          userUlid: string
          verificationUrl?: string | null
        }
        Update: {
          certificateUrl?: string | null
          createdAt?: string
          description?: string | null
          expiryDate?: string | null
          insuranceProfileUlid?: string | null
          investorProfileUlid?: string | null
          issueDate?: string
          issuer?: string
          loanOfficerProfileUlid?: string | null
          propertyManagerProfileUlid?: string | null
          realtorProfileUlid?: string | null
          status?: Database["public"]["Enums"]["CertificationStatus"]
          title?: string
          titleEscrowProfileUlid?: string | null
          type?: Database["public"]["Enums"]["RecognitionType"]
          ulid?: string
          updatedAt?: string
          userUlid?: string
          verificationUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ProfessionalRecognition_insuranceProfileUlid_fkey"
            columns: ["insuranceProfileUlid"]
            isOneToOne: false
            referencedRelation: "InsuranceProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "ProfessionalRecognition_investorProfileUlid_fkey"
            columns: ["investorProfileUlid"]
            isOneToOne: false
            referencedRelation: "InvestorProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "ProfessionalRecognition_loanOfficerProfileUlid_fkey"
            columns: ["loanOfficerProfileUlid"]
            isOneToOne: false
            referencedRelation: "LoanOfficerProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "ProfessionalRecognition_propertyManagerProfileUlid_fkey"
            columns: ["propertyManagerProfileUlid"]
            isOneToOne: false
            referencedRelation: "PropertyManagerProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "ProfessionalRecognition_realtorProfileUlid_fkey"
            columns: ["realtorProfileUlid"]
            isOneToOne: false
            referencedRelation: "RealtorProfile"
            referencedColumns: ["ulid"]
          },
          {
            foreignKeyName: "ProfessionalRecognition_titleEscrowProfileUlid_fkey"
            columns: ["titleEscrowProfileUlid"]
            isOneToOne: false
            referencedRelation: "TitleEscrowProfile"
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
      PropertyManagerProfile: {
        Row: {
          certifications: string[] | null
          companyName: string | null
          createdAt: string
          geographicFocus: Json | null
          languages: string[] | null
          licenseNumber: string | null
          managementSoftware: string | null
          managerTypes:
            | Database["public"]["Enums"]["PropertyManagerType"][]
            | null
          minimumUnits: number | null
          occupancyRate: number | null
          primaryMarket: string | null
          propertiesManaged: number | null
          propertyTypes: string[] | null
          services: string[] | null
          serviceZips: string[] | null
          specializations: string[] | null
          squareFeetManaged: number | null
          totalUnits: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience: number | null
        }
        Insert: {
          certifications?: string[] | null
          companyName?: string | null
          createdAt?: string
          geographicFocus?: Json | null
          languages?: string[] | null
          licenseNumber?: string | null
          managementSoftware?: string | null
          managerTypes?:
            | Database["public"]["Enums"]["PropertyManagerType"][]
            | null
          minimumUnits?: number | null
          occupancyRate?: number | null
          primaryMarket?: string | null
          propertiesManaged?: number | null
          propertyTypes?: string[] | null
          services?: string[] | null
          serviceZips?: string[] | null
          specializations?: string[] | null
          squareFeetManaged?: number | null
          totalUnits?: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience?: number | null
        }
        Update: {
          certifications?: string[] | null
          companyName?: string | null
          createdAt?: string
          geographicFocus?: Json | null
          languages?: string[] | null
          licenseNumber?: string | null
          managementSoftware?: string | null
          managerTypes?:
            | Database["public"]["Enums"]["PropertyManagerType"][]
            | null
          minimumUnits?: number | null
          occupancyRate?: number | null
          primaryMarket?: string | null
          propertiesManaged?: number | null
          propertyTypes?: string[] | null
          services?: string[] | null
          serviceZips?: string[] | null
          specializations?: string[] | null
          squareFeetManaged?: number | null
          totalUnits?: number | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsExperience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PropertyManagerProfile_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
      }
      RealtorProfile: {
        Row: {
          certifications: string[] | null
          companyName: string | null
          createdAt: string
          designations: string[] | null
          geographicFocus: Json | null
          languages: string[] | null
          memberKey: string | null
          memberStatus: string | null
          mlsId: string | null
          mlsName: string | null
          mlsStatus: string | null
          primaryMarket: string | null
          propertyTypes: string[] | null
          specializations: string[] | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience: number | null
        }
        Insert: {
          certifications?: string[] | null
          companyName?: string | null
          createdAt?: string
          designations?: string[] | null
          geographicFocus?: Json | null
          languages?: string[] | null
          memberKey?: string | null
          memberStatus?: string | null
          mlsId?: string | null
          mlsName?: string | null
          mlsStatus?: string | null
          primaryMarket?: string | null
          propertyTypes?: string[] | null
          specializations?: string[] | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience?: number | null
        }
        Update: {
          certifications?: string[] | null
          companyName?: string | null
          createdAt?: string
          designations?: string[] | null
          geographicFocus?: Json | null
          languages?: string[] | null
          memberKey?: string | null
          memberStatus?: string | null
          mlsId?: string | null
          mlsName?: string | null
          mlsStatus?: string | null
          primaryMarket?: string | null
          propertyTypes?: string[] | null
          specializations?: string[] | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsExperience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "RealtorProfile_userUlid_fkey"
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
      Session: {
        Row: {
          coachPayoutAmount: number | null
          coachUlid: string
          createdAt: string
          currency: string | null
          endTime: string
          menteeUlid: string
          paymentStatus: string | null
          payoutStatus: string | null
          platformFeeAmount: number | null
          priceAmount: number | null
          sessionNotes: string | null
          sessionType: Database["public"]["Enums"]["SessionType"] | null
          startTime: string
          status: Database["public"]["Enums"]["SessionStatus"]
          stripePaymentIntentId: string | null
          ulid: string
          updatedAt: string
          zoomMeetingId: string | null
          zoomMeetingUrl: string | null
        }
        Insert: {
          coachPayoutAmount?: number | null
          coachUlid: string
          createdAt?: string
          currency?: string | null
          endTime: string
          menteeUlid: string
          paymentStatus?: string | null
          payoutStatus?: string | null
          platformFeeAmount?: number | null
          priceAmount?: number | null
          sessionNotes?: string | null
          sessionType?: Database["public"]["Enums"]["SessionType"] | null
          startTime: string
          status?: Database["public"]["Enums"]["SessionStatus"]
          stripePaymentIntentId?: string | null
          ulid: string
          updatedAt: string
          zoomMeetingId?: string | null
          zoomMeetingUrl?: string | null
        }
        Update: {
          coachPayoutAmount?: number | null
          coachUlid?: string
          createdAt?: string
          currency?: string | null
          endTime?: string
          menteeUlid?: string
          paymentStatus?: string | null
          payoutStatus?: string | null
          platformFeeAmount?: number | null
          priceAmount?: number | null
          sessionNotes?: string | null
          sessionType?: Database["public"]["Enums"]["SessionType"] | null
          startTime?: string
          status?: Database["public"]["Enums"]["SessionStatus"]
          stripePaymentIntentId?: string | null
          ulid?: string
          updatedAt?: string
          zoomMeetingId?: string | null
          zoomMeetingUrl?: string | null
        }
        Relationships: [
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
        ]
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
          billingCycle: string
          createdAt: string
          defaultPaymentMethodId: string | null
          endDate: string | null
          metadata: Json
          organizationUlid: string | null
          planUlid: string
          quantity: number
          startDate: string
          status: string
          stripeCustomerId: string
          subscriptionId: string
          ulid: string
          updatedAt: string
          userUlid: string | null
        }
        Insert: {
          billingCycle?: string
          createdAt?: string
          defaultPaymentMethodId?: string | null
          endDate?: string | null
          metadata?: Json
          organizationUlid?: string | null
          planUlid: string
          quantity?: number
          startDate: string
          status: string
          stripeCustomerId: string
          subscriptionId: string
          ulid: string
          updatedAt: string
          userUlid?: string | null
        }
        Update: {
          billingCycle?: string
          createdAt?: string
          defaultPaymentMethodId?: string | null
          endDate?: string | null
          metadata?: Json
          organizationUlid?: string | null
          planUlid?: string
          quantity?: number
          startDate?: string
          status?: string
          stripeCustomerId?: string
          subscriptionId?: string
          ulid?: string
          updatedAt?: string
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
            foreignKeyName: "Subscription_planUlid_fkey"
            columns: ["planUlid"]
            isOneToOne: false
            referencedRelation: "SubscriptionPlan"
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
      SubscriptionPlan: {
        Row: {
          amount: number
          createdAt: string
          currency: string
          description: string
          features: Json
          interval: string
          isActive: boolean
          limits: Json
          metadata: Json
          name: string
          planId: string
          type: Database["public"]["Enums"]["PlanType"]
          ulid: string
          updatedAt: string
        }
        Insert: {
          amount: number
          createdAt?: string
          currency?: string
          description: string
          features?: Json
          interval: string
          isActive?: boolean
          limits?: Json
          metadata?: Json
          name: string
          planId: string
          type?: Database["public"]["Enums"]["PlanType"]
          ulid: string
          updatedAt: string
        }
        Update: {
          amount?: number
          createdAt?: string
          currency?: string
          description?: string
          features?: Json
          interval?: string
          isActive?: boolean
          limits?: Json
          metadata?: Json
          name?: string
          planId?: string
          type?: Database["public"]["Enums"]["PlanType"]
          ulid?: string
          updatedAt?: string
        }
        Relationships: []
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
      TitleEscrowProfile: {
        Row: {
          averageClosingTime: number | null
          certifications: string[] | null
          closingsCompleted: number | null
          companyName: string | null
          createdAt: string
          geographicFocus: Json | null
          languages: string[] | null
          licensedStates: string[] | null
          licenseNumber: string | null
          primaryMarket: string | null
          specializations: string[] | null
          titleEscrowTypes:
            | Database["public"]["Enums"]["TitleEscrowType"][]
            | null
          totalTransactionVolume: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience: number | null
        }
        Insert: {
          averageClosingTime?: number | null
          certifications?: string[] | null
          closingsCompleted?: number | null
          companyName?: string | null
          createdAt?: string
          geographicFocus?: Json | null
          languages?: string[] | null
          licensedStates?: string[] | null
          licenseNumber?: string | null
          primaryMarket?: string | null
          specializations?: string[] | null
          titleEscrowTypes?:
            | Database["public"]["Enums"]["TitleEscrowType"][]
            | null
          totalTransactionVolume?: number | null
          ulid: string
          updatedAt: string
          userUlid: string
          yearsExperience?: number | null
        }
        Update: {
          averageClosingTime?: number | null
          certifications?: string[] | null
          closingsCompleted?: number | null
          companyName?: string | null
          createdAt?: string
          geographicFocus?: Json | null
          languages?: string[] | null
          licensedStates?: string[] | null
          licenseNumber?: string | null
          primaryMarket?: string | null
          specializations?: string[] | null
          titleEscrowTypes?:
            | Database["public"]["Enums"]["TitleEscrowType"][]
            | null
          totalTransactionVolume?: number | null
          ulid?: string
          updatedAt?: string
          userUlid?: string
          yearsExperience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "TitleEscrowProfile_userUlid_fkey"
            columns: ["userUlid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["ulid"]
          },
        ]
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
          lastName: string | null
          phoneNumber: string | null
          profileImageUrl: string | null
          status: Database["public"]["Enums"]["UserStatus"]
          stripeConnectAccountId: string | null
          stripeCustomerId: string | null
          systemRole: Database["public"]["Enums"]["UserRole"]
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
          lastName?: string | null
          phoneNumber?: string | null
          profileImageUrl?: string | null
          status?: Database["public"]["Enums"]["UserStatus"]
          stripeConnectAccountId?: string | null
          stripeCustomerId?: string | null
          systemRole?: Database["public"]["Enums"]["UserRole"]
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
          lastName?: string | null
          phoneNumber?: string | null
          profileImageUrl?: string | null
          status?: Database["public"]["Enums"]["UserStatus"]
          stripeConnectAccountId?: string | null
          stripeCustomerId?: string | null
          systemRole?: Database["public"]["Enums"]["UserRole"]
          ulid?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: []
      }
      ZoomSession: {
        Row: {
          createdAt: string
          joinUrl: string | null
          sessionUlid: string
          status: string
          topic: string
          ulid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          joinUrl?: string | null
          sessionUlid: string
          status: string
          topic: string
          ulid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          joinUrl?: string | null
          sessionUlid?: string
          status?: string
          topic?: string
          ulid?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ZoomSession_sessionUlid_fkey"
            columns: ["sessionUlid"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["ulid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      armor: {
        Args: {
          "": string
        }
        Returns: string
      }
      array_distinct: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      citext:
        | {
            Args: {
              "": boolean
            }
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: string
          }
      citext_hash: {
        Args: {
          "": string
        }
        Returns: number
      }
      citextin: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextout: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      citextrecv: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextsend: {
        Args: {
          "": string
        }
        Returns: string
      }
      compare_ulids: {
        Args: {
          ulid1: string
          ulid2: string
        }
        Returns: number
      }
      create_tsvector_index: {
        Args: {
          table_name: string
          column_name: string
        }
        Returns: undefined
      }
      create_ulid_indexes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      dearmor: {
        Args: {
          "": string
        }
        Returns: string
      }
      gen_random_bytes: {
        Args: {
          "": number
        }
        Returns: string
      }
      gen_random_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gen_salt: {
        Args: {
          "": string
        }
        Returns: string
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      pgp_armor_headers: {
        Args: {
          "": string
        }
        Returns: Record<string, unknown>[]
      }
      pgp_key_id: {
        Args: {
          "": string
        }
        Returns: string
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      ulid_to_timestamp: {
        Args: {
          ulid: string
        }
        Returns: string
      }
      unaccent: {
        Args: {
          "": string
        }
        Returns: string
      }
      unaccent_init: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      uuid_generate_v1: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v1mc: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v3: {
        Args: {
          namespace: string
          name: string
        }
        Returns: string
      }
      uuid_generate_v4: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v5: {
        Args: {
          namespace: string
          name: string
        }
        Returns: string
      }
      uuid_nil: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_dns: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_oid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_x500: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      AchievementType: "MILESTONE" | "PERFORMANCE" | "LEARNING"
      ActivitySeverity: "INFO" | "WARNING" | "ERROR"
      ActivityType: "USER" | "COACH" | "SYSTEM" | "SECURITY"
      ApplicationStatus: "PENDING" | "APPROVED" | "REJECTED"
      ArchitecturalStyle:
        | "Colonial"
        | "Contemporary"
        | "Craftsman"
        | "Mediterranean"
        | "Modern"
        | "Ranch"
        | "Traditional"
        | "Victorian"
      BasementType: "Finished" | "Partially" | "Unfinished" | "None"
      CertificationStatus: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING"
      CoachApplicationStatus: "PENDING" | "APPROVED" | "REJECTED"
      Currency: "USD" | "EUR" | "GBP"
      DisputeStatus: "OPEN" | "RESOLVED" | "REJECTED"
      DomainStatus: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED"
      DomainType:
        | "REALTOR"
        | "LOAN_OFFICER"
        | "TITLE_OFFICER"
        | "PROPERTY_MANAGER"
        | "INVESTOR"
      ExpertiseLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
      FurnishedStatus: "Furnished" | "Negotiable" | "Partially" | "Unfurnished"
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
      ListingAgreement: "Exclusive" | "OpenListing" | "PocketListing"
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
      ListingTerms: "Cash" | "Conventional" | "FHA" | "OwnerFinancing" | "VA"
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
        | "BUSINESS"
        | "ENTERPRISE"
        | "FRANCHISE"
        | "NETWORK"
        | "TEAM"
      PaymentMethod: "credit_card" | "debit_card" | "bank_transfer"
      PaymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      PayoutStatus: "PENDING" | "PROCESSED" | "FAILED"
      PlanType: "INDIVIDUAL" | "TEAM" | "ENTERPRISE"
      ProfileStatus: "DRAFT" | "REVIEW" | "PUBLISHED"
      PropertyCondition:
        | "Excellent"
        | "Good"
        | "Fair"
        | "NeedsWork"
        | "Renovated"
        | "Updated"
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
      RecognitionType: "AWARD" | "ACHIEVEMENT"
      RefundStatus: "PENDING" | "COMPLETED" | "FAILED"
      ReviewStatus: "PENDING" | "PUBLISHED" | "HIDDEN"
      RoofType: "Asphalt" | "Metal" | "Slate" | "Tile" | "Wood"
      SessionStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
      SessionType: "PEER_TO_PEER" | "MENTORSHIP" | "GROUP"
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
      ViewType:
        | "City"
        | "Golf"
        | "Lake"
        | "Mountain"
        | "Ocean"
        | "Park"
        | "River"
        | "Woods"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
