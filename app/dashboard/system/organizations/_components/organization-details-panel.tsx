"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ExternalLink, Map, Mail, Phone, Globe, Calendar, Info } from 'lucide-react'
import Link from 'next/link'

interface Organization {
  ulid: string
  name: string
  description?: string
  type: string
  industry?: string
  status: string
  tier: string
  primaryDomain?: string
  domains?: string[]
  serviceAreas?: string[]
  specializations?: string[]
  createdAt: string
  updatedAt: string
  memberCount?: number
  metadata?: Record<string, any>
}

interface OrganizationDetailsPanelProps {
  organization: Organization
  onUpdate: (data: any) => void
}

export function OrganizationDetailsPanel({ organization, onUpdate }: OrganizationDetailsPanelProps) {
  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Extract contact info from metadata if available
  const contactInfo = organization.metadata?.contactInfo || {
    email: '',
    phone: '',
    website: ''
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Organization Details</CardTitle>
          <CardDescription>
            Basic information about this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="mt-1">
              {organization.description || 'No description provided.'}
            </p>
          </div>

          <Separator />

          {/* General Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-muted-foreground">Organization Type</Label>
              <p className="mt-1 font-medium">{organization.type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Industry</Label>
              <p className="mt-1 font-medium">{organization.industry || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Subscription Tier</Label>
              <p className="mt-1 font-medium">{organization.tier}</p>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium mb-2">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{contactInfo.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contactInfo.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {contactInfo.website ? (
                  <a 
                    href={contactInfo.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    {contactInfo.website}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                ) : (
                  <span>No website provided</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Real Estate Domains */}
          {organization.primaryDomain && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-2">Real Estate Focus</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Primary Domain</Label>
                    <p className="mt-1 font-medium">{organization.primaryDomain}</p>
                  </div>
                  
                  {organization.domains && organization.domains.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Other Domains</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {organization.domains.map((domain, i) => (
                          <Badge key={i} variant="outline">{domain}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Service Areas */}
          {organization.serviceAreas && organization.serviceAreas.length > 0 && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-2">Service Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {organization.serviceAreas.map((area, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                      <Map className="h-3 w-3" />
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Specializations */}
          {organization.specializations && organization.specializations.length > 0 && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {organization.specializations.map((spec, i) => (
                    <Badge key={i} variant="secondary">{spec}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* System Information */}
          <div>
            <h3 className="text-lg font-medium mb-2">System Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(organization.createdAt)}</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(organization.updatedAt)}</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Organization ID</Label>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <code className="bg-secondary p-1 rounded">{organization.ulid}</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Link href={`/dashboard/system/organizations/${organization.ulid}#settings`}>
          <Button>
            Edit Organization Details
          </Button>
        </Link>
      </div>
    </div>
  )
} 