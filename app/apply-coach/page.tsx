import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import CoachApplicationForm from '@/components/coach/CoachApplicationForm';
import { getCoachApplication } from '@/utils/actions/coach-application';
import { COACH_APPLICATION_STATUS } from '@/utils/types';

export default async function ApplyCoachPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in?redirectUrl=/apply-coach');
  }

  // Check if user already has an application
  const applications = await getCoachApplication();
  const existingApplication = applications?.[0];

  // If there's an existing application, transform it to match the expected type
  const formattedApplication = existingApplication ? {
    status: existingApplication.status as typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS],
    experience: existingApplication.experience,
    specialties: existingApplication.specialties,
  } : undefined;

  return (
    <div className="flex-1 p-6 pt-16">
      <div className="container max-w-2xl mx-auto">
        <CoachApplicationForm existingApplication={formattedApplication} />
      </div>
    </div>
  );
} 