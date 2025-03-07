'use client'

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
  const [retryCount, setRetryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
      return
    }

    if (!userId || isLoading) return

    // Function to create user and check status
    async function setupUser() {
      try {
        setIsLoading(true)
        setStatus('Setting up your account...')
        
        // Call the API to create the user
        const res = await fetch('/api/auth/setup-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || 'Failed to set up user')
        }
        
        const data = await res.json()
        
        if (data.success) {
          setStatus('Account setup complete! Redirecting...')
          // Add cache-busting parameter
          router.push(`/dashboard?t=${Date.now()}`)
        } else {
          // If not successful but not an error, retry
          setRetryCount(prev => prev + 1)
          setIsLoading(false)
          if (retryCount < 5) {
            setStatus('Still setting up your account...')
            setTimeout(setupUser, 1000)
          } else {
            setError('Account setup is taking longer than expected. Please try refreshing the page.')
          }
        }
      } catch (err) {
        console.error('Onboarding error:', err)
        setError(err instanceof Error ? err.message : 'Failed to set up your account')
        setIsLoading(false)
      }
    }

    // Start the setup process
    setupUser()
  }, [isLoaded, isSignedIn, userId, router, retryCount, isLoading])

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
                setRetryCount(0)
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