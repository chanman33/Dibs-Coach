import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StripeService } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const stripeService = new StripeService();

// Delete a payment method
export async function DELETE(
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

    // Delete the payment method
    await stripeService.deletePaymentMethod(user.id, params.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE_PAYMENT_METHOD_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 