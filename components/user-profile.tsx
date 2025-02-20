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
    LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

const MOCK_USER = {
    firstName: "Dev",
    lastName: "User",
    imageUrl: "",
    fullName: "Dev User"
};

export function UserProfile() {
    const router = useRouter()
    const pathname = usePathname()
    
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

    // Determine role from pathname
    const getRole = () => {
        if (pathname.includes('/dashboard/admin')) return 'admin'
        if (pathname.includes('/dashboard/coach')) return 'coach'
        if (pathname.includes('/dashboard/mentee')) return 'mentee'
        return 'mentee' // default to mentee if no role found
    }

    const role = getRole()
    const profilePath = `/dashboard/${role}/profile`
    const settingsPath = `/dashboard/settings`

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-[2.25rem] h-[2.25rem]">
                <Avatar>
                    <AvatarImage src={user.imageUrl} alt={user.fullName || "User Profile"} />
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
                    <Link href={profilePath}>
                        <DropdownMenuItem>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href={settingsPath}>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
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
