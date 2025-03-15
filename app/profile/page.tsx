'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the coaches browse page
    router.replace('/coaches');
  }, [router]);
  
  // Return a loading state while redirecting
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <p>Redirecting to coaches...</p>
    </div>
  );
} 