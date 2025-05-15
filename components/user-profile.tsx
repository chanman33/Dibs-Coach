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
import { SignOutButton, useUser, useClerk } from "@clerk/nextjs"
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
import { useState, useEffect } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { useCentralizedAuth } from '@/app/provider'

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
    const { user } = useUser()
    const { signOut } = useClerk()
    const pathname = usePathname()
    const [imgError, setImgError] = useState(false)
    const organizationContext = useOrganization();
    const organizationName = organizationContext?.organizationName;
    const organizationRole = organizationContext?.organizationRole;
    const { authData } = useCentralizedAuth();
    const [userContext, setUserContext] = useState<'coach' | 'mentee' | null>(null);
    
    // Determine user context (coach or mentee) based on current path or capabilities
    useEffect(() => {
        if (pathname?.includes('/coach')) {
            setUserContext('coach');
        } else if (pathname?.includes('/mentee')) {
            setUserContext('mentee');
        } else if (authData?.capabilities?.includes('COACH')) {
            setUserContext('coach');
        } else {
            setUserContext('mentee'); // Default to mentee
        }
    }, [pathname, authData]);

    if (!config?.auth?.enabled) {
        router.back()
    }

    if (!user) {
        return null;
    }

    // Get the profile image URL with proper handling
    const profileImageUrl = imgError ? DEFAULT_IMAGE_URL : getProfileImageUrl(user.imageUrl);

    // Determine organization link based on role and context
    const getOrganizationLink = () => {
        if (!organizationRole) return "/dashboard";
        
        // If MEMBER role, direct to appropriate organization pages
        if (organizationRole === "MEMBER") {
            if (userContext === 'coach') {
                return "/dashboard/coach/organization/overview";
            } else {
                return "/dashboard/mentee/organization/overview";
            }
        }
        
        // For higher-level roles (OWNER, MANAGER, DIRECTOR), direct to business dashboard
        return "/dashboard/business";
    };

    const handleSignOut = async () => {
        // await signOut(() => {
        //     router.push('/');
        // });
        router.push('/sign-out?forceRedirectUrl=/'); // Navigate to the dedicated sign-out page
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-1 hover:bg-muted rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage 
                            src={imgError ? DEFAULT_IMAGE_URL : getProfileImageUrl(user?.imageUrl)} 
                            alt={user?.firstName || "User"}
                            onError={() => setImgError(true)}
                        />
                        <AvatarFallback>{user?.firstName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium truncate max-w-[120px]">{user?.firstName || "User"}</span>
                        {organizationName && (
                             <span className="text-xs text-muted-foreground truncate max-w-[120px]">{organizationName}</span>
                        )}
                    </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">
                            {user?.firstName && user?.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user?.emailAddresses[0]?.emailAddress || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                            {user?.emailAddresses[0]?.emailAddress}
                        </p>
                    </div>
                </DropdownMenuLabel>
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
                             <Link href={getOrganizationLink()}>
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
                    <Link href="/dashboard/settings?tab=profile">
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile Settings</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {config.auth.enabled && (
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
