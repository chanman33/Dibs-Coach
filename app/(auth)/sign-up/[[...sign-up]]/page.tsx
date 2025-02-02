import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ReadonlyURLSearchParams } from "next/navigation";
import config from "@/config";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ROLES } from '@/utils/roles/roles';

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
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Create initial user record
        const { error } = await supabase
            .from('User')
            .insert([
                {
                    userId: user.id,
                    email: user.emailAddresses[0]?.emailAddress,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: ROLES.MENTEE,
                    status: 'active',
                    updatedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                }
            ]);

        if (error) {
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
                forceRedirectUrl={forceRedirectUrl || '/onboarding'}
                signInUrl="/sign-in"
            />
        </div>
    );
}