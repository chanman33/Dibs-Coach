'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MenteeDashboard() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Welcome to Your Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Add your dashboard content here */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your mentee dashboard! Here you can manage your sessions, find coaches, and track your progress.
          </p>
        </div>
      </div>
    </div>
  )
} 