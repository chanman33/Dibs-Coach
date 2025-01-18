import { userCreate } from "@/utils/data/user/userCreate";
import { userUpdate } from "@/utils/data/user/userUpdate";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { ROLES } from "@/utils/roles/roles";

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('[WEBHOOK] Missing CLERK_WEBHOOK_SECRET');
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[WEBHOOK] Missing required headers');
    return new Response("Error occurred -- missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new SVIX instance with your secret.
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[WEBHOOK] Error verifying webhook:", err);
    return new Response("Error occurred during verification", {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  switch (eventType) {
    case "user.created":
      try {
        const result = await userCreate({
          email: payload?.data?.email_addresses?.[0]?.email_address,
          firstName: payload?.data?.first_name,
          lastName: payload?.data?.last_name,
          profileImageUrl: payload?.data?.profile_image_url,
          userId: payload?.data?.id,
          role: ROLES.REALTOR,
        });

        return NextResponse.json({ status: 200, message: "User created", data: result });
      } catch (error: any) {
        console.error("[WEBHOOK] Error in user.created handler:", error);
        return NextResponse.json({
          status: 400,
          message: error.message,
          error: error
        }, { status: 400 });
      }

    case "user.updated":
      try {
        const result = await userUpdate({
          email: payload?.data?.email_addresses?.[0]?.email_address,
          firstName: payload?.data?.first_name,
          lastName: payload?.data?.last_name,
          profileImageUrl: payload?.data?.profile_image_url,
          userId: payload?.data?.id,
        });

        return NextResponse.json({ status: 200, message: "User updated", data: result });
      } catch (error: any) {
        console.error("[WEBHOOK] Error in user.updated handler:", error);
        return NextResponse.json({
          status: 400,
          message: error.message,
          error: error
        }, { status: 400 });
      }

    default:
      return new Response(`Unhandled webhook event type: ${eventType}`, {
        status: 400,
      });
  }
}
