import Provider from '@/app/provider';
import { ThemeProvider } from "@/components/theme-provider";
import NavBar from '@/components/wrapper/navbar';
import { CoachesFooter } from '@/components/coaching/coach-profiles/CoachesFooter';
import type { Metadata } from 'next';
import './booking.css';

export const metadata: Metadata = {
  metadataBase: new URL("https://dibs.coach"),
  title: {
    default: 'Book a Session | Dibs',
    template: `%s | Dibs`
  },
  description: 'Book a coaching session with one of our expert real estate coaches.',
  openGraph: {
    title: 'Book a Session | Dibs',
    description: 'Book a coaching session with one of our expert real estate coaches.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Session | Dibs',
    description: 'Book a coaching session with one of our expert real estate coaches.',
  },
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen flex-col bg-background">
          <NavBar />
          <main className="flex-1 w-full pt-16">
            <div className="container py-6 space-y-6">
              {children}
            </div>
          </main>
          <CoachesFooter />
        </div>
      </ThemeProvider>
    </Provider>
  );
} 