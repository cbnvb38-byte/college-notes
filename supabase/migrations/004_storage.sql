-- Migration: 004_storage.sql
-- Description: Configure the 'notes' storage bucket and its security policies.

-- Create notes bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notes', 
  'notes', 
  true, 
  20971520, -- 20MB in bytes (20 * 1024 * 1024)
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf']::text[];

-- =========================================================================
-- Storage Policies
-- =========================================================================

-- 1. Public Read: Anyone can read or download objects from the 'notes' bucket
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
CREATE POLICY "Public Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes');

-- 2. Authenticated Upload: Authenticated users can upload files to the 'notes' bucket
-- The file must be placed in a subdirectory corresponding to their user ID (Clerk ID)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notes' AND
    split_part(name, '/', 1) = public.requesting_user_id()
  );

-- 3. Owner Update: Users can modify files that are in their own directory
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'notes' AND
    split_part(name, '/', 1) = public.requesting_user_id()
  )
  WITH CHECK (
    bucket_id = 'notes' AND
    split_part(name, '/', 1) = public.requesting_user_id()
  );

-- 4. Owner Delete: Users can delete files that are in their own directory
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notes' AND
    split_part(name, '/', 1) = public.requesting_user_id()
  );
