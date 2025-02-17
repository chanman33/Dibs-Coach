"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import GeneralForm from "../../../../components/profile/GeneralForm"
import ListingsForm from "../../../../components/profile/ListingsForm"
import MarketingInformation from "../../../../components/profile/MarketingInfo"
import GoalsForm from "../../../../components/profile/GoalsForm"
import { CoachProfileForm } from "../../../../components/profile/CoachProfileForm"
import { 
  updateGeneralProfile, 
  fetchUserProfile, 
  fetchCoachProfile, 
  updateCoachProfile,
  fetchMarketingInfo,
  type GeneralFormData,
  type CoachProfileFormData 
} from "@/utils/actions/profile-actions"
import { updateMarketingInfo } from "@/utils/actions/marketing-actions"
import type { CoachProfile } from "@/utils/types/coach"
import type { RealtorProfile } from "@/utils/types/realtor"
import type { Goals } from "@/utils/types/goals"
import { 
  type CreateListing, 
  type UpdateListing, 
  type ListingWithRealtor
} from "@/utils/types/listing"
import { ListingStatusEnum } from "@/utils/types/listing"
import { 
  createListing,
  updateListing,
  fetchListings,
  fetchListing
} from "@/utils/actions/listing"
import type { MarketingInfo } from "@/utils/types/marketing"
import { GoalFormValues } from "@/components/profile/GoalsForm"
import type { ApiResponse } from "@/utils/types/api"

interface GeneralInfo {
  displayName?: string;
  licenseNumber?: string;
  companyName?: string;
  yearsOfExperience?: string;
  bio?: string;
  primaryMarket?: string;
}

interface ListingsState {
  activeListings: ListingWithRealtor[]
  successfulTransactions: ListingWithRealtor[]
}

interface ListingsFormProps {
  onSubmit: (data: CreateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null } | void>;
  onUpdate?: (listingUlid: string, data: UpdateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null } | void>;
  className?: string;
  activeListings?: ListingWithRealtor[];
  successfulTransactions?: ListingWithRealtor[];
  isSubmitting?: boolean;
}

type FormData = GeneralFormData | CoachProfileFormData | MarketingInfo | GoalFormValues;

interface GoalsFormProps {
  onSubmit: (data: Goals) => Promise<void>;
}

export default function CoachProfilePage() {
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({})
  const [coachingInfo, setCoachingInfo] = useState<Partial<CoachProfile & RealtorProfile>>({})
  const [listings, setListings] = useState<ListingsState>({
    activeListings: [],
    successfulTransactions: []
  })
  const [marketing, setMarketing] = useState<MarketingInfo | null>(null)
  const [goals, setGoals] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadProfile() {
      try {
        console.log('[DEBUG] Starting to load profile data...');
        setIsLoading(true)
        const [generalResult, coachResult, marketingResult] = await Promise.all([
          fetchUserProfile(),
          fetchCoachProfile(),
          fetchMarketingInfo()
        ]);

        console.log('[DEBUG] General profile result:', JSON.stringify(generalResult, null, 2));
        console.log('[DEBUG] Coach profile result:', JSON.stringify(coachResult, null, 2));
        console.log('[DEBUG] Marketing result:', JSON.stringify(marketingResult, null, 2));

        if (generalResult.data) {
          console.log('[DEBUG] Setting general info:', JSON.stringify(generalResult.data, null, 2));
          setGeneralInfo(generalResult.data);
        }

        if (coachResult.data) {
          console.log('[DEBUG] Setting coach profile:', JSON.stringify(coachResult.data, null, 2));
          setCoachingInfo(coachResult.data);
        }

        if (marketingResult.data) {
          console.log('[DEBUG] Setting marketing info:', JSON.stringify(marketingResult.data, null, 2));
          setMarketing(marketingResult.data);
        }

        const hasError = generalResult.error || coachResult.error || marketingResult.error;
        if (hasError) {
          console.error('[DEBUG] Failed to load profile data:', { generalResult, coachResult, marketingResult });
          toast({
            title: "Error",
            description: "Failed to load profile data. Please try again.",
            variant: "destructive",
          });
        }

        // Load listings data
        try {
          const result = await fetchListings({
            limit: 100,
            offset: 0,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });
          
          if (result.error) {
            throw new Error(result.error.message);
          }

          if (result.data) {
            // Split listings into active and successful transactions
            const activeListings = (result.data.listings as ListingWithRealtor[]).filter(listing => 
              listing.status !== ListingStatusEnum.enum.SOLD && 
              listing.status !== ListingStatusEnum.enum.WITHDRAWN && 
              listing.status !== ListingStatusEnum.enum.EXPIRED
            ).map(listing => ({
              ...listing,
              realtorProfile: {
                ...listing.realtorProfile,
                certifications: [],
                languages: [],
                createdAt: listing.createdAt,
                updatedAt: listing.updatedAt
              }
            }));
            const successfulTransactions = (result.data.listings as ListingWithRealtor[]).filter(listing => 
              listing.status === ListingStatusEnum.enum.SOLD
            ).map(listing => ({
              ...listing,
              realtorProfile: {
                ...listing.realtorProfile,
                certifications: [],
                languages: [],
                createdAt: listing.createdAt,
                updatedAt: listing.updatedAt
              }
            }));
            
            setListings({
              activeListings,
              successfulTransactions
            });
          }
        } catch (error) {
          console.error('[LISTINGS_LOAD_ERROR]', error);
          toast({
            title: "Error",
            description: "Failed to load listings. Please refresh the page.",
            variant: "destructive",
          });
        }

      } catch (error) {
        console.error('[DEBUG] Error loading profile:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log('[DEBUG] Profile loading complete. States:', {
          generalInfo: JSON.stringify(generalInfo, null, 2),
          coachingInfo: JSON.stringify(coachingInfo, null, 2),
          marketing: JSON.stringify(marketing, null, 2),
          isLoading
        });
      }
    }

    loadProfile();
  }, [toast]);

  const handleProfileSubmit = async (data: GeneralFormData) => {
    try {
      setIsSubmitting(true);
      const result = await updateGeneralProfile(data);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update profile');
      }
      if (result.data) {
        setGeneralInfo(data);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error) {
      console.error('[DEBUG] Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (formData: FormData, formType: string): Promise<void> => {
    try {
      setIsSubmitting(true);
      
      switch (formType) {
        case "general": {
          const generalData = formData as GeneralFormData;
          const result = await updateGeneralProfile(generalData);
          if (result.error) {
            throw new Error(result.error.message || 'Failed to update profile');
          }
          if (result.data) {
            setGeneralInfo(generalData);
            toast({
              title: "Success",
              description: "Profile updated successfully",
            });
          }
          break;
        }
        
        case "coach": {
          const coachData = formData as CoachProfileFormData;
          await updateCoachProfile(coachData);
          setCoachingInfo(coachData);
          toast({
            title: "Success",
            description: "Coach profile updated successfully",
          });
          break;
        }
        
        case "marketing": {
          const marketingData = formData as MarketingInfo;
          const result = await updateMarketingInfo(marketingData);
          if (result.error) {
            throw new Error(result.error.message || 'Failed to update marketing info');
          }
          if (result.data) {
            setMarketing(marketingData);
            toast({
              title: "Success",
              description: "Marketing information updated successfully",
            });
          }
          break;
        }
        
        case "goals": {
          const goalsData = formData as GoalFormValues;
          await handleSubmit(goalsData, "goals");
          toast({
            title: "Success",
            description: "Goals updated successfully",
          });
          break;
        }
      }
    } catch (error) {
      console.error('[DEBUG] Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (ulid: string, data: UpdateListing): Promise<{ data?: ListingWithRealtor | null; error?: string | null } | void> => {
    try {
      const result = await updateListing({
        listingUlid: ulid,
        ...data
      })
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.toString(),
          variant: "destructive",
        })
        return { error: result.error.toString() }
      }

      toast({
        title: "Success",
        description: "Listing updated successfully",
      })

      return { data: result.data as ListingWithRealtor }
    } catch (error) {
      console.error("[HANDLE_UPDATE_ERROR]", error)
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive",
      })
      return { error: "Failed to update listing" }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log('[DEBUG] Rendering profile page with states:', {
    generalInfo: JSON.stringify(generalInfo, null, 2),
    coachingInfo: JSON.stringify(coachingInfo, null, 2),
    marketing: JSON.stringify(marketing, null, 2),
    isLoading
  });

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-4" onValueChange={(value) => {
          console.log('[DEBUG] Tab changed to:', value);
          console.log('[DEBUG] Current coaching info:', JSON.stringify(coachingInfo, null, 2));
        }}>
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
                  initialData={generalInfo}
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
                    coachProfile: {
                      specialties: coachingInfo?.specialties || [],
                      yearsCoaching: coachingInfo?.yearsCoaching || 0,
                      hourlyRate: coachingInfo?.hourlyRate || 0,
                      defaultDuration: coachingInfo?.defaultDuration || 60,
                      minimumDuration: coachingInfo?.minimumDuration || 30,
                      maximumDuration: coachingInfo?.maximumDuration || 120,
                      allowCustomDuration: coachingInfo?.allowCustomDuration || false,
                      calendlyUrl: coachingInfo?.calendlyUrl || "",
                      eventTypeUrl: coachingInfo?.eventTypeUrl || "",
                    },
                    realtorProfile: {
                      languages: coachingInfo?.languages || [],
                      bio: coachingInfo?.bio || "",
                      certifications: coachingInfo?.certifications || [],
                      professionalRecognitions: coachingInfo?.professionalRecognitions || []
                    }
                  }}
                  onSubmit={(data) => handleSubmit(data, "coach")}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <ListingsForm
              onSubmit={async (data: CreateListing) => {
                try {
                  const result = await createListing(data);
                  if (result.error) {
                    toast({
                      title: "Error",
                      description: result.error.message,
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Success",
                      description: "Listing created successfully",
                    });
                  }
                } catch (error) {
                  console.error('[LISTING_CREATE_ERROR]', error);
                  toast({
                    title: "Error",
                    description: "Failed to create listing",
                    variant: "destructive",
                  });
                }
              }}
              onUpdate={handleUpdate}
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
                <MarketingInformation initialData={marketing || undefined} />
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
                  onSubmit={async (data: GoalFormValues) => {
                    await handleSubmit(data, "goals");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

