'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { SYSTEM_ROLES, PERMISSIONS } from '@/utils/roles/roles'

interface AuthState {
  user: any // Using any for now since we don't have the full Clerk types
  systemRole: keyof typeof SYSTEM_ROLES | null
  permissions: string[]
  loading: boolean
  error: string | null
}

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const [state, setState] = useState<AuthState>({
    user: null,
    systemRole: null,
    permissions: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isLoaded) return
        if (!isSignedIn) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Not authenticated'
          }))
          return
        }

        // In a real app, you'd fetch the user's role and permissions from your database
        // For now, we'll simulate this with clerk metadata
        const systemRole = (clerkUser?.publicMetadata?.systemRole as keyof typeof SYSTEM_ROLES) || null
        const permissions = (clerkUser?.publicMetadata?.permissions as string[]) || []

        setState({
          user: clerkUser,
          systemRole,
          permissions,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to initialize auth'
        }))
      }
    }

    initAuth()
  }, [isLoaded, isSignedIn, clerkUser])

  const hasPermissions = (requiredPermissions: string[]) => {
    if (!state.permissions) return false
    return requiredPermissions.every(permission => 
      state.permissions.includes(permission)
    )
  }

  return {
    ...state,
    hasPermissions,
    isLoaded,
    isSignedIn
  }
} 