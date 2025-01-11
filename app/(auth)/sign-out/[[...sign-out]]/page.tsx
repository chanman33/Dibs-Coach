import { SignOutButton } from "@clerk/nextjs";

export default async function SignOutPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string }
}) {
    const params = await searchParams;
    const { forceRedirectUrl } = params;
    
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignOutButton redirectUrl={forceRedirectUrl} />
        </div>
    );
} 