'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { submitCoachApplication } from '@/utils/actions/coach-application';
import { COACH_APPLICATION_STATUS } from '@/utils/types/coach-application';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/ui/file-upload';

interface CoachApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  resume: File | null;
  linkedIn: string;
  primarySocialMedia: string;
  yearsOfExperience: string;
  expertise: string;
  additionalInfo: string;
}

interface CoachApplicationFormProps {
  existingApplication?: {
    id?: number;
    status: typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS];
    experience: string;
    specialties: string[];
    resumeUrl?: string | null;
    linkedIn?: string | null;
    primarySocialMedia?: string | null;
    additionalInfo?: string | null;
  };
  userData?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

export default function CoachApplicationForm({ existingApplication, userData }: CoachApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CoachApplicationFormData>({
    defaultValues: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phoneNumber: userData?.phoneNumber || '',
      resume: null,
      linkedIn: existingApplication?.linkedIn || '',
      primarySocialMedia: existingApplication?.primarySocialMedia || '',
      yearsOfExperience: existingApplication?.experience || '',
      expertise: existingApplication?.specialties?.join(', ') || '',
      additionalInfo: existingApplication?.additionalInfo || ''
    }
  });

  const onSubmit = async (data: CoachApplicationFormData, isDraft: boolean = false) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value);
        }
      });

      // Add application status and ID if updating
      formData.append('status', isDraft ? 'draft' : 'pending');
      if (existingApplication?.id) {
        formData.append('applicationId', existingApplication.id.toString());
      }

      await submitCoachApplication(formData);
      toast.success(isDraft ? 'Draft saved successfully' : 'Application submitted successfully');
      if (!isDraft) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('[COACH_APPLICATION_ERROR]', error);
      toast.error(isDraft ? 'Failed to save draft' : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Application Submitted Successfully</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <p className="mt-1 text-lg font-medium">Pending Review</p>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Thank you for applying to become a coach. Your application is now under review by our team. 
              We will notify you once a decision has been made.
            </p>
            <Button 
              onClick={handleReturnToDashboard}
              className="w-full mt-4"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (existingApplication && existingApplication.status !== COACH_APPLICATION_STATUS.DRAFT) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Coach Application Status</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <p className="mt-1 text-lg font-medium">
                {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
              </p>
            </div>
            <Button 
              onClick={handleReturnToDashboard}
              className="w-full mt-4"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">
          {existingApplication?.status === COACH_APPLICATION_STATUS.DRAFT 
            ? 'Continue Your Application' 
            : 'Apply to Become a Coach'}
        </h2>
        <div className="mt-4 space-y-4 text-gray-600 dark:text-gray-400">
          <p>Ready to Lead the Next Generation of Real Estate Pros?</p>
          <p>Thank you for your interest in becoming a Dibs Coach! By sharing your industry expertise, you'll shape the future of real estate professionals—while building your personal brand and earning on your own terms.</p>
          <p>Dibs is an all-in-one coaching platform, offering secure payments, scheduling, marketing, and ongoing support—all for a simple 8.5% platform fee. You'll also receive free, early access to our latest tools and products, so you can focus on coaching while we handle the rest.</p>
          <p>Please complete this brief application to tell us about your background, strengths, and coaching style. Once we review your details, we'll be in touch with next steps, so you can start empowering others to reach their full potential.</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...register('email')}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber', { required: 'Phone number is required' })}
              className={errors.phoneNumber ? 'border-red-500' : ''}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Resume *</Label>
            <FileUpload
              id="resume"
              accept=".pdf"
              maxSize={10}
              onFileSelect={(file) => setValue('resume', file)}
              error={errors.resume?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedIn">LinkedIn Profile</Label>
            <Input
              id="linkedIn"
              {...register('linkedIn')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primarySocialMedia">Primary Social Media</Label>
            <Input
              id="primarySocialMedia"
              {...register('primarySocialMedia')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of Professional Experience *</Label>
            <Input
              id="yearsOfExperience"
              {...register('yearsOfExperience', { required: 'Years of experience is required' })}
              className={errors.yearsOfExperience ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">Areas of Expertise (What's Your Super Power?) *</Label>
            <Textarea
              id="expertise"
              {...register('expertise', { required: 'Areas of expertise are required' })}
              className={errors.expertise ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Anything else we should know about you? *</Label>
            <Textarea
              id="additionalInfo"
              {...register('additionalInfo', { required: 'This field is required' })}
              className={errors.additionalInfo ? 'border-red-500' : ''}
            />
          </div>

          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleSubmit((data) => onSubmit(data, true))()}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 