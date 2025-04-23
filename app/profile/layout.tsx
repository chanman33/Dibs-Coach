import Provider from '@/app/provider'
import { ThemeProvider } from "@/components/theme-provider"
import NavBar from '@/components/wrapper/navbar'
import { CoachesFooter } from '@/components/coaching/coach-profiles/CoachesFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL("https://dibs.coach"),
  title: {
    default: 'Coach Profile | Dibs',
    template: `%s | Dibs`
  },
  description: 'Connect with expert real estate coaches to help you achieve your property goals.',
  openGraph: {
    title: 'Coach Profile | Dibs',
    description: 'Connect with expert real estate coaches to help you achieve your property goals.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coach Profile | Dibs',
    description: 'Connect with expert real estate coaches to help you achieve your property goals.',
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen flex-col bg-background">
          <NavBar />
          <main className="flex-1 w-full pt-16">
            <div className="container py-6 space-y-6 max-w-5xl">
              {children}
            </div>
          </main>
          <CoachesFooter />
        </div>
      </ThemeProvider>
    </Provider>
  )
} 