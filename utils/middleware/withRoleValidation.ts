import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserRoles } from "../roles/checkUserRole";
import { Permission, UserRole, hasAnyRole, hasPermissions } from "../roles/roles";

type RoleValidationOptions = {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean;
};

export function withRoleValidation(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RoleValidationOptions = {}
) {
  return async (req: NextRequest) => {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const userRoles = await getUserRoles(userId);

      // Check roles if specified
      if (options.requiredRoles?.length) {
        const hasRoles = options.requireAll
          ? hasAnyRole(userRoles, options.requiredRoles)
          : hasAnyRole(userRoles, options.requiredRoles);

        if (!hasRoles) {
          return NextResponse.json(
            { error: "Insufficient role permissions" },
            { status: 403 }
          );
        }
      }

      // Check permissions if specified
      if (options.requiredPermissions?.length) {
        const hasRequiredPermissions = hasPermissions(
          userRoles,
          options.requiredPermissions
        );

        if (!hasRequiredPermissions) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Proceed with the handler if all checks pass
      return handler(req);
    } catch (error) {
      console.error("[ROLE_VALIDATION] Error:", error);
      return NextResponse.json(
        { error: "Error validating user role" },
        { status: 500 }
      );
    }
  };
} 