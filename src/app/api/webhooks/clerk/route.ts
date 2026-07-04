import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return new Response(
      "Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
      { status: 500 }
    );
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(SIGNING_SECRET);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  const eventType = evt.type;
  const supabase = createAdminSupabaseClient();

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return new Response("Error: Missing primary email address", {
        status: 400,
      });
    }

    const name = [first_name, last_name].filter(Boolean).join(" ");
    
    // Check user profiles count to decide if this is the first user
    let role: "student" | "moderator" | "admin" = "student";
    try {
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (!countError && (count === 0 || count === null)) {
        role = "admin";
      }
    } catch (e) {
      console.warn("Failed to query profile count, defaulting to student: ", e);
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id,
        email,
        name,
        avatar_url: image_url || null,
        role,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error syncing profile to Supabase:", error);
      return new Response("Error syncing profile", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      return new Response("Error: Missing user ID", { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting profile from Supabase:", error);
      return new Response("Error deleting profile", { status: 500 });
    }
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
