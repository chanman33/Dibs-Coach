"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'

export default function Office365CalendarCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('Processing Office 365 Calendar authorization...')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [allParams, setAllParams] = useState<Record<string, string>>({})

  useEffect(() => {
    // Extract all parameters for debugging
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setAllParams(params);
    
    // Log all available parameters for debugging
    console.log('[OFFICE365_CALLBACK] Search params:', params);
    
    const saveOffice365CalendarCredentials = async () => {
      try {
        // Get the state and code from the URL
        const state = searchParams.get('state')
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Check if Office365 returned an error
        if (error) {
          console.error('[OFFICE365_CALLBACK] Office 365 OAuth error:', { 
            error,
            errorDescription,
            timestamp: new Date().toISOString()
          })
          setStatus('error')
          setMessage(`Authentication error: ${errorDescription || error}. Please try again.`)
          setDebugInfo({
            error,
            errorDescription,
            timestamp: new Date().toISOString()
          })
          return // Don't redirect automatically on error
        }
        
        if (!state || !code) {
          console.error('[OFFICE365_CALLBACK] Missing required parameters:', { 
            hasState: !!state, 
            hasCode: !!code,
            allParams: params,
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
          setStatus('error')
          setMessage('Missing required authorization parameters (state and code). This can happen if Cal.com did not properly redirect back to our application.')
          setDebugInfo({
            hasState: !!state,
            hasCode: !!code,
            allParams: params,
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
          return // Don't redirect automatically on missing parameters
        }
        
        console.log('[OFFICE365_CALLBACK] Received parameters, calling save endpoint', {
          hasState: !!state,
          hasCode: !!code,
          stateLength: state?.length,
          timestamp: new Date().toISOString()
        })
        
        // Create a URL with the parameters to pass to our API
        const saveEndpoint = `/api/cal/calendars/save-oauth-cal-creds?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}&type=office365`
        console.log('[OFFICE365_CALLBACK] Calling save endpoint:', saveEndpoint)
        
        const response = await fetch(saveEndpoint)
        
        // Save the response status for debugging
        const responseStatus = response.status
        let responseText = ''
        
        try {
          responseText = await response.text()
        } catch (e) {
          console.error('[OFFICE365_CALLBACK] Could not read response text:', e)
        }
        
        console.log('[OFFICE365_CALLBACK] Save endpoint response:', {
          status: responseStatus,
          text: responseText,
          timestamp: new Date().toISOString()
        })
        
        if (!response.ok) {
          throw new Error(`Failed to save credentials: ${responseText || 'Unknown error'}`)
        }
        
        // Call the success handler
        handleSuccess()
      } catch (error) {
        console.error('[OFFICE365_CALLBACK] Error saving credentials:', error)
        setStatus('error')
        setMessage('Failed to connect Office 365 Calendar. Please try again.')
        setDebugInfo({
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
      }
    }
    
    saveOffice365CalendarCredentials()
  }, [router, searchParams])
  
  // Function to go back to settings
  const handleBackToSettings = () => {
    router.push('/dashboard/settings?tab=integrations')
  }
  
  // Function to handle successful connection
  const handleSuccess = () => {
    // Success! Redirect to settings with the correct tab and success parameter
    setStatus('success')
    setMessage('Office 365 Calendar connected successfully! Redirecting...')
    
    // Redirect after a short delay to allow user to see success message
    setTimeout(() => {
      router.push('/dashboard/settings?tab=integrations&success=true')
    }, 2000)
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md rounded-lg border p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          
          {status === 'success' && (
            <div className="rounded-full bg-green-100 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          )}
          
          <h2 className="text-xl font-semibold">
            {status === 'loading' ? 'Connecting Office 365 Calendar' : 
             status === 'success' ? 'Connection Successful' : 'Connection Failed'}
          </h2>
          
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'error' && (
            <div className="mt-2">
              <Button 
                onClick={handleBackToSettings}
                variant="outline"
                className="mt-2"
              >
                Back to Settings
              </Button>
            </div>
          )}
          
          {(debugInfo || Object.keys(allParams).length > 0) && status === 'error' && (
            <div className="mt-4 p-4 text-xs text-left bg-gray-50 rounded border w-full overflow-auto max-h-60">
              <p className="font-semibold mb-1">Debug Information:</p>
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(debugInfo || allParams, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 