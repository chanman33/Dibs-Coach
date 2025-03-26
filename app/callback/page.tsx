'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function CalOAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing your Cal.com authorization...')
  const [errorDetails, setErrorDetails] = useState('')

  useEffect(() => {
    // Check for error parameters first
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (error) {
      console.error('[CAL_OAUTH_ERROR]', { error, errorDescription })
      setStatus('error')
      setMessage(`Cal.com authorization failed: ${error}`)
      setErrorDetails(errorDescription || '')
      return
    }
    
    const code = searchParams.get('code')
    
    if (!code) {
      setStatus('error')
      setMessage('No authorization code received from Cal.com')
      return
    }
    
    // Log the query parameters for debugging
    console.log('[CAL_OAUTH_CALLBACK]', { 
      code: code.substring(0, 5) + '...',
      params: Object.fromEntries(searchParams.entries()) 
    })
    
    async function exchangeCodeForToken() {
      try {
        const response = await fetch('/api/cal/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/callback`,
          }),
        })
        
        // Get the response text first for better error reporting
        const responseText = await response.text()
        let data
        
        try {
          // Try to parse as JSON
          data = JSON.parse(responseText)
        } catch (e) {
          console.error('[CAL_TOKEN_PARSE_ERROR]', { responseText })
          throw new Error('Invalid response format from token endpoint')
        }
        
        if (!response.ok) {
          console.error('[CAL_TOKEN_ERROR]', data)
          throw new Error(data.error || `Failed to exchange token: ${response.statusText}`)
        }
        
        // Store tokens in localStorage
        if (data.access_token && data.refresh_token) {
          localStorage.setItem('cal_tokens', JSON.stringify({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Date.now() + (data.expires_in * 1000),
          }))
          
          setStatus('success')
          setMessage('Successfully connected to Cal.com!')
        } else {
          throw new Error('Invalid token response from server')
        }
      } catch (error) {
        console.error('[CAL_TOKEN_EXCHANGE_ERROR]', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to connect to Cal.com')
      }
    }
    
    exchangeCodeForToken()
  }, [searchParams, router])

  const navigateToTest = () => {
    router.push('/test/cal-availability-test')
  }
  
  return (
    <div className="container mx-auto max-w-md py-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Cal.com Integration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <Alert className="bg-green-50">
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Button onClick={navigateToTest}>
                Return to Testing Page
              </Button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <Alert variant="destructive">
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>
                  {message}
                  {errorDetails && (
                    <div className="mt-2 text-sm bg-red-100/50 p-2 rounded">
                      {errorDetails}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              <Button onClick={navigateToTest} variant="outline">
                Return to Testing Page
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 