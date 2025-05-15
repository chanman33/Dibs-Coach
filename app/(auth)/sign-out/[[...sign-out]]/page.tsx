'use client'

import { Suspense, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useClerk, useAuth } from '@clerk/nextjs';

export default function SignOutPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string }
}) {
    const router = useRouter();
    const { signOut } = useClerk();
    const { isLoaded, userId } = useAuth();
    const forceRedirectUrl = searchParams?.forceRedirectUrl || '/';

    useEffect(() => {
        if (isLoaded) {
            if (userId) {
                signOut(() => {
                    router.push(forceRedirectUrl);
                });
            } else {
                router.push(forceRedirectUrl);
            }
        }
    }, [isLoaded, userId, signOut, router, forceRedirectUrl]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={null}>
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Signing out...</p>
                </div>
            </Suspense>
        </div>
    );
}
