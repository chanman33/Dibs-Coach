import Provider from '@/app/provider'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import AuthWrapper from '@/components/wrapper/auth-wrapper'
import { Analytics } from "@vercel/analytics/react"
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import '@/app/globals.css'
import { CoachesFooter } from '../../components/coaching/public/CoachesFooter'
import NavBar from '@/components/wrapper/navbar'

export const metadata: Metadata = {
  metadataBase: new URL("https://dibs.coach"),
  title: {
    default: 'Find Your Real Estate Coach | Dibs',
    template: `%s | Dibs`
  },
  description: 'Find expert real estate coaches to help you achieve your property goals. Browse, compare, and book sessions with top professionals.',
  openGraph: {
    title: 'Find Your Real Estate Coach | Dibs',
    description: 'Find expert real estate coaches to help you achieve your property goals. Browse, compare, and book sessions with top professionals.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Your Real Estate Coach | Dibs',
    description: 'Find expert real estate coaches to help you achieve your property goals. Browse, compare, and book sessions with top professionals.',
  },
}

export default function CoachesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <CoachesFooter />
    </div>
  )
}