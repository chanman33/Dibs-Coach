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
import { COACH_APPLICATION_STATUS } from '@/utils/types';
import { useRouter } from 'next/navigation';

interface CoachApplicationFormData {
  experience: string;
  specialties: string;
}

interface CoachApplicationFormProps {
  existingApplication?: {
    status: typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS];
    experience: string;
    specialties: string[];
  };
}

export default function CoachApplicationForm({ existingApplication }: CoachApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<CoachApplicationFormData>({
    defaultValues: existingApplication ? {
      experience: existingApplication.experience,
      specialties: existingApplication.specialties.join(', ')
    } : undefined
  });

  const onSubmit = async (data: CoachApplicationFormData) => {
    setLoading(true);
    try {
      await submitCoachApplication({
        experience: data.experience,
        specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean)
      });
      toast.success('Application submitted successfully');
      setSubmitted(true);
    } catch (error) {
      console.error('[COACH_APPLICATION_ERROR]', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard/realtor');
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

  if (existingApplication) {
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
            <div>
              <Label>Experience</Label>
              <p className="mt-1">{existingApplication.experience}</p>
            </div>
            <div>
              <Label>Specialties</Label>
              <p className="mt-1">{existingApplication.specialties.join(', ')}</p>
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
        <h2 className="text-2xl font-bold">Apply to Become a Coach</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="experience">Professional Experience</Label>
            <Textarea
              id="experience"
              {...register('experience', { required: 'Experience is required' })}
              placeholder="Describe your real estate experience and achievements..."
              className={errors.experience ? 'border-red-500' : ''}
            />
            {errors.experience && (
              <p className="text-sm text-red-500">{errors.experience.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties</Label>
            <Textarea
              id="specialties"
              {...register('specialties', { required: 'Specialties are required' })}
              placeholder="Enter your specialties, separated by commas (e.g., First-time buyers, Luxury homes, Investment properties)"
              className={errors.specialties ? 'border-red-500' : ''}
            />
            {errors.specialties && (
              <p className="text-sm text-red-500">{errors.specialties.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 