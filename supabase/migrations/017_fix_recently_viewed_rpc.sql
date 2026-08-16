-- Migration: 017_fix_recently_viewed_rpc.sql
-- Description: Update get_personalized_recommendations and get_trending_notes to use public.recently_viewed_notes instead of public.recently_viewed.

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
    SELECT s.branch_id, n.semester, p.college 
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
      SELECT note_id FROM public.recently_viewed_notes WHERE user_id = p_user_id
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
    SELECT note_id, COUNT(*) * 2 AS score FROM public.recently_viewed_notes WHERE viewed_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
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
