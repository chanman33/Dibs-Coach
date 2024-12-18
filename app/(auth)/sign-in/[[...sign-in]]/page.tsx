import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import config from "@/config";

export default function SignInPage() {
    if (!config?.auth?.enabled) {
        redirect('/');
    }

    return (
        <div className="flex min-h-screen justify-center items-center p-4">
            <SignIn 
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none"
                    }
                }}
                fallbackRedirectUrl="/" 
                signUpFallbackRedirectUrl="/dashboard" 
            />
        </div>
    );
}