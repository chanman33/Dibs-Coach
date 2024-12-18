import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import config from "@/config";

export default function SignUpPage() {
    if (!config?.auth?.enabled) {
        redirect('/');
    }

    return (
        <div className="flex min-h-screen justify-center items-center p-4">
            <SignUp 
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none"
                    }
                }}
                fallbackRedirectUrl="/" 
                signInFallbackRedirectUrl="/dashboard" 
            />
        </div>
    );
}