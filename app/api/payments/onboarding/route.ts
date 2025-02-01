import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { StripeService } from '@/lib/stripe';

// Schema for onboarding request
const onboardingSchema = z.object({
  country: z.string().min(2).max(2), // ISO 2-letter country code
});

const stripeService = new StripeService();

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = onboardingSchema.parse(body);

    // Get user's database ID
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Create connected account
    const { account } = await stripeService.createConnectedAccount(
      user.id,
      validatedData.country
    );

    // Create account link for onboarding
    const accountLink = await stripeService.createAccountLink(
      account.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?status=success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?status=error`
    );

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (error) {
    console.error('[ONBOARDING_ERROR]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Get onboarding status
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's database ID and connected account
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get connected account status
    const { data: connectedAccount } = await stripeService.supabase
      .from('StripeConnectedAccount')
      .select('*')
      .eq('userDbId', user.id)
      .single();

    if (!connectedAccount) {
      return NextResponse.json({
        status: 'not_started',
        requiresOnboarding: true,
      });
    }

    return NextResponse.json({
      status: connectedAccount.detailsSubmitted ? 'completed' : 'pending',
      requiresOnboarding: connectedAccount.requiresOnboarding,
      payoutsEnabled: connectedAccount.payoutsEnabled,
      chargesEnabled: connectedAccount.chargesEnabled,
    });
  } catch (error) {
    console.error('[ONBOARDING_STATUS_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 