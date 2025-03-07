import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ReadonlyURLSearchParams } from "next/navigation";
import config from "@/config";
import { Suspense } from "react";

const ONBOARDING_ROUTE = '/onboarding';

export default async function SignUpPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string } | ReadonlyURLSearchParams
}) {
    if (!config?.auth?.enabled) {
        redirect('/');
    }

    return (
        <div className="flex min-h-screen justify-center items-center p-4">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <SignUp 
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "shadow-none"
                        }
                    }}
                    redirectUrl={ONBOARDING_ROUTE}
                    afterSignUpUrl={ONBOARDING_ROUTE}
                    signInUrl="/sign-in"
                />
            </Suspense>
        </div>
    );
}