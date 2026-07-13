export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
          updated_at: string
          college: string | null
          branch: string | null
          bio: string | null
          is_college_public: boolean
          is_branch_public: boolean
          is_bio_public: boolean
          is_avatar_public: boolean
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
          college?: string | null
          branch?: string | null
          bio?: string | null
          is_college_public?: boolean
          is_branch_public?: boolean
          is_bio_public?: boolean
          is_avatar_public?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
          college?: string | null
          branch?: string | null
          bio?: string | null
          is_college_public?: boolean
          is_branch_public?: boolean
          is_bio_public?: boolean
          is_avatar_public?: boolean
        }
        Relationships: []
      }
      branches: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          branch_id: string
          semester: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          branch_id: string
          semester: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          branch_id?: string
          semester?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          title: string
          description: string | null
          file_url: string
          file_path: string
          file_type: string
          file_size: number
          author_id: string
          subject_id: string
          semester: number
          college: string | null
          professor: string | null
          status: Database["public"]["Enums"]["note_status"]
          rejection_reason: string | null
          downloads_count: number
          bookmarks_count: number
          view_count: number
          average_rating: number
          total_ratings: number
          total_reviews: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_url: string
          file_path: string
          file_type: string
          file_size: number
          author_id: string
          subject_id: string
          semester: number
          college?: string | null
          professor?: string | null
          status?: Database["public"]["Enums"]["note_status"]
          rejection_reason?: string | null
          downloads_count?: number
          bookmarks_count?: number
          view_count?: number
          average_rating?: number
          total_ratings?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_path?: string
          file_type?: string
          file_size?: number
          author_id?: string
          subject_id?: string
          semester?: number
          college?: string | null
          professor?: string | null
          status?: Database["public"]["Enums"]["note_status"]
          rejection_reason?: string | null
          downloads_count?: number
          bookmarks_count?: number
          view_count?: number
          average_rating?: number
          total_ratings?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          note_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          note_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          note_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ratings: {
        Row: {
          id: string
          user_id: string
          note_id: string
          rating: number
          review_text: string | null
          review_title: string | null
          is_verified_downloader: boolean
          status: 'visible' | 'hidden' | 'removed'
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          note_id: string
          rating: number
          review_text?: string | null
          review_title?: string | null
          is_verified_downloader?: boolean
          status?: 'visible' | 'hidden' | 'removed'
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          note_id?: string
          rating?: number
          review_text?: string | null
          review_title?: string | null
          is_verified_downloader?: boolean
          status?: 'visible' | 'hidden' | 'removed'
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      review_helpful_votes: {
        Row: {
          id: string
          review_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      downloads: {
        Row: {
          id: string
          user_id: string | null
          note_id: string
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          note_id: string
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          note_id?: string
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "downloads_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          note_id: string
          reason: string
          description: string | null
          status: 'pending' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          note_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          note_id?: string
          reason?: string
          description?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      review_reports: {
        Row: {
          id: string
          reporter_id: string
          review_id: string
          reason: string
          details: string | null
          status: 'pending' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          review_id: string
          reason: string
          details?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          review_id?: string
          reason?: string
          details?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'note_approved' | 'note_rejected' | 'new_comment' | 'system' | 'report_action'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'note_approved' | 'note_rejected' | 'new_comment' | 'system' | 'report_action'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'note_approved' | 'note_rejected' | 'new_comment' | 'system' | 'report_action'
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_id: string | null
          target_type: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_id?: string | null
          target_type?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_id?: string | null
          target_type?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      requesting_user_id: {
        Args: Record<string, never>
        Returns: string
      }
      current_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      user_role: "student" | "moderator" | "admin"
      note_status: "draft" | "pending_review" | "approved" | "rejected" | "removed"
    }
  }
}
