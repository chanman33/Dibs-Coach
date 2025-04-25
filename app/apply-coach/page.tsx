import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import CoachApplicationForm from '@/app/apply-coach/_components/CoachApplicationForm';
import { getCoachApplication } from '@/utils/actions/coach-application';
import { createAuthClient } from '@/utils/auth';
import { type CoachApplicationStatus } from '@/utils/types/coach-application';

export default async function ApplyCoachPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Get existing application if any
  const { data: application, error: applicationError } = await getCoachApplication(userId);
  
  if (applicationError) {
    console.error('[APPLY_COACH_ERROR]', applicationError);
    // Handle error gracefully - you might want to show an error UI component
    return (
      <div className="flex-1 p-6 pt-16">
        <div className="container max-w-2xl mx-auto">
          <div className="bg-destructive/15 text-destructive p-4 rounded-md">
            <p>Unable to load application data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get user data from Supabase
  const supabase = await createAuthClient();
  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('firstName, lastName, email, phoneNumber')
    .eq('userId', userId)
    .single();

  if (userError) {
    console.error('[APPLY_COACH_ERROR]', userError);
    return (
      <div className="flex-1 p-6 pt-16">
        <div className="container max-w-2xl mx-auto">
          <div className="bg-destructive/15 text-destructive p-4 rounded-md">
            <p>Unable to load user data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Format application data for the form if it exists
  const formattedApplication = application ? {
    ulid: application.ulid,
    status: application.status,
    yearsOfExperience: application.yearsOfExperience,
    superPower: application.superPower,
    realEstateDomains: application.realEstateDomains,
    primaryDomain: application.primaryDomain,
    resumeUrl: application.resumeUrl,
    linkedIn: application.linkedIn,
    primarySocialMedia: application.primarySocialMedia,
    aboutYou: application.aboutYou,
    reviewNotes: application.reviewNotes,
    reviewDate: application.reviewDate,
    reviewer: application.reviewer
  } : undefined;


  // Format user data for the form
  const userInfo = userData ? {
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    phoneNumber: userData.phoneNumber || ''
  } : undefined;

  return (
    <div className="flex-1 p-6 pt-16">
      <div className="container max-w-2xl mx-auto">
        <CoachApplicationForm 
          existingApplication={formattedApplication} 
          userData={userInfo}
        />
      </div>
    </div>
  );
} 