'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function OnboardingPage() {
    const router = useRouter();
    const { userId } = useAuth();

    useEffect(() => {
        const checkUserCreation = async () => {
            const response = await fetch(`/api/user/role?userId=${userId}`);
            if (response.ok) {
                router.push('/dashboard');
            }
        };

        const interval = setInterval(checkUserCreation, 1000);
        return () => clearInterval(interval);
    }, [userId, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Setting up your account...</h1>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
}