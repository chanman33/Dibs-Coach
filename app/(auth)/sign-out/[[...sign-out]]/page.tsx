'use client'

import { Suspense } from "react";
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

export default function SignOutPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string }
}) {
    const router = useRouter();
    const { signOut } = useClerk();
    const forceRedirectUrl = searchParams?.forceRedirectUrl || '/';

    const handleSignOut = async () => {
        await signOut(() => {
            router.push(forceRedirectUrl);
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <button 
                    onClick={handleSignOut} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Sign Out
                </button>
            </Suspense>
        </div>
    );
}
