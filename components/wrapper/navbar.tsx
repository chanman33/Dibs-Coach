"use client"
import Link from 'next/link';
import Image from 'next/image';
import * as React from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { Button } from "../ui/button";
import { SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { UserProfile } from "../user-profile";
import ModeToggle from "../mode-toggle";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import config from "@/config";
import { useAuth } from "@clerk/nextjs";
import { Dialog, DialogClose } from "@radix-ui/react-dialog";

export default function NavBar() {
    const { isLoaded, userId } = config?.auth?.enabled ? useAuth() : { isLoaded: true, userId: null };

    // Don't render anything until auth is loaded
    if (!isLoaded) {
        return null;
    }

    return (
        <div className="flex min-w-full fixed justify-between p-2 border-b z-10 dark:bg-black dark:bg-opacity-50 bg-white">
            <div className="flex justify-between w-full min-[825px]:hidden">
                <Dialog>
                    <SheetTrigger className="p-2 transition">
                        <Button size="icon" variant="ghost" className="w-4 h-4" aria-label="Open menu" asChild>
                            <GiHamburgerMenu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <SheetHeader>
                            <SheetTitle>Dibs</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col space-y-3 mt-[1rem]">
                            <DialogClose asChild>
                                <Link href={userId ? "/dashboard" : "/"}>
                                    <Button variant="outline" className="w-full">
                                        {userId ? "Dashboard" : "Home"}
                                    </Button>
                                </Link>
                            </DialogClose>
                            {!userId && (
                                <DialogClose asChild>
                                    <Link href="/sign-up">
                                        <Button variant="outline" className="w-full">Sign Up / Log In</Button>
                                    </Link>
                                </DialogClose>
                            )}
                        </div>
                    </SheetContent>
                </Dialog>
                <ModeToggle />
            </div>
            <NavigationMenu className="flex justify-between w-full">
                <NavigationMenuList className="max-[825px]:hidden flex gap-3">
                    <Link 
                        href={userId ? "/dashboard" : "/"} 
                        className="pl-2 flex items-center" 
                        aria-label={userId ? "Dashboard" : "Home"}
                    >
                        <Image
                            src="https://utfs.io/f/vsxOYx8jne165wyeoiHgeTEz7hN19sBwDyrvKxioc2kQLnp3"
                            alt="Logo"
                            width={80}
                            height={20}
                            className="object-contain dark:hidden"
                            priority
                        />
                        <Image
                            src="https://utfs.io/f/vsxOYx8jne16qkQqNfjFkTQhZ97v4VpUzm85MASd0nWRBi3J"
                            alt="Logo"
                            width={80}
                            height={20}
                            className="object-contain hidden dark:block"
                            priority
                        />
                        <span className="sr-only">{userId ? "Dashboard" : "Home"}</span>
                    </Link>
                </NavigationMenuList>
            </NavigationMenu>
            <div className="flex items-center gap-2 max-[825px]:hidden">
                {userId ? (
                    <UserProfile />
                ) : (
                    <Link href="/sign-up">
                        <Button variant="ghost">Sign Up / Log In</Button>
                    </Link>
                )}
                <ModeToggle />
            </div>
        </div>
    );
}
