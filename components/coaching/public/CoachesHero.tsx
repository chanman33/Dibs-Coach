'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CoachesHero() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary/20 -mt-16">
      <div className="mx-auto max-w-7xl px-6 pt-40 pb-16 sm:pt-40 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Find Your Perfect Coach
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Connect with experienced real estate professionals who can help you achieve your goals. 
            Our coaches provide personalized guidance to accelerate your success.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/sign-up">
              <Button size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div
        className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6"
        aria-hidden="true"
      >
        <div
          className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary to-primary/30 opacity-30"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  )
} 