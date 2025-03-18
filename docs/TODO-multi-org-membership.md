Current Structure
One-to-Many Relationship: Your schema already supports users belonging to multiple organizations through the OrganizationMember join table.
Organization-Level Subscriptions: Each organization has its own tier/plan (OrgTier) and can have its own separate subscription.
User-Organization Association: Users are linked to organizations through the OrganizationMember table, which includes role information.
Implementation Strategy for Multiple Organization Memberships
1. Feature Access Control by Organization Context
When a user is logged in and accessing functionality, you need to determine which organization's plan/permissions apply:

// Example approach - Context-based access control
export const getUserActiveOrganizationContext = async (userUlid: string, currentOrgUlid?: string) => {
  // If organization context is specified, validate membership and return that context
  if (currentOrgUlid) {
    const { data: membership } = await supabase
      .from('OrganizationMember')
      .select('*, organization:Organization(tier, status)')
      .eq('userUlid', userUlid)
      .eq('organizationUlid', currentOrgUlid)
      .single();
    
    if (membership && membership.organization.status === 'ACTIVE') {
      return {
        organizationUlid: currentOrgUlid,
        role: membership.role,
        tier: membership.organization.tier,
        customPermissions: membership.customPermissions
      };
    }
  }
  
  // If no context specified or invalid, return the highest tier organization the user belongs to
  const { data: memberships } = await supabase
    .from('OrganizationMember')
    .select('*, organization:Organization(ulid, tier, status)')
    .eq('userUlid', userUlid)
    .eq('organization.status', 'ACTIVE');
  
  if (!memberships || memberships.length === 0) {
    return null; // User doesn't belong to any active organization
  }
  
  // Define tier hierarchy for comparison
  const tierHierarchy = {
    'ENTERPRISE': 4,
    'PROFESSIONAL': 3,
    'STARTER': 2,
    'FREE': 1,
    'PARTNER': 5 // Assuming partner is highest
  };
  
  // Sort by tier and return highest tier organization
  const sortedMemberships = memberships.sort((a, b) => 
    tierHierarchy[b.organization.tier] - tierHierarchy[a.organization.tier]
  );
  
  return {
    organizationUlid: sortedMemberships[0].organization.ulid,
    role: sortedMemberships[0].role,
    tier: sortedMemberships[0].organization.tier,
    customPermissions: sortedMemberships[0].customPermissions
  };
};


2. Organization Switcher in the UI
Implement an organization switcher that allows users to explicitly select which organization context they're working in:

// Example Organization Switcher Component
const OrganizationSwitcher = ({ userUlid }) => {
  const [organizations, setOrganizations] = useState([]);
  const [activeOrgUlid, setActiveOrgUlid] = useState(null);
  
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data } = await supabase
        .from('OrganizationMember')
        .select('*, organization:Organization(ulid, name, tier)')
        .eq('userUlid', userUlid)
        .eq('organization.status', 'ACTIVE');
      
      if (data && data.length > 0) {
        setOrganizations(data.map(m => m.organization));
        // Set active org to last selected or first available
        const lastSelected = localStorage.getItem('activeOrgUlid');
        const validOrg = data.find(m => m.organization.ulid === lastSelected);
        setActiveOrgUlid(validOrg ? validOrg.organization.ulid : data[0].organization.ulid);
      }
    };
    
    fetchOrganizations();
  }, [userUlid]);
  
  const handleOrgChange = (orgUlid) => {
    setActiveOrgUlid(orgUlid);
    localStorage.setItem('activeOrgUlid', orgUlid);
    // Update application context/state
    // ...
  };
  
  return (
    <Select value={activeOrgUlid} onValueChange={handleOrgChange}>
      {organizations.map(org => (
        <SelectItem key={org.ulid} value={org.ulid}>
          {org.name} ({org.tier})
        </SelectItem>
      ))}
    </Select>
  );
};


3. Feature Gates Based on Organization Tier
Implement feature gating that checks the current organization context:

// Example feature gate
export const canAccessFeature = async (feature: string, userUlid: string, organizationUlid: string) => {
  // Get organization tier
  const { data: org } = await supabase
    .from('Organization')
    .select('tier')
    .eq('ulid', organizationUlid)
    .single();
  
  if (!org) return false;
  
  // Define feature access by tier
  const featureAccess = {
    'basic_analytics': ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'PARTNER'],
    'advanced_analytics': ['PROFESSIONAL', 'ENTERPRISE', 'PARTNER'],
    'custom_reports': ['ENTERPRISE', 'PARTNER'],
    'team_management': ['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'PARTNER'],
    'multi_region': ['PROFESSIONAL', 'ENTERPRISE', 'PARTNER'],
    'api_access': ['ENTERPRISE', 'PARTNER']
  };
  
  // Check if feature exists and if the org tier has access
  return featureAccess[feature]?.includes(org.tier) || false;
};

4. Organization-Specific Settings and Preferences
Store user preferences per organization context:

// Example function to get user's settings for a specific organization
export const getUserOrgSettings = async (userUlid: string, organizationUlid: string) => {
  const { data: member } = await supabase
    .from('OrganizationMember')
    .select('metadata')
    .eq('userUlid', userUlid)
    .eq('organizationUlid', organizationUlid)
    .single();
  
  if (!member || !member.metadata?.settings) {
    return getDefaultSettings(organizationUlid); // Return default settings for org
  }
  
  return member.metadata.settings;
};

// Save user settings for a specific organization
export const saveUserOrgSettings = async (userUlid: string, organizationUlid: string, settings: any) => {
  // Get current metadata
  const { data: member } = await supabase
    .from('OrganizationMember')
    .select('metadata')
    .eq('userUlid', userUlid)
    .eq('organizationUlid', organizationUlid)
    .single();
  
  const metadata = member?.metadata || {};
  
  // Update settings in metadata
  const updatedMetadata = {
    ...metadata,
    settings
  };
  
  // Save updated metadata
  return await supabase
    .from('OrganizationMember')
    .update({ metadata: updatedMetadata })
    .eq('userUlid', userUlid)
    .eq('organizationUlid', organizationUlid);
};

5. Billing and Usage Tracking
Track usage per organization for accurate billing:

// Example usage tracking
export const trackFeatureUsage = async (feature: string, userUlid: string, organizationUlid: string) => {
  const currentTime = new Date().toISOString();
  
  // Record usage event
  await supabase
    .from('FeatureUsage')
    .insert({
      ulid: ulid(),
      feature,
      userUlid,
      organizationUlid,
      timestamp: currentTime
    });
  
  // Optionally update aggregated usage counters
  await supabase.rpc('increment_feature_usage', {
    org_ulid: organizationUlid,
    feature_name: feature
  });
};

Best Practices for Your Implementation
Use an Organization Context Provider: Create a React context provider that maintains the current organization context and provides methods to switch between organizations.
Default to Most Permissive Plan: When a feature is accessible across multiple organizations a user belongs to, default to the most permissive plan's settings unless explicitly in a different organization's context.
Organization-Specific URLs: Use URL paths or query parameters to encode the organization context (e.g., /org/{orgId}/dashboard).
Visual Cues: Provide clear visual cues about which organization context the user is currently operating in.
Role-Based Permissions: Combine organization tier permissions with the user's role in each organization to determine exact access rights.
This approach ensures that users can seamlessly switch between different organizations they belong to while maintaining appropriate access based on each organization's subscription plan.