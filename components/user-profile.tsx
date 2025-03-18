import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import config from "@/config"
import { SignOutButton, useUser } from "@clerk/nextjs"
import {
    CreditCard,
    LogOut,
    Settings,
    User,
    UserCircle,
    LayoutDashboard,
    Building,
    LayoutGrid
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"

// Default image placeholder
const DEFAULT_IMAGE_URL = '/placeholder.svg';

// Utility function to handle Clerk profile image URLs
const getProfileImageUrl = (url: string | null | undefined): string => {
  // For missing URLs, use placeholder
  if (!url) return DEFAULT_IMAGE_URL;

  // For placeholder images, use our default placeholder
  if (url.includes('placeholder')) return DEFAULT_IMAGE_URL;

  // Handle Clerk OAuth URLs
  if (url.includes('oauth_google')) {
    // Try img.clerk.com domain first
    return url.replace('images.clerk.dev', 'img.clerk.com');
  }

  // Handle other Clerk URLs
  if (url.includes('clerk.dev') || url.includes('clerk.com')) {
    return url;
  }

  // For all other URLs, ensure HTTPS
  return url.startsWith('https://') ? url : `https://${url}`;
};

const MOCK_USER = {
    firstName: "Dev",
    lastName: "User",
    imageUrl: "",
    fullName: "Dev User"
};

export function UserProfile() {
    const router = useRouter()
    const pathname = usePathname()
    const [imgError, setImgError] = useState(false)
    const { organizationName, organizationRole } = useOrganization();
    
    // Only use Clerk's useUser if auth is enabled
    const { user, isLoaded } = config.auth.enabled 
        ? useUser()
        : { user: MOCK_USER, isLoaded: true };

    if (!config?.auth?.enabled) {
        router.back()
    }

    if (!isLoaded || !user) {
        return null;
    }

    // Get the profile image URL with proper handling
    const profileImageUrl = imgError ? DEFAULT_IMAGE_URL : getProfileImageUrl(user.imageUrl);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-[2.25rem] h-[2.25rem]">
                <Avatar>
                    <AvatarImage 
                        src={profileImageUrl} 
                        alt={user.fullName || "User Profile"} 
                        onError={(e) => {
                            console.error("[USER_PROFILE_IMAGE_ERROR]", {
                                originalUrl: user.imageUrl,
                                error: e
                            });
                            setImgError(true);
                        }}
                    />
                    <AvatarFallback>{user.firstName?.[0] || "U"}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border rounded-lg bg-card [&.cl-internal-17dpwu0]:!shadow-none [&.cl-internal-17dpwu0]:!shadow-sm">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <Link href="/dashboard">
                        <DropdownMenuItem>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </DropdownMenuItem>
                    </Link>
                    {organizationName && (
                        <>
                            <Link href="/dashboard/settings?tab=organizations">
                                <DropdownMenuItem className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Building className="mr-2 h-4 w-4" />
                                        <span className="truncate max-w-[160px]">{organizationName}</span>
                                    </div>
                                    {organizationRole && (
                                        <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 ml-2">
                                            {organizationRole}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            </Link>
                        </>
                    )}
                    <Link href="/dashboard/settings">
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Account Settings</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {config.auth.enabled ? (
                    <SignOutButton>
                        <DropdownMenuItem>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </SignOutButton>
                ) : (
                    <DropdownMenuItem onClick={() => router.push('/sign-in')}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Switch User</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
