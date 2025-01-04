"use client"

import config from '@/config'
import { UserProfile } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'

export default function Settings() {
  let user = null
  /* eslint-disable react-hooks/rules-of-hooks */
  if (config?.auth?.enabled) {
    user = useUser()
  }

  return (
    <div className="flex-1">
      {config?.auth?.enabled && (
        <UserProfile 
          appearance={{
            elements: {
              card: "!border !border-solid !border-border bg-background text-foreground rounded-lg shadow-none",
              navbar: "!border-b !border-solid !border-border",
              rootBox: "[&_*]:!shadow-none [&>div]:bg-background [&>div]:!border [&>div]:!border-solid [&>div]:!border-border [&_.cl-card]:!border [&_.cl-card]:!border-solid [&_.cl-card]:!border-border",
              pageScrollBox: "bg-background [&>div]:bg-background"
            },
            variables: {
              borderRadius: "0.75rem"
            }
          }}
        />
      )}
    </div>
  )
} 