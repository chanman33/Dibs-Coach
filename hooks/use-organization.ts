import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type Organization = {
  id: string
  name: string
  description: string | null
  status: string
  type: string
  level: string
  tier: string
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // First get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        if (!user) {
          setLoading(false)
          return
        }
        
        // Get the organizations this user belongs to (assume they're in one for now)
        const { data: orgMember, error: orgMemberError } = await supabase
          .from('OrganizationMember')
          .select('organizationUlid')
          .eq('userUlid', user.id)
          .eq('status', 'ACTIVE')
          .single()
        
        if (orgMemberError && orgMemberError.code !== 'PGRST116') throw orgMemberError
        
        if (!orgMember) {
          setLoading(false)
          return
        }
        
        // Get the organization details
        const { data: org, error: orgError } = await supabase
          .from('Organization')
          .select('*')
          .eq('ulid', orgMember.organizationUlid)
          .single()
        
        if (orgError) throw orgError
        
        setOrganization({
          id: org.ulid,
          name: org.name,
          description: org.description,
          status: org.status,
          type: org.type,
          level: org.level,
          tier: org.tier
        })
      } catch (err) {
        console.error('[USE_ORGANIZATION_ERROR]', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch organization'))
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrganization()
  }, [])
  
  return { organization, loading, error }
} 