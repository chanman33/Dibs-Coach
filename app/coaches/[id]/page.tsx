'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function CoachProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  
  useEffect(() => {
    // Use a small timeout to ensure the client is ready for redirection
    const redirectTimer = setTimeout(() => {
      // Redirect to the new URL structure
      router.replace(`/profile/${id}`);
    }, 100);
    
    return () => clearTimeout(redirectTimer);
  }, [id, router]);
  
  // Return a loading state while redirecting
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <p>Redirecting...</p>
    </div>
  );
} 