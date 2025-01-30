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
import { useRouter } from "next/navigation"

export function UserProfile() {
    const router = useRouter()
    const { user, isLoaded } = useUser();

    if (!config?.auth?.enabled) {
        router.back()
    }

    if (!isLoaded || !user) {
        return null;
    }

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
                    <Link href="/dashboard/profile">
                        <DropdownMenuItem>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/settings">
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <SignOutButton>
                    <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </SignOutButton>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
