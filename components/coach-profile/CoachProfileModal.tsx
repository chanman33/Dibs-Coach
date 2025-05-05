"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  DollarSign,
  MessageSquare,
  BriefcaseBusiness,
  Award,
  Sparkles,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookingModal } from '@/components/coaching/shared/BookingModal';
import { RealEstateDomain } from '@/utils/types/coach';

interface CoachProfileModalProps {
  open: boolean;
  onClose: () => void;
  coach: {
    ulid: string;
    userUlid: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    bio?: string | null;
    profileImageUrl?: string | null;
    slogan?: string | null;
    coachSkills?: string[];
    yearsCoaching?: number;
    totalSessions?: number;
    averageRating?: number | null;
    hourlyRate?: number | null;
    coachRealEstateDomains?: RealEstateDomain[];
    coachPrimaryDomain?: RealEstateDomain | null;
    sessionConfig?: {
      defaultDuration: number;
      minimumDuration: number;
      maximumDuration: number;
      allowCustomDuration: boolean;
    };
    profileSlug?: string | null;
  };
}

// Helper function to format domain names for display
function formatDomain(domain: RealEstateDomain): string {
  return domain
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function CoachProfileModal({ open, onClose, coach }: CoachProfileModalProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // For SEO and user experience, we provide a way to view the full profile
  const profileUrl = coach.profileSlug 
    ? `/profile/${coach.profileSlug}` 
    : `/profile/${coach.ulid}`;

  // Clean up when the modal is closed
  useEffect(() => {
    if (!open) {
      setIsBookingModalOpen(false);
    }
  }, [open]);

  const fullName = `${coach.firstName} ${coach.lastName}`.trim();
  const displayName = coach.displayName || fullName;
  const skills = coach.coachSkills || [];
  const domains = coach.coachRealEstateDomains || [];

  // Function to truncate bio
  const truncateBio = (text: string | null | undefined, limit: number) => {
    if (!text) return '';
    if (text.length <= limit) return text;
    return text.slice(0, limit) + '...';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">Coach Profile</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image and Basic Info */}
              <div className="md:w-1/3 flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10">
                  {coach.profileImageUrl ? (
                    <Image 
                      src={coach.profileImageUrl} 
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                      {fullName.charAt(0)}
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-bold mt-4">{displayName}</h2>
                
                {coach.slogan && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {coach.slogan}
                  </p>
                )}
                
                {coach.coachPrimaryDomain && (
                  <Badge variant="outline" className="mt-2">
                    {formatDomain(coach.coachPrimaryDomain)}
                  </Badge>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-4">
                  {coach.averageRating && (
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-sm font-medium">{coach.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                  
                  {coach.totalSessions !== undefined && coach.totalSessions > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {coach.totalSessions} {coach.totalSessions === 1 ? 'session' : 'sessions'}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 w-full">
                  <Button 
                    className="w-full"
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    Book a Session
                  </Button>
                </div>
              </div>
              
              {/* Profile Details */}
              <div className="md:w-2/3 space-y-4">
                {/* Bio Section */}
                {coach.bio && (
                  <div>
                    <h3 className="font-medium mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">
                      {truncateBio(coach.bio, 300)}
                    </p>
                  </div>
                )}
                
                <Separator />
                
                {/* Experience & Credentials */}
                <div className="grid grid-cols-2 gap-4">
                  {coach.yearsCoaching !== undefined && (
                    <div className="flex items-start">
                      <BriefcaseBusiness className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Experience</p>
                        <p className="text-sm text-muted-foreground">
                          {coach.yearsCoaching} {coach.yearsCoaching === 1 ? 'year' : 'years'} coaching
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {coach.hourlyRate !== undefined && coach.hourlyRate !== null && coach.hourlyRate > 0 && (
                    <div className="flex items-start">
                      <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Hourly Rate</p>
                        <p className="text-sm text-muted-foreground">
                          ${coach.hourlyRate}/hour
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {coach.sessionConfig && (
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Session Length</p>
                        <p className="text-sm text-muted-foreground">
                          {coach.sessionConfig.defaultDuration} minutes
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Skills & Expertise */}
                {skills.length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Sparkles className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h3 className="font-medium">Expertise</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill, i) => (
                        <Badge variant="secondary" key={i}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Real Estate Domains */}
                {domains.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center mb-2">
                      <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h3 className="font-medium">Real Estate Focus</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {domains.map((domain, i) => (
                        <Badge variant="outline" key={i}>
                          {formatDomain(domain)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer with View Full Profile Link */}
            <div className="mt-6 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href={profileUrl} onClick={onClose}>
                  View Full Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        coachName={fullName}
        sessionConfig={{
          durations: [coach.sessionConfig?.defaultDuration || 60],
          rates: { [coach.sessionConfig?.defaultDuration || 60]: coach.hourlyRate ?? 0 },
          currency: 'USD',
          defaultDuration: coach.sessionConfig?.defaultDuration || 60,
          allowCustomDuration: coach.sessionConfig?.allowCustomDuration || false,
          minimumDuration: coach.sessionConfig?.minimumDuration || 30,
          maximumDuration: coach.sessionConfig?.maximumDuration || 90,
          isActive: true
        }}
        coachId={coach.userUlid}
        profileSlug={coach.profileSlug || undefined}
      />
    </>
  );
}

