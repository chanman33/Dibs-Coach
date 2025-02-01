import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StripeService } from '@/lib/stripe';

const stripeService = new StripeService();

// Set default payment method
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's database ID
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Set as default payment method
    await stripeService.setDefaultPaymentMethod(user.id, params.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[SET_DEFAULT_PAYMENT_METHOD_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 