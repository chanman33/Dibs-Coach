'use client'

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

// Onboarding animation component
function OnboardingAnimation() {
  return (
    <div className="relative w-64 h-64 mx-auto">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const { isLoaded, userId, isSignedIn } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState('Initializing your account...')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
      return
    }
    if (!isLoaded || !isSignedIn || !userId || shouldRedirect || isLoading) {
        return;
    }

    let cancelled = false
    async function pollForUserContext() {
      setIsLoading(true)
      setStatus('Setting up your account...')
      let attempts = 0
      const maxAttempts = 15
      while (attempts < maxAttempts && !cancelled) {
        try {
          const res = await fetch('/api/user/context', { cache: 'no-store' })
          if (res.ok) {
            setStatus('Account setup complete! Redirecting...')
            if (!cancelled) setShouldRedirect(true)
            return
          }
          if (res.status >= 400 && res.status !== 404) {
            console.warn(`[ONBOARDING] API error ${res.status} while polling for user context.`);
          }
        } catch (err) {
          console.warn('[ONBOARDING] Fetch error while polling user context:', err);
        }
        attempts++
        setStatus(`Still setting up your account (attempt ${attempts}/${maxAttempts})...`)
        if (!cancelled) {
            await new Promise(r => setTimeout(r, 1000));
        }
      }
      if (!cancelled) {
        setError('Account setup is taking longer than expected. Please try refreshing the page.')
        setIsLoading(false)
      }
    }
    pollForUserContext()
    return () => { 
        cancelled = true 
    }
  }, [isLoaded, isSignedIn, userId, router, retryCount])

  useEffect(() => {
    if (shouldRedirect) {
      // Temporarily bypass timer for testing, or set to 0
      // const redirectTimer = setTimeout(() => { 
      console.log('[ONBOARDING] Attempting IMMEDIATE redirect to dashboard...');
      router.replace('/dashboard');
      // }, 0); 

      // Cleanup the timer if the component unmounts before redirect (if using setTimeout)
      // return () => clearTimeout(redirectTimer);
    }
  }, [shouldRedirect, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 text-center">
        <OnboardingAnimation />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Welcome to Dibs!</h1>
          <p className="text-muted-foreground">{status}</p>
        </div>

        {error ? (
          <div className="space-y-4">
            <p className="text-destructive">{error}</p>
            <Button 
              onClick={() => {
                setError(null)
                setIsLoading(false)
                setRetryCount(retryCount + 1)
              }}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>This usually takes a few seconds.</p>
            <p>You'll be redirected automatically once everything is ready.</p>
          </div>
        )}
      </div>
    </div>
  )
}
