import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ReadonlyURLSearchParams } from "next/navigation";
import config from "@/config";

export default async function SignUpPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string } | ReadonlyURLSearchParams
}) {
    if (!config?.auth?.enabled) {
        redirect('/');
    }

    // Wait for searchParams to be ready and safely extract forceRedirectUrl
    const params = await Promise.resolve(searchParams);
    const forceRedirectUrl = params instanceof ReadonlyURLSearchParams 
        ? params.get('forceRedirectUrl')
        : params.forceRedirectUrl;

    const redirectPath = forceRedirectUrl || "/dashboard";

    return (
        <div className="flex min-h-screen justify-center items-center p-4">
            <SignUp 
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none"
                    }
                }}
                redirectUrl={redirectPath}
                afterSignUpUrl={redirectPath}
                signInUrl="/sign-in"
            />
        </div>
    );
}