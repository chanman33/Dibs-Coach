import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import CoachApplicationForm from '@/app/apply-coach/_components/CoachApplicationForm';
import { getCoachApplication } from '@/utils/actions/coach-application';
import { COACH_APPLICATION_STATUS } from '@/utils/types';
import { createAuthClient } from '@/utils/auth';

export default async function ApplyCoachPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Get existing application if any
  const applications = await getCoachApplication();
  const existingApplication = applications?.[0];

  // Get user data from Supabase
  const supabase = await createAuthClient();
  const { data: userData } = await supabase
    .from('User')
    .select('firstName, lastName, email, phoneNumber')
    .eq('userId', userId)
    .single();

  // Format application data for the form
  const formattedApplication = existingApplication ? {
    id: existingApplication.id,
    status: existingApplication.status,
    experience: existingApplication.experience,
    specialties: existingApplication.specialties,
    resumeUrl: existingApplication.resumeUrl,
    linkedIn: existingApplication.linkedIn,
    primarySocialMedia: existingApplication.primarySocialMedia,
    additionalInfo: existingApplication.additionalInfo
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