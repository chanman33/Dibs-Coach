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
import { COACH_APPLICATION_STATUS, REAL_ESTATE_DOMAINS, type RealEstateDomain } from '@/utils/types/coach';
import { type CoachApplicationFormData, coachApplicationFormSchema } from '@/utils/types/coach-application';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/ui/file-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';

interface CoachApplicationFormProps {
  existingApplication?: {
    ulid: string;
    status: typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS];
    yearsOfExperience: number;
    superPower: string;
    realEstateDomains: RealEstateDomain[];
    primaryDomain: RealEstateDomain;
    resumeUrl: string | null;
    linkedIn: string | null;
    primarySocialMedia: string | null;
    aboutYou: string | null;
    reviewNotes?: string | null;
    reviewDate?: string | null;
    reviewer?: {
      ulid: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  userData?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
  };
}

export default function CoachApplicationForm({ existingApplication, userData }: CoachApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<RealEstateDomain[]>(
    existingApplication?.realEstateDomains || []
  );
  const [primaryDomain, setPrimaryDomain] = useState<RealEstateDomain | null>(
    existingApplication?.primaryDomain || null
  );
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, trigger } = useForm<CoachApplicationFormData>({
    resolver: zodResolver(coachApplicationFormSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phoneNumber: userData?.phoneNumber || '',
      resume: null,
      linkedIn: existingApplication?.linkedIn || '',
      primarySocialMedia: existingApplication?.primarySocialMedia || '',
      yearsOfExperience: existingApplication?.yearsOfExperience || 0,
      superPower: existingApplication?.superPower || '',
      aboutYou: existingApplication?.aboutYou || '',
      realEstateDomains: existingApplication?.realEstateDomains || [],
      primaryDomain: existingApplication?.primaryDomain
    }
  });

  const handleFormSubmit = async (data: CoachApplicationFormData, isDraft: boolean = false) => {
    try {
      const isValid = await trigger();
      if (!isValid) {
        toast.error('Please fill in all required fields correctly');
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('yearsOfExperience', String(data.yearsOfExperience));
      formData.append('superPower', data.superPower);
      formData.append('aboutYou', data.aboutYou);
      formData.append('realEstateDomains', JSON.stringify(data.realEstateDomains));
      formData.append('primaryDomain', data.primaryDomain);

      if (data.resume) {
        formData.append('resume', data.resume);
      }

      if (data.linkedIn) {
        formData.append('linkedIn', data.linkedIn);
      }

      if (data.primarySocialMedia) {
        formData.append('primarySocialMedia', data.primarySocialMedia);
      }

      formData.append('status', isDraft ? 'draft' : 'pending');
      if (existingApplication?.ulid) {
        formData.append('applicationId', existingApplication.ulid);
      }

      const response = await submitCoachApplication(formData);

      if (response.error) {
        toast.error(response.error.message || 'Failed to submit application');
        return;
      }

      setSubmitted(true);
      toast.success('Application submitted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
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
              onClick={() => router.push('/dashboard')}
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
              onClick={() => router.push('/dashboard')}
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
        <form onSubmit={handleSubmit((data) => handleFormSubmit(data, false))} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                readOnly
                className="bg-gray-50"
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                readOnly
                className="bg-gray-50"
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
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
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center">
              Phone Number <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber')}
              className={errors.phoneNumber ? 'border-red-500' : ''}
              aria-invalid={errors.phoneNumber ? 'true' : 'false'}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume" className="flex items-center">
              Resume <span className="text-red-500 ml-1">*</span>
            </Label>
            <FileUpload
              id="resume"
              accept=".pdf"
              maxSize={10}
              onFileSelect={(file) => setValue('resume', file)}
              error={errors.resume?.message}
            />
            <p className="text-xs text-gray-500">Upload your resume (PDF format, max 10MB)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedIn">LinkedIn Profile</Label>
            <Input
              id="linkedIn"
              {...register('linkedIn')}
              className={errors.linkedIn ? 'border-red-500' : ''}
            />
            {errors.linkedIn && (
              <p className="text-sm text-red-500">{errors.linkedIn.message}</p>
            )}
            <p className="text-xs text-gray-500">Optional: Add your LinkedIn profile URL</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience" className="flex items-center">
              Years of Professional Experience <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="yearsOfExperience"
              type="number"
              {...register('yearsOfExperience')}
              className={errors.yearsOfExperience ? 'border-red-500' : ''}
              aria-invalid={errors.yearsOfExperience ? 'true' : 'false'}
            />
            {errors.yearsOfExperience && (
              <p className="text-sm text-red-500">{errors.yearsOfExperience.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="superPower" className="flex items-center">
              What's Your Super Power? <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="superPower"
              {...register('superPower')}
              className={errors.superPower ? 'border-red-500' : ''}
              aria-invalid={errors.superPower ? 'true' : 'false'}
            />
            {errors.superPower && (
              <p className="text-sm text-red-500">{errors.superPower.message}</p>
            )}
            <p className="text-xs text-gray-500">Tell us what makes you unique as a coach</p>
          </div>

          <div className="space-y-4">
            <Label className="flex items-center">
              Real Estate Domains <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-sm text-gray-500">Select your areas of expertise in real estate (at least one required)</p>
            <div className="grid grid-cols-2 gap-4">
              {Object.values(REAL_ESTATE_DOMAINS).map((domain) => (
                <div key={domain} className="flex items-center space-x-2">
                  <Checkbox
                    id={domain}
                    checked={selectedDomains.includes(domain)}
                    onCheckedChange={(checked) => {
                      const newDomains = checked
                        ? [...selectedDomains, domain]
                        : selectedDomains.filter((d) => d !== domain);
                      setSelectedDomains(newDomains);
                      setValue('realEstateDomains', newDomains);
                      trigger('realEstateDomains');
                      
                      if (!checked && primaryDomain === domain) {
                        setPrimaryDomain(null);
                        setValue('primaryDomain', undefined as any);
                        trigger('primaryDomain');
                      }
                      if (checked && newDomains.length === 1) {
                        setPrimaryDomain(domain);
                        setValue('primaryDomain', domain);
                        trigger('primaryDomain');
                      }
                    }}
                  />
                  <Label htmlFor={domain}>
                    {domain.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                  </Label>
                </div>
              ))}
            </div>
            {errors.realEstateDomains && (
              <p className="text-sm text-red-500">{errors.realEstateDomains.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <Label className="flex items-center">
              Primary Domain <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-sm text-gray-500">Select your primary area of expertise</p>
            <div className="grid grid-cols-2 gap-4">
              {selectedDomains.map((domain) => (
                <div key={domain} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`primary-${domain}`}
                    name="primaryDomain"
                    checked={primaryDomain === domain}
                    onChange={() => {
                      setPrimaryDomain(domain);
                      setValue('primaryDomain', domain);
                      trigger('primaryDomain');
                    }}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor={`primary-${domain}`}>
                    {domain.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                  </Label>
                </div>
              ))}
            </div>
            {errors.primaryDomain && (
              <p className="text-sm text-red-500">{errors.primaryDomain.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutYou" className="flex items-center">
              Anything else we should know about you? <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="aboutYou"
              {...register('aboutYou')}
              className={errors.aboutYou ? 'border-red-500' : ''}
              aria-invalid={errors.aboutYou ? 'true' : 'false'}
            />
            {errors.aboutYou && (
              <p className="text-sm text-red-500">{errors.aboutYou.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit((data) => handleFormSubmit(data, true))}
              disabled={loading || submitted || isSubmitting}
            >
              Save as Draft
            </Button>
            <Button 
              type="submit" 
              disabled={loading || submitted || isSubmitting}
              className="relative"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 