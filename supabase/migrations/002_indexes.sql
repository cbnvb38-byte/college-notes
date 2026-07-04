-- Migration: 002_indexes.sql
-- Description: Create indexes for database query performance and triggers for updated_at.

-- =========================================================================
-- 6. Indexes
-- =========================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Branches indexes
CREATE INDEX IF NOT EXISTS idx_branches_code ON public.branches(code);

-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_branch_id ON public.subjects(branch_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(semester);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_author_id ON public.notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_status ON public.notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_semester ON public.notes(semester);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_downloads ON public.notes(downloads_count DESC);
CREATE INDEX IF NOT EXISTS idx_notes_bookmarks ON public.notes(bookmarks_count DESC);
CREATE INDEX IF NOT EXISTS idx_notes_title_trgm ON public.notes USING gin (title gin_trgm_ops);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_note_id ON public.bookmarks(note_id);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_note_id ON public.ratings(note_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

-- Downloads indexes
CREATE INDEX IF NOT EXISTS idx_downloads_note_id ON public.downloads(note_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON public.downloads(user_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_note_id ON public.reports(note_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Admin Logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- =========================================================================
-- 7. Triggers for updated_at Autoupdate
-- =========================================================================

CREATE TRIGGER trigger_update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
