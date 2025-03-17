// Export auth components with standardized PascalCase naming
export { WithAuth } from "./with-auth";
export { RouteGuard } from "./route-guard";
export { AuthProviders, useAuthContext } from "./providers";

// Re-export the organization auth component for convenience
export { WithOrganizationAuth } from "./with-organization-auth";

// Re-export types
export type { WithAuthOptions } from "./with-auth"; 