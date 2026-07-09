"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new AppError("You must be logged in.", 401, "UNAUTHORIZED");
  }
  return userId;
}

export async function getCurrentUserNotifications() {
  try {
    const userId = await getUserId();
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id,
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getCurrentUserNotifications] Query error:", error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getUnreadNotificationCount() {
  try {
    const userId = await getUserId();
    const supabase = createServiceRoleSupabaseClient();

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[getUnreadNotificationCount] Query error:", error);
      throw error;
    }

    return { success: true, data: count || 0 };
  } catch (error) {
    return handleError(error);
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const userId = await getUserId();
    if (!id) throw new AppError("Notification ID is required", 400, "INVALID_INPUT");

    const supabase = createServiceRoleSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId); // Critical security check

    if (error) {
      console.error("[markNotificationAsRead] Update error:", error);
      throw error;
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const userId = await getUserId();
    const supabase = createServiceRoleSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[markAllNotificationsAsRead] Update error:", error);
      throw error;
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteNotification(id: string) {
  try {
    const userId = await getUserId();
    if (!id) throw new AppError("Notification ID is required", 400, "INVALID_INPUT");

    const supabase = createServiceRoleSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // Critical security check

    if (error) {
      console.error("[deleteNotification] Delete error:", error);
      throw error;
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}
