-- Drop the old table if it exists
DROP TABLE IF EXISTS public.recently_viewed CASCADE;

-- Create the new table
CREATE TABLE IF NOT EXISTS public.recently_viewed_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_user_note_view UNIQUE (user_id, note_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recently_viewed_notes_user_id_viewed_at ON public.recently_viewed_notes(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_notes_note_id ON public.recently_viewed_notes(note_id);

-- Enable RLS
ALTER TABLE public.recently_viewed_notes ENABLE ROW LEVEL SECURITY;

-- Add RLS select policy
DROP POLICY IF EXISTS "Allow users to view their own history" ON public.recently_viewed_notes;
CREATE POLICY "Allow users to view their own history"
  ON public.recently_viewed_notes
  FOR SELECT
  USING (user_id = public.requesting_user_id());

-- Add RLS insert policy
DROP POLICY IF EXISTS "Allow users to record their own views" ON public.recently_viewed_notes;
CREATE POLICY "Allow users to record their own views"
  ON public.recently_viewed_notes
  FOR INSERT
  WITH CHECK (user_id = public.requesting_user_id());

-- Add RLS update policy for upserts
DROP POLICY IF EXISTS "Allow users to update their own view history" ON public.recently_viewed_notes;
CREATE POLICY "Allow users to update their own view history"
  ON public.recently_viewed_notes
  FOR UPDATE
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- Add RLS delete policy
DROP POLICY IF EXISTS "Allow users to delete their own view history" ON public.recently_viewed_notes;
CREATE POLICY "Allow users to delete their own view history"
  ON public.recently_viewed_notes
  FOR DELETE
  USING (user_id = public.requesting_user_id());

-- Grant permissions (for both authenticated and service_role)
GRANT ALL ON public.recently_viewed_notes TO authenticated;
GRANT ALL ON public.recently_viewed_notes TO service_role;
