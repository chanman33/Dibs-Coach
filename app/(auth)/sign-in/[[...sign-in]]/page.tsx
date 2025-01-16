import { SignIn } from "@clerk/nextjs";
import { ReadonlyURLSearchParams } from "next/navigation";

export default async function SignInPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string } | ReadonlyURLSearchParams
}) {
    // Wait for searchParams to be ready and safely extract forceRedirectUrl
    const params = await Promise.resolve(searchParams);
    const forceRedirectUrl = params instanceof ReadonlyURLSearchParams 
        ? params.get('forceRedirectUrl')
        : params.forceRedirectUrl;
    
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignIn 
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none"
                    }
                }}
                redirectUrl={forceRedirectUrl || undefined}
                afterSignInUrl={forceRedirectUrl || '/dashboard'}
                signUpUrl="/sign-up"
            />
        </div>
    );
}