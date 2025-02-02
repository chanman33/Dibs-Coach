import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ReadonlyURLSearchParams } from "next/navigation";
import config from "@/config";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ROLES } from '@/utils/roles/roles';
import { userCreate } from '@/utils/data/user/userCreate';

export default async function SignUpPage({
    searchParams,
}: {
    searchParams: { forceRedirectUrl?: string } | ReadonlyURLSearchParams
}) {
    if (!config?.auth?.enabled) {
        redirect('/');
    }

    // Create handler for after sign up
    const handleAfterSignUp = async (user: any) => {
        try {
            // Create user in Supabase using the userCreate function
            const result = await userCreate({
                email: user.emailAddresses[0]?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.imageUrl, // Ensure this field is available
                userId: user.id,
                role: ROLES.MENTEE, // Set the default role
            });
            console.log('[SIGN_UP] User created successfully:', result);
        } catch (error) {
            console.error('[SIGN_UP_ERROR] Failed to create user record:', error);
            // Handle the error appropriately, e.g., show a message to the user
        }
    };

    // Wait for searchParams to be ready and safely extract forceRedirectUrl
    const params = await Promise.resolve(searchParams);
    const forceRedirectUrl = params instanceof ReadonlyURLSearchParams 
        ? params.get('forceRedirectUrl')
        : params.forceRedirectUrl;

    return (
        <div className="flex min-h-screen justify-center items-center p-4">
            <SignUp 
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none"
                    }
                }}
                redirectUrl="/onboarding"
            />
        </div>
    );
}