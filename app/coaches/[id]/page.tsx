'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function CoachProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new URL structure
    router.replace(`/profile/${id}`);
  }, [id, router]);
  
  // Return a loading state while redirecting
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <p>Redirecting...</p>
    </div>
  );
} 