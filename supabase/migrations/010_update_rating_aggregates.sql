-- Migration: 010_update_rating_aggregates.sql
-- Description: Updates the note aggregate triggers to include 'hidden' reviews in average and count, but not total text reviews.

CREATE OR REPLACE FUNCTION public.update_note_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  target_note_id UUID;
BEGIN
  target_note_id := COALESCE(NEW.note_id, OLD.note_id);
  
  -- average_rating and total_ratings include BOTH 'visible' and 'hidden' reviews.
  -- total_reviews ONLY includes 'visible' reviews since hidden text shouldn't count.
  UPDATE public.notes
  SET 
    average_rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM public.ratings WHERE note_id = target_note_id AND status IN ('visible', 'hidden')), 0),
    total_ratings = (SELECT COUNT(rating) FROM public.ratings WHERE note_id = target_note_id AND status IN ('visible', 'hidden')),
    total_reviews = (SELECT COUNT(review_text) FROM public.ratings WHERE note_id = target_note_id AND status = 'visible')
  WHERE id = target_note_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
