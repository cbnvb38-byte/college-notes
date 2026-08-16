-- Migration: 018_fix_trending_ambiguity.sql
-- Description: Fix ambiguous created_at column references in get_trending_notes.

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
    SELECT note_id, COUNT(*) * 10 AS score FROM public.downloads d WHERE d.created_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
    UNION ALL
    -- Count bookmarks in last 7 days
    SELECT note_id, COUNT(*) * 8 AS score FROM public.bookmarks b WHERE b.created_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
    UNION ALL
    -- Count ratings in last 7 days
    SELECT note_id, COUNT(*) * 5 AS score FROM public.ratings r WHERE r.created_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
    UNION ALL
    -- Count views in last 7 days
    SELECT note_id, COUNT(*) * 2 AS score FROM public.recently_viewed_notes rv WHERE rv.viewed_at >= NOW() - INTERVAL '7 days' GROUP BY note_id
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
