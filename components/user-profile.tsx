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

    if (!config?.auth?.enabled) {
        router.back()
    }
    const { user } = useUser();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-[2.25rem] h-[2.25rem]">
                <Avatar >
                    <AvatarImage src={user?.imageUrl} alt="User Profile" />
                    <AvatarFallback></AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <Link href="/dashboard">
                        <DropdownMenuItem>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/user-profile">
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>My Account</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/realtor/profile">
                        <DropdownMenuItem>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Public Profile</span>
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
