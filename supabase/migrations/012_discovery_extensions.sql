-- Migration: 012_discovery_extensions.sql
-- Description: Creates table, indexes, and custom postgres functions for advanced search, related notes, recommendations, trending, and view history.

-- Create recently_viewed table
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uniq_user_note_view UNIQUE (user_id, note_id)
);

-- Enable RLS on recently_viewed
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Add RLS select policy
DROP POLICY IF EXISTS "Allow users to view their own recently viewed notes" ON public.recently_viewed;
CREATE POLICY "Allow users to view their own recently viewed notes"
  ON public.recently_viewed
  FOR SELECT
  USING (public.requesting_user_id() = user_id);

-- Add RLS insert policy
DROP POLICY IF EXISTS "Allow users to record their own views" ON public.recently_viewed;
CREATE POLICY "Allow users to record their own views"
  ON public.recently_viewed
  FOR INSERT
  WITH CHECK (public.requesting_user_id() = user_id);

-- Add RLS update policy for upserts
DROP POLICY IF EXISTS "Allow users to update their own view history" ON public.recently_viewed;
CREATE POLICY "Allow users to update their own view history"
  ON public.recently_viewed
  FOR UPDATE
  USING (public.requesting_user_id() = user_id)
  WITH CHECK (public.requesting_user_id() = user_id);

-- Add RLS delete policy
DROP POLICY IF EXISTS "Allow users to delete their own view history" ON public.recently_viewed;
CREATE POLICY "Allow users to delete their own view history"
  ON public.recently_viewed
  FOR DELETE
  USING (public.requesting_user_id() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rv_user_id ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_rv_note_id ON public.recently_viewed(note_id);
CREATE INDEX IF NOT EXISTS idx_rv_viewed_at ON public.recently_viewed(viewed_at DESC);

-- Create case-insensitive indexes for college and professor search if they don't exist
CREATE INDEX IF NOT EXISTS idx_notes_college_lower ON public.notes(LOWER(college));
CREATE INDEX IF NOT EXISTS idx_notes_professor_lower ON public.notes(LOWER(professor));


-- ==========================================
-- FUNCTION: search_notes
-- ==========================================
CREATE OR REPLACE FUNCTION public.search_notes(
  p_search TEXT DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_semester INT DEFAULT NULL,
  p_subject_id UUID DEFAULT NULL,
  p_college TEXT DEFAULT NULL,
  p_professor TEXT DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_has_verified_reviews BOOLEAN DEFAULT NULL,
  p_has_written_reviews BOOLEAN DEFAULT NULL,
  p_recently_uploaded BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'newest',
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  semester INT,
  college TEXT,
  professor TEXT,
  downloads_count INT,
  bookmarks_count INT,
  view_count INT,
  average_rating NUMERIC,
  total_ratings INT,
  total_reviews INT,
  created_at TIMESTAMPTZ,
  file_url TEXT,
  author_id TEXT,
  contributor_name TEXT,
  subject_id UUID,
  subject_name TEXT,
  subject_code TEXT,
  branch_id UUID,
  branch_name TEXT,
  branch_code TEXT,
  total_count BIGINT
) LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.description,
    n.semester,
    n.college,
    n.professor,
    n.downloads_count,
    n.bookmarks_count,
    n.view_count,
    n.average_rating,
    n.total_ratings,
    n.total_reviews,
    n.created_at,
    n.file_url,
    n.author_id,
    p.name AS contributor_name,
    s.id AS subject_id,
    s.name AS subject_name,
    s.code AS subject_code,
    b.id AS branch_id,
    b.name AS branch_name,
    b.code AS branch_code,
    COUNT(*) OVER() AS total_count
  FROM public.notes n
  LEFT JOIN public.profiles p ON n.author_id = p.id
  LEFT JOIN public.subjects s ON n.subject_id = s.id
  LEFT JOIN public.branches b ON s.branch_id = b.id
  WHERE n.status = 'approved'
    -- Dynamic Filters
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND (p_semester IS NULL OR n.semester = p_semester)
    AND (p_subject_id IS NULL OR n.subject_id = p_subject_id)
    AND (p_college IS NULL OR n.college = p_college)
    AND (p_professor IS NULL OR n.professor = p_professor)
    AND (p_min_rating IS NULL OR n.average_rating >= p_min_rating)
    AND (p_has_verified_reviews IS NULL OR p_has_verified_reviews = FALSE OR EXISTS (
          SELECT 1 FROM public.ratings r 
          WHERE r.note_id = n.id AND r.is_verified_downloader = TRUE AND r.status = 'visible'
        ))
    AND (p_has_written_reviews IS NULL OR p_has_written_reviews = FALSE OR n.total_reviews > 0)
    AND (p_recently_uploaded IS NULL OR p_recently_uploaded = FALSE OR n.created_at >= NOW() - INTERVAL '7 days')
    -- Search query matches (case-insensitive checks)
    AND (
      p_search IS NULL OR p_search = '' OR (
        n.title ILIKE '%' || p_search || '%' OR
        n.description ILIKE '%' || p_search || '%' OR
        n.professor ILIKE '%' || p_search || '%' OR
        n.college ILIKE '%' || p_search || '%' OR
        s.name ILIKE '%' || p_search || '%' OR
        s.code ILIKE '%' || p_search || '%' OR
        b.name ILIKE '%' || p_search || '%' OR
        b.code ILIKE '%' || p_search || '%' OR
        p.name ILIKE '%' || p_search || '%'
      )
    )
  ORDER BY
    -- Relevance Sorting (default when search term is provided)
    CASE 
      WHEN p_sort_by = 'relevance' AND p_search IS NOT NULL AND n.title ILIKE p_search THEN 1
      WHEN p_sort_by = 'relevance' AND p_search IS NOT NULL AND n.title ILIKE p_search || '%' THEN 2
      WHEN p_sort_by = 'relevance' AND p_search IS NOT NULL AND s.code ILIKE p_search || '%' THEN 3
      WHEN p_sort_by = 'relevance' AND p_search IS NOT NULL AND n.title ILIKE '%' || p_search || '%' THEN 4
      WHEN p_sort_by = 'relevance' AND p_search IS NOT NULL AND s.name ILIKE '%' || p_search || '%' THEN 5
      ELSE 100
    END ASC,
    -- Other Sorting Options
    CASE WHEN p_sort_by = 'newest' THEN n.created_at END DESC,
    CASE WHEN p_sort_by = 'downloads' THEN n.downloads_count END DESC,
    CASE WHEN p_sort_by = 'views' THEN n.view_count END DESC,
    CASE WHEN p_sort_by = 'highest_rated' THEN n.average_rating END DESC,
    CASE WHEN p_sort_by = 'most_reviewed' THEN n.total_reviews END DESC,
    -- Fallback deterministic sort
    n.id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


-- ==========================================
-- FUNCTION: get_related_notes
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_related_notes(
  p_note_id UUID,
  p_limit INT DEFAULT 4
) RETURNS TABLE (
  id UUID,
  title TEXT,
  semester INT,
  downloads_count INT,
  view_count INT,
  average_rating NUMERIC,
  total_ratings INT,
  created_at TIMESTAMPTZ,
  subject_name TEXT,
  branch_name TEXT,
  branch_code TEXT
) LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_subject_id UUID;
  v_branch_id UUID;
  v_semester INT;
BEGIN
  -- Get current note properties
  SELECT note.subject_id, s.branch_id, note.semester 
  INTO v_subject_id, v_branch_id, v_semester
  FROM public.notes note
  LEFT JOIN public.subjects s ON note.subject_id = s.id
  WHERE note.id = p_note_id;

  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.semester,
    n.downloads_count,
    n.view_count,
    n.average_rating,
    n.total_ratings,
    n.created_at,
    s.name AS subject_name,
    b.name AS branch_name,
    b.code AS branch_code
  FROM public.notes n
  LEFT JOIN public.subjects s ON n.subject_id = s.id
  LEFT JOIN public.branches b ON s.branch_id = b.id
  WHERE n.status = 'approved'
    AND n.id <> p_note_id
  ORDER BY
    (
      CASE WHEN n.subject_id = v_subject_id THEN 100 ELSE 0 END +
      CASE WHEN s.branch_id = v_branch_id THEN 50 ELSE 0 END +
      CASE WHEN n.semester = v_semester THEN 30 ELSE 0 END +
      COALESCE(n.average_rating, 0) * 5 +
      LEAST(COALESCE(n.downloads_count, 0), 100) * 0.5
    ) DESC,
    n.created_at DESC
  LIMIT p_limit;
END;
$$;


-- ==========================================
-- FUNCTION: get_personalized_recommendations
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(
  p_user_id TEXT DEFAULT NULL,
  p_limit INT DEFAULT 6
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  semester INT,
  downloads_count INT,
  view_count INT,
  average_rating NUMERIC,
  total_ratings INT,
  created_at TIMESTAMPTZ,
  subject_name TEXT,
  branch_name TEXT,
  branch_code TEXT
) LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_branch_id UUID;
  v_semester INT;
  v_college TEXT;
  v_has_profile BOOLEAN := FALSE;
BEGIN
  -- Check user details
  IF p_user_id IS NOT NULL THEN
    SELECT s.branch_id, p.semester, p.college 
    INTO v_branch_id, v_semester, v_college
    FROM public.profiles p
    LEFT JOIN public.notes n ON n.author_id = p.id
    LEFT JOIN public.subjects s ON n.subject_id = s.id
    WHERE p.id = p_user_id
    LIMIT 1;
    
    IF v_branch_id IS NOT NULL OR v_semester IS NOT NULL OR v_college IS NOT NULL THEN
      v_has_profile := TRUE;
    END IF;
  END IF;

  -- Fallback recommendations for new/anonymous users
  IF NOT v_has_profile AND (p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.downloads WHERE user_id = p_user_id)) THEN
    RETURN QUERY
    SELECT 
      n.id,
      n.title,
      n.description,
      n.semester,
      n.downloads_count,
      n.view_count,
      n.average_rating,
      n.total_ratings,
      n.created_at,
      s.name AS subject_name,
      b.name AS branch_name,
      b.code AS branch_code
    FROM public.notes n
    LEFT JOIN public.subjects s ON n.subject_id = s.id
    LEFT JOIN public.branches b ON s.branch_id = b.id
    WHERE n.status = 'approved'
    ORDER BY 
      COALESCE(n.average_rating, 0) DESC,
      n.downloads_count DESC,
      n.created_at DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Personalized recommendations
  RETURN QUERY
  WITH user_interests AS (
    SELECT DISTINCT n.subject_id
    FROM public.notes n
    WHERE n.id IN (
      SELECT note_id FROM public.bookmarks WHERE user_id = p_user_id
      UNION
      SELECT note_id FROM public.downloads WHERE user_id = p_user_id
      UNION
      SELECT note_id FROM public.recently_viewed WHERE user_id = p_user_id
    )
  )
  SELECT 
    n.id,
    n.title,
    n.description,
    n.semester,
    n.downloads_count,
    n.view_count,
    n.average_rating,
    n.total_ratings,
    n.created_at,
    s.name AS subject_name,
    b.name AS branch_name,
    b.code AS branch_code
  FROM public.notes n
  LEFT JOIN public.subjects s ON n.subject_id = s.id
  LEFT JOIN public.branches b ON s.branch_id = b.id
  WHERE n.status = 'approved'
    AND (p_user_id IS NULL OR n.author_id <> p_user_id) -- Avoid self-recommending
    AND n.id NOT IN (
      SELECT note_id FROM public.bookmarks WHERE user_id = p_user_id
      UNION
      SELECT note_id FROM public.downloads WHERE user_id = p_user_id
    )
  ORDER BY
    (
      CASE WHEN s.id IN (SELECT subject_id FROM user_interests) THEN 80 ELSE 0 END +
      CASE WHEN s.branch_id = v_branch_id THEN 50 ELSE 0 END +
      CASE WHEN n.semester = v_semester THEN 30 ELSE 0 END +
      CASE WHEN n.college = v_college THEN 20 ELSE 0 END +
      COALESCE(n.average_rating, 0) * 4 +
      LEAST(COALESCE(n.downloads_count, 0), 100) * 0.2
    ) DESC,
    n.created_at DESC
  LIMIT p_limit;
END;
$$;


-- ==========================================
-- FUNCTION: get_trending_notes
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_trending_notes(
  p_limit INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  semester INT,
  downloads_count INT,
  view_count INT,
  average_rating NUMERIC,
  total_ratings INT,
  created_at TIMESTAMPTZ,
  subject_name TEXT,
  branch_name TEXT,
  branch_code TEXT,
  trending_score BIGINT
) LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  RETURN QUERY
  WITH recent_activity AS (
    -- Count downloads in last 7 days
    SELECT note_id, COUNT(*) * 10 AS score FROM public.downloads WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
    UNION ALL
    -- Count bookmarks in last 7 days
    SELECT note_id, COUNT(*) * 8 AS score FROM public.bookmarks WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
    UNION ALL
    -- Count ratings in last 7 days
    SELECT note_id, COUNT(*) * 5 AS score FROM public.ratings WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
    UNION ALL
    -- Count views in last 7 days
    SELECT note_id, COUNT(*) * 2 AS score FROM public.recently_viewed WHERE viewed_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
  ),
  aggregated_trending AS (
    SELECT note_id, SUM(score) AS total_score
    FROM recent_activity
    GROUP BY note_id
  )
  SELECT 
    n.id,
    n.title,
    n.description,
    n.semester,
    n.downloads_count,
    n.view_count,
    n.average_rating,
    n.total_ratings,
    n.created_at,
    s.name AS subject_name,
    b.name AS branch_name,
    b.code AS branch_code,
    COALESCE(t.total_score, 0)::BIGINT AS trending_score
  FROM public.notes n
  LEFT JOIN public.subjects s ON n.subject_id = s.id
  LEFT JOIN public.branches b ON s.branch_id = b.id
  LEFT JOIN aggregated_trending t ON n.id = t.note_id
  WHERE n.status = 'approved'
  ORDER BY 
    CASE WHEN COALESCE(t.total_score, 0) > 0 THEN t.total_score ELSE 0 END DESC,
    (COALESCE(n.average_rating, 0) * 10 + n.downloads_count * 2 + n.view_count * 0.5) DESC,
    n.created_at DESC
  LIMIT p_limit;
END;
$$;
