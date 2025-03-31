import Provider from '@/app/provider'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/react"
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { getAuthContext } from '@/utils/auth'
import './globals.css'

// Use proper import for Clerk
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.FRONTEND_URL || "https://dibs.coach"),
  title: {
    default: 'Dibs - Real Estate Coaching Platform',
    template: `%s | Dibs`
  },
  description: 'Connect with expert real estate coaches, accelerate your property success, and achieve your real estate goals with personalized coaching sessions.',
  keywords: [
    'real estate coaching',
    'realtor coaching',
    'real estate mentor',
    'real estate professional development',
     'real estate coaching platform',
    'real estate coaching services',
    'real estate coaching programs',
    'real estate coaching courses',
    'real estate coaching certification',
    'real estate coaching training'    
  ],
  authors: [{ name: 'Dibs' }],
  creator: 'Dibs',
  openGraph: {
    type: 'website',
    title: 'Dibs - Real Estate Coaching Platform',
    description: 'Connect with expert real estate coaches, accelerate your property success, and achieve your real estate goals with personalized coaching sessions.',
    siteName: 'Dibs',
    url: process.env.FRONTEND_URL || "https://dibs.com",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dibs - Real Estate Coaching Platform',
    description: 'Connect with expert real estate coaches, accelerate your property success, and achieve your real estate goals with personalized coaching sessions.',
    creator: '@DibsHQ',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get auth context for initial state (now optional)
  let authContext = null;
  
  try {
    authContext = await getAuthContext();
    
    if (authContext && process.env.NODE_ENV === 'development') {
      console.log('[ROOT_LAYOUT] Initializing auth context:', {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[ROOT_LAYOUT] Error getting auth context:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="https://utfs.io/f/31dba2ff-6c3b-4927-99cd-b928eaa54d5f-5w20ij.png"
          as="image"
        />
        <link
          rel="preload"
          href="https://utfs.io/f/69a12ab1-4d57-4913-90f9-38c6aca6c373-1txg2.png"
          as="image"
        />
      </head>
      <body className={GeistSans.className}>
        <ClerkProvider
          appearance={{
            variables: { colorPrimary: '#4f46e5' }
          }}
        >
          <Provider initialAuthState={authContext}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </Provider>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  )
}