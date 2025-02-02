'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

export default function OnboardingPage() {
    const router = useRouter();
    const { userId } = useAuth();
    const { user, isLoaded } = useUser();
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 10;

    useEffect(() => {
        if (!userId || !isLoaded || !user) {
            console.log('[ONBOARDING_DEBUG] Waiting for user data:', { userId, isLoaded, user });
            return;
        }

        const createUser = async () => {
            try {
                console.log('[ONBOARDING_DEBUG] Checking if user exists:', userId);
                const checkResponse = await fetch(`/api/user/role?userId=${userId}`);
                const checkData = await checkResponse.json();
                
                console.log('[ONBOARDING_DEBUG] User check response:', { 
                    status: checkResponse.status, 
                    data: checkData 
                });

                if (checkResponse.ok && checkData) {
                    console.log('[ONBOARDING_DEBUG] User exists, redirecting to dashboard');
                    router.push('/dashboard');
                    return;
                }

                // User doesn't exist, create them
                const response = await fetch('/api/user/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.primaryEmailAddress?.emailAddress,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profileImageUrl: user.imageUrl,
                        userId: user.id,
                        role: 'MENTEE',
                        memberStatus: 'active'
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    router.push('/dashboard');
                } else {
                    console.error('[ONBOARDING_ERROR]', data.error);
                    setAttempts(prev => prev + 1);
                }
            } catch (error) {
                console.error('[ONBOARDING_ERROR]', error);
                setAttempts(prev => prev + 1);
            }
        };

        createUser();
    }, [userId, user, isLoaded, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Setting up your account...</h1>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
}