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
import { updateGeneralProfile, fetchUserProfile, fetchCoachProfile, updateCoachProfile } from "@/utils/actions/profile-actions"
import type { CoachProfile } from "@/utils/types/coach"
import type { RealtorProfile } from "@/utils/types/realtor"
import type { CreateListing } from "@/utils/types/listing"
import { createListing } from "@/utils/actions/listings"
import { ListingWithRealtor } from "@/utils/supabase/types"

interface GeneralInfo {
  displayName?: string;
  licenseNumber?: string;
  companyName?: string;
  yearsOfExperience?: string;
  bio?: string;
  primaryMarket?: string;
}

interface ListingsState {
  activeListings: ListingWithRealtor[];
  successfulTransactions: ListingWithRealtor[];
}

export default function CoachProfilePage() {
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({})
  const [coachingInfo, setCoachingInfo] = useState<Partial<CoachProfile & RealtorProfile>>({})
  const [listings, setListings] = useState<ListingsState>({
    activeListings: [],
    successfulTransactions: []
  })
  const [marketing, setMarketing] = useState({})
  const [goals, setGoals] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadProfile() {
      try {
        console.log('[DEBUG] Starting to load profile data...');
        setIsLoading(true)
        const [generalResult, coachResult] = await Promise.all([
          fetchUserProfile(),
          fetchCoachProfile()
        ]);

        console.log('[DEBUG] General profile result:', JSON.stringify(generalResult, null, 2));
        console.log('[DEBUG] Coach profile result:', JSON.stringify(coachResult, null, 2));

        if (generalResult.success && generalResult.data) {
          console.log('[DEBUG] Setting general info:', JSON.stringify(generalResult.data, null, 2));
          setGeneralInfo(generalResult.data);
        }

        if (coachResult.success && coachResult.data) {
          console.log('[DEBUG] Setting coach profile data:', JSON.stringify(coachResult.data, null, 2));
          setCoachingInfo(prev => {
            console.log('[DEBUG] Previous coaching info:', JSON.stringify(prev, null, 2));
            const newData = {
              ...coachResult.data,
              // Ensure these fields are always arrays
              languages: Array.isArray(coachResult.data.languages) ? coachResult.data.languages : [],
              certifications: Array.isArray(coachResult.data.certifications) ? coachResult.data.certifications : [],
            };
            console.log('[DEBUG] New coaching info:', JSON.stringify(newData, null, 2));
            return newData;
          });
        }

        if (!generalResult.success || !coachResult.success) {
          console.error('[DEBUG] Failed to load profile data:', { generalResult, coachResult });
          toast({
            title: "Error",
            description: "Failed to load profile data. Please refresh the page.",
            variant: "destructive",
          });
        }

        // Load listings data
        try {
          const response = await fetch('/api/listings');
          if (response.ok) {
            const listingsData = await response.json();
            console.log('[DEBUG] Loaded listings data:', listingsData);
            
            // Split listings into active and successful transactions
            const activeListings = listingsData.filter((l: any) => l.status === 'Active');
            const successfulTransactions = listingsData.filter((l: any) => l.status === 'Closed');
            
            setListings({
              activeListings,
              successfulTransactions
            });
          }
        } catch (error) {
          console.error('[LISTINGS_LOAD_ERROR]', error);
        }

      } catch (error) {
        console.error('[PROFILE_LOAD_ERROR]', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log('[DEBUG] Profile loading complete. States:', {
          generalInfo: JSON.stringify(generalInfo, null, 2),
          coachingInfo: JSON.stringify(coachingInfo, null, 2),
          isLoading
        });
      }
    }

    loadProfile();
  }, [toast]);

  const handleProfileSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      console.log('[DEBUG] Submitting coach profile data:', JSON.stringify(data, null, 2));
      await updateCoachProfile(data);

      // Update local state with the new data
      console.log('[DEBUG] Updating coaching info state with:', JSON.stringify(data, null, 2));
      setCoachingInfo(data);

      toast({
        title: "Success",
        description: "Your coaching profile has been updated",
      });
    } catch (error) {
      console.error('[PROFILE_UPDATE_ERROR]', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (formData: any, formType: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      switch (formType) {
        case "general":
          const generalResult = await updateGeneralProfile(formData);
          if (!generalResult.success) {
            throw new Error('Failed to update general profile');
          }
          setGeneralInfo(formData);
          toast({
            title: "Success",
            description: "Your general profile has been updated",
          });
          break;

        case "coaching":
          console.log('[DEBUG] Submitting coach profile data:', formData);
          await handleProfileSubmit(formData);
          setCoachingInfo(formData);
          toast({
            title: "Success",
            description: "Your coaching profile has been updated",
          });
          break;

        case "listings":
          console.log('[DEBUG] Handling new listing submission:', formData);
          const listingResult = await createListing(formData);
          if (listingResult.error) {
            throw new Error(listingResult.error);
          }
          // Update the listings state with the new listing
          if (listingResult.data) {
            setListings(prev => ({
              ...prev,
              activeListings: [...prev.activeListings, listingResult.data as ListingWithRealtor]
            }));
          }
          toast({
            title: "Success",
            description: "Listing created successfully",
          });
          return listingResult;

        case "marketing":
          setMarketing(formData)
          break
        case "goals":
          setGoals(formData)
          break
      }
    } catch (error) {
      console.error('[PROFILE_UPDATE_ERROR]', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log('[DEBUG] Rendering profile page with states:', {
    generalInfo: JSON.stringify(generalInfo, null, 2),
    coachingInfo: JSON.stringify(coachingInfo, null, 2),
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
                  onSubmit={handleProfileSubmit}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <ListingsForm
              onSubmit={(data) => handleSubmit(data, "listings")}
              activeListings={listings.activeListings}
              successfulTransactions={listings.successfulTransactions}
              className="w-full"
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
                  onSubmit={(data) => handleSubmit(data, "marketing")}
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
                  onSubmit={(data) => handleSubmit(data, "goals")}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

