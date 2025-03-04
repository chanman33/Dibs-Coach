import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthContext, AuthOptions, ForbiddenError, UnauthorizedError } from '../types/auth'
import { hasSystemRole, hasOrgRole, hasPermission, hasCapability } from '../roles/roles'

const metrics = new Map<string, {
  hits: number
  misses: number
  errors: number
  latency: number[]
}>()

export function createAuthMiddleware(options: AuthOptions) {
  return async (context: AuthContext) => {
    const startTime = Date.now()

    try {
      // System role check
      if (options.requiredSystemRole && 
          !hasSystemRole(context.systemRole, options.requiredSystemRole)) {
        throw new ForbiddenError('Insufficient system role')
      }

      // Organization checks
      if (options.requireOrganization && !context.orgRole) {
        throw new ForbiddenError('Organization membership required')
      }

      if (options.requiredOrgRole && options.requiredOrgLevel) {
        if (!context.orgRole || !context.orgLevel) {
          throw new ForbiddenError('Organization role required')
        }

        if (!hasOrgRole(context.orgRole, options.requiredOrgRole, 
                       context.orgLevel, options.requiredOrgLevel)) {
          throw new ForbiddenError('Insufficient organization role')
        }
      }

      // Permission checks
      if (options.requiredPermissions?.length) {
        const hasRequired = options.requireAll
          ? options.requiredPermissions.every(p => hasPermission(context, p))
          : options.requiredPermissions.some(p => hasPermission(context, p))

        if (!hasRequired) {
          throw new ForbiddenError('Insufficient permissions')
        }
      }

      // Capability checks
      if (options.requiredCapabilities?.length) {
        const hasRequired = options.requireAll
          ? options.requiredCapabilities.every(c => hasCapability(context, c))
          : options.requiredCapabilities.some(c => hasCapability(context, c))

        if (!hasRequired) {
          throw new ForbiddenError('Required capabilities not found')
        }
      }

      return context
    } finally {
      // Track metrics
      const duration = Date.now() - startTime
      updateMetrics('auth_middleware', { duration })
    }
  }
}

function updateMetrics(operation: string, data: { duration: number, error?: Error }) {
  const metric = metrics.get(operation) || { hits: 0, misses: 0, errors: 0, latency: [] }
  
  if (data.error) {
    metric.errors++
    metric.misses++
  } else {
    metric.hits++
  }
  
  metric.latency.push(data.duration)
  if (metric.latency.length > 100) metric.latency.shift()
  
  metrics.set(operation, metric)
}
