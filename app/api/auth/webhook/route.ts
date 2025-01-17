import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { userCreate } from "@/utils/data/user/userCreate";
import { ROLES } from "@/utils/roles/roles";

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, svix-id, svix-timestamp, svix-signature, ngrok-skip-browser-warning',
      'ngrok-skip-browser-warning': 'true'
    }
  });
}

// Add GET handler for testing
export async function GET(req: Request) {
  console.log("[WEBHOOK] Test endpoint accessed");
  console.log("[WEBHOOK] Headers:", Object.fromEntries(req.headers));
  
  return NextResponse.json({
    status: "alive",
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers)
  }, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, svix-id, svix-timestamp, svix-signature, ngrok-skip-browser-warning',
      'ngrok-skip-browser-warning': 'true'
    }
  });
}

export async function POST(req: Request) {
  try {
    // Log request details
    const url = new URL(req.url);
    console.log("\n[WEBHOOK] ====== Starting webhook processing ======");
    console.log("[WEBHOOK] URL:", url.toString());
    console.log("[WEBHOOK] Method:", req.method);
    console.log("[WEBHOOK] Search params:", url.searchParams.toString());

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error("[WEBHOOK] Missing CLERK_WEBHOOK_SECRET");
      throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // Log all headers for debugging
    console.log("[WEBHOOK] Headers received:", Object.fromEntries(headerPayload.entries()));

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("[WEBHOOK] Missing svix headers:", { svix_id, svix_timestamp, svix_signature });
      return new Response("Error occurred -- no svix headers", { status: 400 });
    }

    // Get the body and verify the signature
    let payload;
    try {
      payload = await req.json();
    } catch (error) {
      console.error("[WEBHOOK] Error parsing request body:", error);
      return new Response("Error parsing request body", { status: 400 });
    }

    const body = JSON.stringify(payload);
    console.log("[WEBHOOK] Received event type:", payload.type);
    console.log("[WEBHOOK] Payload:", JSON.stringify(payload, null, 2));

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("[WEBHOOK] Error verifying webhook:", err);
      console.error("[WEBHOOK] Verification details:", {
        secret_prefix: WEBHOOK_SECRET.substring(0, 4) + "...",
        svix_id,
        svix_timestamp,
        svix_signature
      });
      return new Response("Error verifying webhook signature", { status: 400 });
    }

    // Get the event type
    const eventType = evt.type;

    switch (eventType) {
      case "user.created":
        try {
          console.log("[WEBHOOK] Processing user.created event");
          
          const userData = {
            email: payload.data.email_addresses[0].email_address,
            firstName: payload.data.first_name,
            lastName: payload.data.last_name,
            profileImageUrl: payload.data.image_url,
            userId: payload.data.id,
            role: ROLES.REALTOR,
          };

          console.log("[WEBHOOK] Attempting to create user with data:", userData);
          
          const result = await userCreate(userData);
          console.log("[WEBHOOK] User created successfully:", result);
          
          return NextResponse.json({
            status: 200,
            message: "User created successfully",
            data: result
          });
        } catch (error: any) {
          console.error("[WEBHOOK] Error creating user:", error);
          console.error("[WEBHOOK] Error stack:", error.stack);
          return NextResponse.json({
            status: 400,
            message: error.message
          });
        }

      default:
        console.log("[WEBHOOK] Unhandled event type:", eventType);
        return new Response("Webhook processed", { status: 200 });
    }
  } catch (error) {
    console.error("[WEBHOOK] Unhandled error:", error);
    console.error("[WEBHOOK] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return new Response("Internal server error", { status: 500 });
  }
}
