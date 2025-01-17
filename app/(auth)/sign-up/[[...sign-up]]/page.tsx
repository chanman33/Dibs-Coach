import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ReadonlyURLSearchParams } from "next/navigation";
import config from "@/config";
import { userCreate } from "@/utils/data/user/userCreate";
import { ROLES } from "@/utils/roles/roles";

export default async function SignUpPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string } | ReadonlyURLSearchParams
}) {
    if (!config?.auth?.enabled) {
        redirect('/');
    }

    const params = await Promise.resolve(searchParams);
    const forceRedirectUrl = params instanceof ReadonlyURLSearchParams 
        ? params.get('forceRedirectUrl')
        : params.forceRedirectUrl;

    const handleAfterSignUp = async (user: any) => {
        try {
            await userCreate({
                email: user.emailAddresses[0]?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.imageUrl,
                userId: user.id,
                role: ROLES.REALTOR,
            });
        } catch (error) {
            console.error("[SIGNUP_ERROR] Failed to create user in Supabase:", error);
        }
    };

    return (
        <div className="flex min-h-screen justify-center items-center p-4">
            <SignUp 
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none"
                    }
                }}
                redirectUrl={forceRedirectUrl || undefined}
                afterSignUpUrl={forceRedirectUrl || '/dashboard'}
                signInUrl="/sign-in"
            />
        </div>
    );
}