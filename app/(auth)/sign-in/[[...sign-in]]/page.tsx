import { SignIn } from "@clerk/nextjs";

export default function SignInPage({
    searchParams: { forceRedirectUrl }
}: {
    searchParams: { forceRedirectUrl?: string }
}) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignIn 
                afterSignInUrl={forceRedirectUrl || '/dashboard'}
                redirectUrl={forceRedirectUrl}
            />
        </div>
    );
}