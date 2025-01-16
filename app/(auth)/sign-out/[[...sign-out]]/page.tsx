import { SignOutButton } from "@clerk/nextjs";

export default async function SignOutPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string }
}) {
    // Safely extract forceRedirectUrl from searchParams
    const forceRedirectUrl = searchParams?.forceRedirectUrl;
    
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignOutButton redirectUrl={forceRedirectUrl} />
        </div>
    );
} 