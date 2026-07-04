-- Migration: 20260703000000_init.sql
-- Description: Initialize the College Notes schema with profiles, branches, subjects, notes, favorites, and downloads.
-- Configures Row Level Security (RLS) and indexes.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. Helper Functions for Authentication and RLS Policy Checks
-- =========================================================================

-- Helper to extract the unique Clerk user ID (sub claim) from the verified Clerk JWT.
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'sub';
$$ LANGUAGE sql STABLE;

-- Helper to get the role ('student' or 'admin') of the requesting user.
-- Marked as SECURITY DEFINER so that it can query the public.profiles table even if the user has restricted access.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = public.requesting_user_id();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- =========================================================================
-- 2. Table Definitions
-- =========================================================================

-- Profiles table: holds user details synced from Clerk via Webhooks.
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY, -- Clerk user identifier (e.g. 'user_...')
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Branches table: Represents departments/specializations (e.g. CSE, ECE).
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- e.g., 'CSE'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subjects table: Individual courses mapped to a branch and semester.
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- e.g., 'CS201'
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notes table: Academic resources uploaded by students.
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,       -- URL to access file (Supabase storage path/signed url)
  file_path TEXT NOT NULL,      -- Full path inside bucket (e.g., 'notes/user_xxx/uuid_file.pdf')
  file_type TEXT NOT NULL,      -- MIME type (e.g., 'application/pdf')
  file_size INTEGER NOT NULL,    -- Size in bytes
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Favorites table: User bookmarked notes.
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_favorite UNIQUE (user_id, note_id)
);

-- Downloads table: History tracker for note downloads.
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable to allow guest or deleted profile logs
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =========================================================================
-- 3. Database Indexes for Query Optimization
-- =========================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Subjects indexes
CREATE INDEX idx_subjects_branch_id ON public.subjects(branch_id);
CREATE INDEX idx_subjects_semester ON public.subjects(semester);

-- Notes indexes
CREATE INDEX idx_notes_author_id ON public.notes(author_id);
CREATE INDEX idx_notes_subject_id ON public.notes(subject_id);
CREATE INDEX idx_notes_status ON public.notes(status);
CREATE INDEX idx_notes_semester ON public.notes(semester);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_note_id ON public.favorites(note_id);

-- Downloads indexes
CREATE INDEX idx_downloads_note_id ON public.downloads(note_id);
CREATE INDEX idx_downloads_user_id ON public.downloads(user_id);


-- =========================================================================
-- 4. Row Level Security (RLS) Policies
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- PROFILES POLICIES
-- -------------------------------------------------------------------------
-- Policy 1: Profiles are publicly viewable so that students can see who uploaded a note.
CREATE POLICY "Allow public read of profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Policy 2: Users can only update their own profile name, avatar, and other fields.
CREATE POLICY "Allow users to update own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = public.requesting_user_id())
  WITH CHECK (id = public.requesting_user_id());

-- -------------------------------------------------------------------------
-- BRANCHES POLICIES
-- -------------------------------------------------------------------------
-- Policy 1: Branches are public lists and viewable by any user.
CREATE POLICY "Allow public read of branches"
  ON public.branches
  FOR SELECT
  USING (true);

-- Policy 2: Only administrators can create, edit, or delete branches.
CREATE POLICY "Admins can manage branches"
  ON public.branches
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- -------------------------------------------------------------------------
-- SUBJECTS POLICIES
-- -------------------------------------------------------------------------
-- Policy 1: Subjects are public lists and viewable by any user.
CREATE POLICY "Allow public read of subjects"
  ON public.subjects
  FOR SELECT
  USING (true);

-- Policy 2: Only administrators can create, edit, or delete subjects.
CREATE POLICY "Admins can manage subjects"
  ON public.subjects
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- -------------------------------------------------------------------------
-- NOTES POLICIES
-- -------------------------------------------------------------------------
-- Policy 1: Anyone (even guest users) can search or view approved notes.
CREATE POLICY "Allow read of approved notes"
  ON public.notes
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Authors can see their own pending or rejected notes, and admins can view the entire queue.
CREATE POLICY "Allow authors and admins to read unapproved notes"
  ON public.notes
  FOR SELECT
  USING (author_id = public.requesting_user_id() OR public.current_user_role() = 'admin');

-- Policy 3: Authenticated users can upload/insert notes. The policy ensures they write under their own ID and force-set status to 'pending'.
CREATE POLICY "Allow authenticated user insert"
  ON public.notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = public.requesting_user_id() AND
    status = 'pending'
  );

-- Policy 4: Authors can update details of their own note as long as it has not been approved (remains pending or rejected).
CREATE POLICY "Allow authors to edit own pending/rejected notes"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (
    author_id = public.requesting_user_id() AND
    status IN ('pending', 'rejected')
  )
  WITH CHECK (
    author_id = public.requesting_user_id() AND
    status IN ('pending', 'rejected')
  );

-- Policy 5: Administrators have full, unrestricted permissions to manage, approve, reject, or delete any note.
CREATE POLICY "Admins can manage all notes"
  ON public.notes
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- -------------------------------------------------------------------------
-- FAVORITES POLICIES
-- -------------------------------------------------------------------------
-- Policy 1: Users have full access to select, insert, and delete their own bookmarked favorites.
CREATE POLICY "Users can manage own favorites"
  ON public.favorites
  FOR ALL
  TO authenticated
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- -------------------------------------------------------------------------
-- DOWNLOADS POLICIES
-- -------------------------------------------------------------------------
-- Policy 1: Users can view their own download history list.
CREATE POLICY "Users can view own download history"
  ON public.downloads
  FOR SELECT
  TO authenticated
  USING (user_id = public.requesting_user_id());

-- Policy 2: Any authenticated user can insert logs to record that they downloaded a note.
CREATE POLICY "Allow authenticated users to insert downloads"
  ON public.downloads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.requesting_user_id());

-- Policy 3: Administrators can query and view all download logs for dashboard statistics.
CREATE POLICY "Admins can view all download history"
  ON public.downloads
  FOR SELECT
  USING (public.current_user_role() = 'admin');
