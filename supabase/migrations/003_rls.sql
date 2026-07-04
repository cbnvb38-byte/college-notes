-- Migration: 003_rls.sql
-- Description: Enable Row Level Security (RLS) on all tables and create access policies.

-- =========================================================================
-- 8. Enable RLS
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 9. Policies
-- =========================================================================

-- (Profiles Policies)
CREATE POLICY "Profiles - Select policy"
  ON public.profiles
  FOR SELECT
  USING (id = public.requesting_user_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Profiles - Update policy"
  ON public.profiles
  FOR UPDATE
  USING (id = public.requesting_user_id())
  WITH CHECK (id = public.requesting_user_id());

-- (Branches Policies)
CREATE POLICY "Branches - Public select"
  ON public.branches
  FOR SELECT
  USING (true);

CREATE POLICY "Branches - Admin manage"
  ON public.branches
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- (Subjects Policies)
CREATE POLICY "Subjects - Public select"
  ON public.subjects
  FOR SELECT
  USING (true);

CREATE POLICY "Subjects - Admin manage"
  ON public.subjects
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- (Notes Policies)
CREATE POLICY "Notes - Select policy"
  ON public.notes
  FOR SELECT
  USING (
    status = 'approved' OR 
    author_id = public.requesting_user_id() OR 
    public.current_user_role() IN ('admin', 'moderator')
  );

CREATE POLICY "Notes - Insert policy"
  ON public.notes
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = public.requesting_user_id());

CREATE POLICY "Notes - Update policy"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (
    author_id = public.requesting_user_id() OR 
    public.current_user_role() IN ('admin', 'moderator')
  )
  WITH CHECK (
    author_id = public.requesting_user_id() OR 
    public.current_user_role() IN ('admin', 'moderator')
  );

CREATE POLICY "Notes - Delete policy"
  ON public.notes
  FOR DELETE
  TO authenticated
  USING (
    author_id = public.requesting_user_id() OR 
    public.current_user_role() IN ('admin', 'moderator')
  );

-- (Bookmarks Policies)
CREATE POLICY "Bookmarks - Owner manage"
  ON public.bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- (Ratings Policies)
CREATE POLICY "Ratings - Owner manage"
  ON public.ratings
  FOR ALL
  TO authenticated
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- (Downloads Policies)
CREATE POLICY "Downloads - Owner manage"
  ON public.downloads
  FOR ALL
  TO authenticated
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- (Reports Policies)
CREATE POLICY "Reports - Insert policy"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = public.requesting_user_id());

CREATE POLICY "Reports - Select policy"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = public.requesting_user_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Reports - Admin manage"
  ON public.reports
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- (Notifications Policies)
CREATE POLICY "Notifications - Owner manage"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- (Admin Logs Policies)
CREATE POLICY "Admin Logs - Admin manage"
  ON public.admin_logs
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');
