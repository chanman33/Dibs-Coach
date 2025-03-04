import { SignOutButton } from "@clerk/nextjs";
import { Suspense } from "react";

export default async function SignOutPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string }
}) {
    // Safely extract forceRedirectUrl from searchParams
    const forceRedirectUrl = searchParams?.forceRedirectUrl;
    
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <SignOutButton redirectUrl={forceRedirectUrl} />
            </Suspense>
        </div>
    );
} 