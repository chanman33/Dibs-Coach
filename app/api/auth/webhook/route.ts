import { userCreate } from "@/utils/data/user/userCreate";
import { userUpdate } from "@/utils/data/user/userUpdate";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { ROLES } from "@/utils/roles/roles";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryUserCreate(createUserFn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await createUserFn();
  } catch (error: any) {
    if (retries > 0) {
      console.log(`[WEBHOOK] Retrying user creation. Attempts remaining: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryUserCreate(createUserFn, retries - 1);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  console.info("[WEBHOOK] Received webhook request");
  
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

  console.info("[WEBHOOK] Headers received:", {
    svix_id: svix_id ? "present" : "missing",
    svix_timestamp: svix_timestamp ? "present" : "missing",
    svix_signature: svix_signature ? "present" : "missing"
  });

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

  console.info("[WEBHOOK] Received event type:", payload?.type);

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
    
    console.info("[WEBHOOK] Payload verification successful");
  } catch (err) {
    console.error("[WEBHOOK] Error verifying webhook:", {
      error: err,
      svix_id,
      svix_timestamp
    });
    return new Response("Error occurred during verification", {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.info("[WEBHOOK] Processing event:", {
    type: eventType,
    userId: id
  });

  switch (eventType) {
    case "user.created":
      try {
        console.info("[WEBHOOK] Starting user creation process:", {
          userId: payload?.data?.id,
          email: payload?.data?.email_addresses?.[0]?.email_address
        });

        const createUserFn = () => userCreate({
          email: payload?.data?.email_addresses?.[0]?.email_address,
          firstName: payload?.data?.first_name,
          lastName: payload?.data?.last_name,
          profileImageUrl: payload?.data?.profile_image_url,
          userId: payload?.data?.id,
          role: ROLES.REALTOR,
        });

        const result = await retryUserCreate(createUserFn);

        console.info('[WEBHOOK] User created successfully:', {
          userId: payload?.data?.id,
          email: payload?.data?.email_addresses?.[0]?.email_address,
          dbId: result.id
        });

        return NextResponse.json({ status: 200, message: "User created", data: result });
      } catch (error: any) {
        console.error("[WEBHOOK] Final user creation failure after retries:", {
          error: error.message,
          userId: payload?.data?.id,
          email: payload?.data?.email_addresses?.[0]?.email_address,
          stack: error.stack
        });

        return NextResponse.json({
          status: 500,
          message: "Failed to create user after multiple retries",
          error: {
            message: error.message,
            userId: payload?.data?.id,
            email: payload?.data?.email_addresses?.[0]?.email_address
          }
        }, { status: 500 });
      }

    case "user.updated":
      try {
        console.info("[WEBHOOK] Starting user update process:", {
          userId: payload?.data?.id,
          email: payload?.data?.email_addresses?.[0]?.email_address
        });

        const result = await userUpdate({
          email: payload?.data?.email_addresses?.[0]?.email_address,
          firstName: payload?.data?.first_name,
          lastName: payload?.data?.last_name,
          profileImageUrl: payload?.data?.profile_image_url,
          userId: payload?.data?.id,
        });

        console.info("[WEBHOOK] User updated successfully:", {
          userId: payload?.data?.id,
          email: payload?.data?.email_addresses?.[0]?.email_address,
          success: !!result
        });

        return NextResponse.json({ status: 200, message: "User updated", data: result });
      } catch (error: any) {
        console.error("[WEBHOOK] Error in user.updated handler:", {
          error: error.message,
          userId: payload?.data?.id,
          stack: error.stack
        });
        return NextResponse.json({
          status: 500,
          message: "Failed to update user",
          error: {
            message: error.message,
            userId: payload?.data?.id
          }
        }, { status: 500 });
      }

    default:
      console.info("[WEBHOOK] Unhandled event type:", eventType);
      return new Response(`Unhandled webhook event type: ${eventType}`, {
        status: 400,
      });
  }
}
