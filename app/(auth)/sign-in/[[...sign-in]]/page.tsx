import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string }
}) {
    const { forceRedirectUrl } = searchParams;
    
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignIn 
                redirectUrl={forceRedirectUrl}
                afterSignInUrl={forceRedirectUrl || '/dashboard'}
            />
        </div>
    );
}