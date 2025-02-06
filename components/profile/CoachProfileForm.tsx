'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from '@/components/ui/multi-select';
import { toast } from 'sonner';
import { ConnectCalendly } from '@/components/calendly/ConnectCalendly';

// Coaching specialties options
const COACHING_SPECIALTIES = [
  { label: 'Residential Sales', value: 'residential_sales' },
  { label: 'Commercial Real Estate', value: 'commercial_real_estate' },
  { label: 'Property Management', value: 'property_management' },
  { label: 'Investment Properties', value: 'investment_properties' },
  { label: 'Luxury Real Estate', value: 'luxury_real_estate' },
  { label: 'First-Time Homebuyers', value: 'first_time_homebuyers' },
  { label: 'Marketing & Lead Generation', value: 'marketing_leads' },
  { label: 'Business Development', value: 'business_development' },
  { label: 'Team Building', value: 'team_building' },
  { label: 'Technology & Tools', value: 'technology_tools' },
];

interface CoachProfileFormProps {
  initialData?: {
    coachingSpecialties: string[];
    yearsCoaching: number;
    hourlyRate: number;
    defaultDuration: number;
    minimumDuration: number;
    maximumDuration: number;
    allowCustomDuration: boolean;
    calendlyUrl?: string;
    eventTypeUrl?: string;
  };
  onSubmit: (data: any) => Promise<void>;
}

export function CoachProfileForm({ initialData, onSubmit }: CoachProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    coachingSpecialties: [],
    yearsCoaching: 0,
    hourlyRate: 0,
    defaultDuration: 60,
    minimumDuration: 30,
    maximumDuration: 120,
    allowCustomDuration: false,
    calendlyUrl: "",
    eventTypeUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      toast.success("Coach profile updated successfully");
    } catch (error) {
      toast.error("Failed to update coach profile");
      console.error("Error updating coach profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Professional Information */}
      <div className="space-y-4">
        <p>Manage your coaching specialties, rates, and session preferences</p>

        <h3 className="text-lg font-semibold">Professional Information</h3>

        <div className="space-y-2">
          <Label htmlFor="coachingSpecialties">Coaching Specialties</Label>
          <MultiSelect
            id="coachingSpecialties"
            options={COACHING_SPECIALTIES}
            value={formData.coachingSpecialties}
            onChange={(value: string[]) => setFormData({ ...formData, coachingSpecialties: value })}
            placeholder="Select your specialties"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="yearsCoaching">Years of Coaching Experience</Label>
            <Input
              id="yearsCoaching"
              type="number"
              min="0"
              value={formData.yearsCoaching}
              onChange={(e) => setFormData({ ...formData, yearsCoaching: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Session Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Session Configuration</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultDuration">Default Duration (min)</Label>
            <Input
              id="defaultDuration"
              type="number"
              min="15"
              step="15"
              value={formData.defaultDuration}
              onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumDuration">Minimum Duration (min)</Label>
            <Input
              id="minimumDuration"
              type="number"
              min="15"
              step="15"
              value={formData.minimumDuration}
              onChange={(e) => setFormData({ ...formData, minimumDuration: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maximumDuration">Maximum Duration (min)</Label>
            <Input
              id="maximumDuration"
              type="number"
              min="15"
              step="15"
              value={formData.maximumDuration}
              onChange={(e) => setFormData({ ...formData, maximumDuration: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="allowCustomDuration"
            checked={formData.allowCustomDuration}
            onCheckedChange={(checked) => setFormData({ ...formData, allowCustomDuration: checked })}
          />
          <Label htmlFor="allowCustomDuration">Allow Custom Session Duration</Label>
        </div>
      </div>

      {/* Calendly Integration */}
      <div className="space-y-4">
        <ConnectCalendly />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>

    </form >
  );
} 