'use client'

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const errorMessages = {
  user_not_found: 'User account not found. Please try signing in again.',
  setup_failed: 'Account setup failed. Please try again or contact support.',
  invalid_role: 'Invalid user role. Please contact support.',
  role_fetch_error: 'Error fetching user role. Please try again.',
  default: 'An unexpected error occurred. Please try again.'
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const message = code ? errorMessages[code as keyof typeof errorMessages] : errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {message}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Return Home
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/sign-in"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Try signing in again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
