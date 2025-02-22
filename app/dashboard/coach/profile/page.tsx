"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import GeneralForm from "@/components/profile/GeneralForm"
import ListingsForm from "@/components/profile/ListingsForm"
import MarketingInformation from "@/components/profile/MarketingInfo"
import GoalsForm from "@/components/profile/GoalsForm"
import { CoachProfileForm } from "@/components/profile/CoachProfileForm"
import { 
  fetchUserProfile,
} from "@/utils/actions/user"
import type { DbUser } from "@/utils/supabase/types"
import { 
  fetchCoachProfile,
  updateCoachProfile,
  type CoachProfileFormData 
} from "@/utils/actions/coach-actions"
import { 
  updateMarketingInfo,
} from "@/utils/actions/marketing-actions"
import type { RealtorProfile } from "@/utils/types/realtor"
import { 
  createListing,
  updateListing,
  fetchListings,
} from "@/utils/actions/listing"
import type { DbListing } from "@/utils/supabase/types"
import { 
  createGoal,
} from "@/utils/actions/goals"
import type { GoalFormValues } from "@/utils/types/goals"
import { toast } from "sonner"
import { ListingWithRealtor, ListingStatus, type CreateListing, ListingStatusEnum, type UpdateListing } from '@/utils/types/listing'
import type { MarketingInfo } from "@/utils/types/marketing"

interface ListingsState {
  activeListings: ListingWithRealtor[];
  successfulTransactions: ListingWithRealtor[];
}

interface GoalsFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormValues) => Promise<void>;
}

export default function CoachProfilePage() {
  const [generalInfo, setGeneralInfo] = useState<DbUser | null>(null)
  const [coachingInfo, setCoachingInfo] = useState<CoachProfileFormData | null>(null)
  const [listings, setListings] = useState<ListingsState>({
    activeListings: [],
    successfulTransactions: [],
  })
  const [marketing, setMarketing] = useState<MarketingInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      // Load user profile
      const userResult = await fetchUserProfile({})
      if (userResult.error) {
        throw new Error(userResult.error.message)
      }

      // Load coach profile
      const coachResult = await fetchCoachProfile()
      if (coachResult.error) {
        throw new Error(coachResult.error.message)
      }

      // Load listings if available
      if (coachResult.data?._rawRealtorProfile?.ulid) {
        const listingsResult = await fetchListings({
          limit: 100,
          offset: 0,
          sortBy: "createdAt",
          sortOrder: "desc"
        })
        if (listingsResult.data) {
          const activeListings = listingsResult.data.listings
            .filter((listing: any) => {
              const status = listing.status?.toUpperCase()
              return status === 'ACTIVE' || status === 'PENDING'
            })
            .map((listing: any) => {
              const baseFields = {
                realtorProfile: coachResult.data!._rawRealtorProfile,
                realtorProfileUlid: coachResult.data!._rawRealtorProfile!.ulid,
                userUlid: userResult.data!.ulid,
                appliances: listing.appliances?.map(String) || null,
                status: listing.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' :
                       listing.status?.toUpperCase() === 'PENDING' ? 'PENDING' :
                       listing.status?.toUpperCase() === 'CLOSED' ? 'SOLD' :
                       listing.status?.toUpperCase() === 'WITHDRAWN' ? 'WITHDRAWN' :
                       listing.status?.toUpperCase() === 'EXPIRED' ? 'EXPIRED' : 'DRAFT',
                closeDate: listing.closeDate ? new Date(listing.closeDate).toISOString() : null,
                listingKey: listing.listingKey || '',
                mlsSource: listing.mlsSource || null,
                source: listing.source || 'MANUAL'
              }
              return { ...listing, ...baseFields }
            }) || []

          const successfulTransactions = listingsResult.data.listings
            .filter((listing: any) => {
              const status = listing.status?.toUpperCase()
              return status === 'CLOSED' || status === 'SOLD'
            })
            .map((listing: any) => {
              const baseFields = {
                realtorProfile: coachResult.data!._rawRealtorProfile,
                realtorProfileUlid: coachResult.data!._rawRealtorProfile!.ulid,
                userUlid: userResult.data!.ulid,
                appliances: listing.appliances?.map(String) || null,
                status: 'SOLD',
                closeDate: listing.closeDate ? new Date(listing.closeDate).toISOString() : null,
                listingKey: listing.listingKey || '',
                mlsSource: listing.mlsSource || null,
                source: listing.source || 'MANUAL'
              }
              return { ...listing, ...baseFields }
            }) || []

          setListings({
            activeListings,
            successfulTransactions,
          })
        }
      }

      if (userResult.data) {
        setGeneralInfo({
          bio: userResult.data.bio ?? null,
          capabilities: userResult.data.capabilities ?? null,
          createdAt: new Date(userResult.data.createdAt).toISOString(),
          displayName: userResult.data.displayName ?? null,
          email: userResult.data.email,
          firstName: userResult.data.firstName ?? null,
          isCoach: userResult.data.isCoach,
          isMentee: userResult.data.isMentee,
          lastName: userResult.data.lastName ?? null,
          phoneNumber: userResult.data.phoneNumber ?? null,
          profileImageUrl: userResult.data.profileImageUrl ?? null,
          status: userResult.data.status,
          stripeConnectAccountId: userResult.data.stripeConnectAccountId ?? null,
          stripeCustomerId: userResult.data.stripeCustomerId ?? null,
          systemRole: userResult.data.systemRole,
          ulid: userResult.data.ulid,
          updatedAt: new Date(userResult.data.updatedAt).toISOString(),
          userId: userResult.data.userId
        })
      }
      if (coachResult.data) {
        setCoachingInfo({
          specialties: coachResult.data.specialties || [],
          yearsCoaching: coachResult.data.yearsCoaching || 0,
          hourlyRate: coachResult.data.hourlyRate || 0,
          defaultDuration: coachResult.data.defaultDuration || 60,
          minimumDuration: coachResult.data.minimumDuration || 30,
          maximumDuration: coachResult.data.maximumDuration || 120,
          allowCustomDuration: coachResult.data.allowCustomDuration || false,
          calendlyUrl: coachResult.data.calendlyUrl || "",
          eventTypeUrl: coachResult.data.eventTypeUrl || ""
        })
      }

      if (coachResult.data?._rawRealtorProfile?.marketingInfo) {
        const marketingInfo: MarketingInfo = {
          testimonials: coachResult.data._rawRealtorProfile.marketingInfo.testimonials?.map((t: { author: string; content: string }) => ({
            author: t.author ?? '',
            content: t.content ?? ''
          })) ?? [],
          slogan: coachResult.data._rawRealtorProfile.marketingInfo.slogan ?? undefined,
          websiteUrl: coachResult.data._rawRealtorProfile.marketingInfo.websiteUrl ?? undefined,
          facebookUrl: coachResult.data._rawRealtorProfile.marketingInfo.facebookUrl ?? undefined,
          instagramUrl: coachResult.data._rawRealtorProfile.marketingInfo.instagramUrl ?? undefined,
          linkedinUrl: coachResult.data._rawRealtorProfile.marketingInfo.linkedinUrl ?? undefined,
          youtubeUrl: coachResult.data._rawRealtorProfile.marketingInfo.youtubeUrl ?? undefined,
          marketingAreas: coachResult.data._rawRealtorProfile.marketingAreas || []
        }

        const profile = coachResult.data._rawRealtorProfile;
        const activeListings = (profile.listings || [])
          .filter((l: { status: string }) => l.status === 'ACTIVE' || l.status === 'PENDING')
          .map((listing: any) => {
            const { ulid, realtorProfileUlid, ...rest } = listing;
            return {
              ulid,
              realtorProfileUlid,
              listingUlid: ulid,
              ...rest,
              realtorProfile: {
                ulid: profile.ulid,
                userDbId: profile.userDbId,
                bio: profile.bio,
                yearsExperience: profile.yearsExperience,
                certifications: profile.certifications,
                languages: profile.languages,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
              }
            };
          });

        const successfulTransactions = (profile.listings || [])
          .filter((l: { status: string }) => l.status === 'CLOSED' || l.status === 'SOLD')
          .map((listing: any) => {
            const { ulid, realtorProfileUlid, ...rest } = listing;
            return {
              ulid,
              realtorProfileUlid,
              listingUlid: ulid,
              ...rest,
              realtorProfile: {
                ulid: profile.ulid,
                userDbId: profile.userDbId,
                bio: profile.bio,
                yearsExperience: profile.yearsExperience,
                certifications: profile.certifications,
                languages: profile.languages,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
              }
            };
          });

        setMarketing(marketingInfo)
        setListings({ activeListings, successfulTransactions })
      }
    } catch (error) {
      console.error('[LOAD_PROFILE_ERROR]', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSubmit = async (formData: any, formType: string): Promise<void> => {
    try {
      setIsSubmitting(true)
      
      switch (formType) {
        case "general": {
          const result = await fetchUserProfile({})
          if (result.error) {
            throw new Error(result.error.message)
          }
          setGeneralInfo({
            bio: result.data?.bio ?? null,
            capabilities: result.data?.capabilities ?? null,
            createdAt: new Date(result.data?.createdAt || new Date()).toISOString(),
            displayName: result.data?.displayName ?? null,
            email: result.data?.email ?? '',
            firstName: result.data?.firstName ?? null,
            isCoach: result.data?.isCoach ?? false,
            isMentee: result.data?.isMentee ?? false,
            lastName: result.data?.lastName ?? null,
            phoneNumber: result.data?.phoneNumber ?? null,
            profileImageUrl: result.data?.profileImageUrl ?? null,
            status: result.data?.status ?? 'ACTIVE',
            stripeConnectAccountId: result.data?.stripeConnectAccountId ?? null,
            stripeCustomerId: result.data?.stripeCustomerId ?? null,
            systemRole: result.data?.systemRole ?? 'USER',
            ulid: result.data?.ulid ?? '',
            updatedAt: new Date(result.data?.updatedAt || new Date()).toISOString(),
            userId: result.data?.userId ?? ''
          })
          toast.success('Profile updated successfully')
          break
        }
        
        case "coach": {
          const result = await updateCoachProfile(formData as CoachProfileFormData)
          if (result.error) {
            throw new Error(result.error.message)
          }
          setCoachingInfo(formData as CoachProfileFormData)
          toast.success('Coach profile updated successfully')
          break
        }
        
        case "marketing": {
          const { testimonials, ...rest } = formData as any;
          const marketingData = {
            ...rest,
            testimonials: (testimonials || []).map((t: { author: string; content: string }) => ({
              author: t.author || '',
              content: t.content || ''
            })),
            slogan: rest.slogan === null ? undefined : rest.slogan,
            websiteUrl: rest.websiteUrl === null ? undefined : rest.websiteUrl,
            facebookUrl: rest.facebookUrl === null ? undefined : rest.facebookUrl,
            instagramUrl: rest.instagramUrl === null ? undefined : rest.instagramUrl,
            linkedinUrl: rest.linkedinUrl === null ? undefined : rest.linkedinUrl,
            youtubeUrl: rest.youtubeUrl === null ? undefined : rest.youtubeUrl,
            updatedAt: new Date().toISOString()
          }
          const result = await updateMarketingInfo(marketingData)
          if (result.error) {
            throw new Error(result.error.message)
          }
          setMarketing(marketingData)
          toast.success('Marketing information updated successfully')
          break
        }
        
        case "goals": {
          const result = await createGoal(formData as GoalFormValues)
          if (result.error) {
            throw new Error(result.error.message)
          }
          toast.success('Goal created successfully')
          break
        }
        case "listing": {
          const { listingUlid, ...listingData } = formData;
          const mappedStatus = (listingData.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' :
                              listingData.status?.toUpperCase() === 'PENDING' ? 'PENDING' :
                              listingData.status?.toUpperCase() === 'SOLD' ? 'SOLD' :
                              listingData.status?.toUpperCase() === 'WITHDRAWN' ? 'WITHDRAWN' :
                              listingData.status?.toUpperCase() === 'EXPIRED' ? 'EXPIRED' : 'DRAFT') as ListingStatus;
          
          const updateData: UpdateListing = {
            listingUlid,
            status: mappedStatus,
            closeDate: listingData.closeDate ? new Date(listingData.closeDate).toISOString() : null,
            listPrice: listingData.listPrice,
            streetNumber: listingData.streetNumber,
            streetName: listingData.streetName,
            city: listingData.city,
            stateOrProvince: listingData.stateOrProvince,
            postalCode: listingData.postalCode,
            propertyType: listingData.propertyType,
            propertySubType: listingData.propertySubType,
            listingKey: listingData.listingKey,
            mlsSource: listingData.mlsSource,
            mlsId: listingData.mlsId,
            closePrice: listingData.closePrice
          }
          
          const result = await updateListing(updateData)
          if (result.error) {
            throw new Error(result.error.message)
          }
          setListings(prevListings => ({
            ...prevListings,
            activeListings: prevListings.activeListings.map((l: ListingWithRealtor) => 
              l.ulid === listingUlid ? { ...l, ...updateData } as ListingWithRealtor : l
            )
          }))
          toast.success('Listing updated successfully')
          break
        }
      }
    } catch (error) {
      console.error('[SUBMIT_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleListingUpdate = async (listingUlid: string, data: CreateListing) => {
    try {
      // First create the update data without listingUlid
      const updateData: UpdateListing = {
        listingUlid,
        status: data.status?.toUpperCase() as ListingStatus,
        closeDate: data.closeDate ? new Date(data.closeDate).toISOString() : null,
        listPrice: data.listPrice,
        streetNumber: data.streetNumber,
        streetName: data.streetName,
        city: data.city,
        stateOrProvince: data.stateOrProvince,
        postalCode: data.postalCode,
        propertyType: data.propertyType,
        propertySubType: data.propertySubType,
        listingKey: data.listingKey,
        mlsSource: data.mlsSource,
        mlsId: data.mlsId,
        closePrice: data.closePrice
      }
      
      // Then update listing
      const result = await updateListing(updateData)
      if (result.error) {
        throw new Error(result.error.message)
      }
      toast.success('Listing updated successfully')
      await loadProfile() // Reload listings
    } catch (error) {
      console.error('[UPDATE_LISTING_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update listing')
    }
  }

  const handleGoalSubmit = async (data: GoalFormValues) => {
    try {
      const result = await createGoal(data)
      if (result.error) {
        throw new Error(result.error.message)
      }
      toast.success('Goal created successfully')
    } catch (error) {
      console.error('[CREATE_GOAL_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create goal')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="coaching">Coaching</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent>
                <GeneralForm
                  initialData={generalInfo || undefined}
                  onSubmit={(data) => handleSubmit(data, "general")}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coaching">
            <Card>
              <CardHeader>
                <CardTitle>Coaching Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <CoachProfileForm
                  initialData={{
                    coachProfile: coachingInfo || undefined,
                    realtorProfile: marketing || undefined
                  }}
                  onSubmit={(data) => handleSubmit(data, "coach")}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <ListingsForm
              onSubmit={async (data) => {
                try {
                  const result = await createListing(data)
                  if (result.error) {
                    throw new Error(result.error.message)
                  }
                  toast.success('Listing created successfully')
                  await loadProfile() // Reload listings
                } catch (error) {
                  console.error('[CREATE_LISTING_ERROR]', error)
                  toast.error(error instanceof Error ? error.message : 'Failed to create listing')
                }
              }}
              onUpdate={handleListingUpdate}
              className="w-full"
              activeListings={listings.activeListings}
              successfulTransactions={listings.successfulTransactions}
              isSubmitting={isSubmitting}
            />
          </TabsContent>

          <TabsContent value="marketing">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <MarketingInformation
                  initialData={marketing || undefined}
                  onSubmit={(data) => handleSubmit(data, "marketing")}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <GoalsForm
                  open={true}
                  onClose={() => {}}
                  onSubmit={handleGoalSubmit}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

