export type GenerationType = 
  | "summary" 
  | "mcq" 
  | "flashcards" 
  | "important_questions" 
  | "short_notes" 
  | "revision_plan" 
  | "key_concepts" 
  | "weak_topics" 
  | "doubt_answer";

export interface AIUsage {
  id: string;
  user_id: string;
  tokens_used: number;
  generations_count: number;
  last_generation_at: string;
  created_at: string;
  updated_at: string;
}

export interface AIGeneration {
  id: string;
  note_id: string;
  user_id: string;
  generation_type: GenerationType;
  content: any; // jsonb
  created_at: string;
}
