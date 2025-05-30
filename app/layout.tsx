import Provider from '@/app/provider'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/react"
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { cn } from "@/lib/utils"
import { ClerkProvider } from '@clerk/nextjs'
import config from "@/config"
import "@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css"

export const viewport: Viewport = {
  themeColor: '#005FB8',
  width: 'device-width',
  initialScale: 1,
}

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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png' }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Removed the attempt to get auth context here
  // Auth context will be handled by specific layouts/pages and client providers

  return (
    <ClerkProvider appearance={{
      variables: { 
        colorPrimary: config.auth.clerkPrimaryColor 
      }
    }}>
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
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.png" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-icon.png" />
        </head>
        <body className={cn("min-h-screen bg-background font-sans antialiased", GeistSans.variable)}>
          <Provider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
              {children}
              <Toaster position="top-center" richColors />
              <Analytics />
            </ThemeProvider>
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  )
}