"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function makeClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedGeneration {
  id: string;
  note_id: string;
  note_title: string;
  generation_type: string;
  status: string;
  result_text: string | null;
  result_json: Record<string, unknown> | null;
  created_at: string;
}

// ─── Fetch All Saved Summaries for Current User ───────────────────────────────

export async function getMyAIGenerations(): Promise<
  { success: true; data: SavedGeneration[] } | { success: false; error: string }
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized." };
    }

    const supabase = makeClient();

    // Fetch generations (summary type only, newest first)
    const { data: generations, error: genError } = await supabase
      .from("ai_generations")
      .select("id, note_id, generation_type, status, result_text, result_json, created_at")
      .eq("user_id", userId)
      .eq("generation_type", "summary")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20);

    if (genError) {
      console.error("[copilot-history] getMyAIGenerations:", genError);
      return { success: false, error: "Failed to load saved generations." };
    }

    if (!generations || generations.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch note titles separately (avoid fragile nested joins)
    const noteIds = [...new Set(generations.map((g) => g.note_id))];
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title")
      .in("id", noteIds);

    const titleMap: Record<string, string> = {};
    if (notes) {
      for (const n of notes) {
        titleMap[n.id] = n.title ?? "Untitled Note";
      }
    }

    const data: SavedGeneration[] = generations.map((g) => ({
      id: g.id,
      note_id: g.note_id,
      note_title: titleMap[g.note_id] ?? "Untitled Note",
      generation_type: g.generation_type,
      status: g.status,
      result_text: g.result_text ?? null,
      result_json: g.result_json ?? null,
      created_at: g.created_at,
    }));

    return { success: true, data };
  } catch (err: any) {
    console.error("[copilot-history] getMyAIGenerations unexpected:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Fetch a Single Saved Generation by ID ────────────────────────────────────

export async function getAIGenerationById(generationId: string): Promise<
  { success: true; data: SavedGeneration } | { success: false; error: string }
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized." };
    }

    if (!generationId) {
      return { success: false, error: "Generation ID is required." };
    }

    const supabase = makeClient();

    const { data: gen, error: genError } = await supabase
      .from("ai_generations")
      .select("id, note_id, generation_type, status, result_text, result_json, created_at")
      .eq("id", generationId)
      .eq("user_id", userId) // security: only owner can access
      .single();

    if (genError || !gen) {
      return { success: false, error: "Generation not found." };
    }

    // Fetch note title
    let noteTitle = "Untitled Note";
    const { data: noteData } = await supabase
      .from("notes")
      .select("title")
      .eq("id", gen.note_id)
      .single();
    if (noteData?.title) {
      noteTitle = noteData.title;
    }

    return {
      success: true,
      data: {
        id: gen.id,
        note_id: gen.note_id,
        note_title: noteTitle,
        generation_type: gen.generation_type,
        status: gen.status,
        result_text: gen.result_text ?? null,
        result_json: gen.result_json ?? null,
        created_at: gen.created_at,
      },
    };
  } catch (err: any) {
    console.error("[copilot-history] getAIGenerationById unexpected:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
