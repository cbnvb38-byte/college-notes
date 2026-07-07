"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function ensureCurrentUserProfile() {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServiceRoleSupabaseClient();
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Clerk user not found" };
  }

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) {
    return { success: false, error: "User has no primary email" };
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const avatar_url = user.imageUrl || null;

  // 1. Check if the user's profile already exists
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (existingProfile) {
    // SELF-HEALING: If profile exists, guarantee it perfectly matches Clerk (except role)
    // This fixes any previous identity overwrites.
    const { data: healedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        email,
        name,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error healing profile:", updateError);
      return { success: true, data: existingProfile }; // Fallback to existing
    }
    
    return { success: true, data: healedProfile };
  }

  if (selectError && selectError.code !== "PGRST116") { // PGRST116 is 'not found'
    console.error("Error fetching profile in ensureCurrentUserProfile:", selectError);
    return { success: false, error: "Database error" };
  }

  // 2. Profile doesn't exist, we need to create it
  // Check if it's the very first user in the DB
  let initialRole = "student";
  try {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (!countError && (count === 0 || count === null)) {
      initialRole = "admin";
    }
  } catch (e) {
    console.warn("Failed to query profile count, defaulting to student:", e);
  }

  // Insert the row
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      name,
      avatar_url,
      role: initialRole as any,
    })
    .select()
    .single();

  if (insertError) {
    // Handle potential duplicate insert race conditions safely
    if (insertError.code === '23505') { // unique violation
      const { data: recoveredProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (recoveredProfile) {
         return { success: true, data: recoveredProfile };
      }
    }
    console.error("Error inserting profile in ensureCurrentUserProfile:", insertError);
    return { success: false, error: "Failed to create profile" };
  }

  return { success: true, data: newProfile };
}

export async function updateProfileSettings(formData: { department?: string, semester?: string }) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServiceRoleSupabaseClient();

  // We perform an update explicitly keyed to `id = userId`
  // We NEVER allow updating email or role via this client-facing form.
  const { data, error } = await supabase
    .from("profiles")
    .update({
      // We would map department/semester if they existed on `profiles`
      // For now, this just touches `updated_at` to prove connectivity
      // without modifying role/email
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile settings:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
