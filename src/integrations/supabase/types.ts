export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_events: {
        Row: {
          application_id: string | null
          created_at: string
          event_type: string
          id: string
          job_id: string | null
          payload: Json | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          job_id?: string | null
          payload?: Json | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string | null
          payload?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          extracted_text: string | null
          id: string
          is_primary: boolean | null
          kind: Database["public"]["Enums"]["doc_kind"]
          metadata: Json | null
          mime_type: string | null
          size_bytes: number | null
          storage_path: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          id?: string
          is_primary?: boolean | null
          kind?: Database["public"]["Enums"]["doc_kind"]
          metadata?: Json | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          id?: string
          is_primary?: boolean | null
          kind?: Database["public"]["Enums"]["doc_kind"]
          metadata?: Json | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          answers: Json | null
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          match_breakdown: Json | null
          match_score: number | null
          notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          tailored_resume: string | null
          tailored_resume_doc_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          match_breakdown?: Json | null
          match_score?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          tailored_resume?: string | null
          tailored_resume_doc_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          match_breakdown?: Json | null
          match_score?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          tailored_resume?: string | null
          tailored_resume_doc_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_tailored_resume_doc_id_fkey"
            columns: ["tailored_resume_doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company: string
          created_at: string
          description: string | null
          embedding: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          expires_at: string | null
          id: string
          location: string | null
          posted_at: string | null
          raw: Json | null
          remote: boolean | null
          requirements: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          source: Database["public"]["Enums"]["job_source"]
          source_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          expires_at?: string | null
          id?: string
          location?: string | null
          posted_at?: string | null
          raw?: Json | null
          remote?: boolean | null
          requirements?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          source?: Database["public"]["Enums"]["job_source"]
          source_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          expires_at?: string | null
          id?: string
          location?: string | null
          posted_at?: string | null
          raw?: Json | null
          remote?: boolean | null
          requirements?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          source?: Database["public"]["Enums"]["job_source"]
          source_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          min_salary: number | null
          phone: string | null
          portfolio_url: string | null
          preferences: Json | null
          preferred_employment_types:
            | Database["public"]["Enums"]["employment_type"][]
            | null
          requires_sponsorship: boolean | null
          target_locations: string[] | null
          target_roles: string[] | null
          timezone: string | null
          updated_at: string
          work_authorization: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          min_salary?: number | null
          phone?: string | null
          portfolio_url?: string | null
          preferences?: Json | null
          preferred_employment_types?:
            | Database["public"]["Enums"]["employment_type"][]
            | null
          requires_sponsorship?: boolean | null
          target_locations?: string[] | null
          target_roles?: string[] | null
          timezone?: string | null
          updated_at?: string
          work_authorization?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          min_salary?: number | null
          phone?: string | null
          portfolio_url?: string | null
          preferences?: Json | null
          preferred_employment_types?:
            | Database["public"]["Enums"]["employment_type"][]
            | null
          requires_sponsorship?: boolean | null
          target_locations?: string[] | null
          target_roles?: string[] | null
          timezone?: string | null
          updated_at?: string
          work_authorization?: string | null
        }
        Relationships: []
      }
      review_queue: {
        Row: {
          action_type: Database["public"]["Enums"]["review_action_type"]
          application_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          expires_at: string | null
          id: string
          payload: Json
          status: Database["public"]["Enums"]["review_status"]
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["review_action_type"]
          application_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          status?: Database["public"]["Enums"]["review_status"]
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["review_action_type"]
          application_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          status?: Database["public"]["Enums"]["review_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_user_chunks: {
        Args: {
          _user_id: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      application_status:
        | "saved"
        | "drafting"
        | "ready_to_apply"
        | "submitted"
        | "interview"
        | "offer"
        | "rejected"
        | "withdrawn"
      doc_kind: "resume" | "knowledge_base" | "cover_letter" | "other"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "temporary"
      job_source: "manual" | "url_paste" | "api" | "scraper"
      review_action_type:
        | "submit_application"
        | "send_message"
        | "auto_fill_form"
        | "send_email"
      review_status: "pending" | "approved" | "rejected" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      application_status: [
        "saved",
        "drafting",
        "ready_to_apply",
        "submitted",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      doc_kind: ["resume", "knowledge_base", "cover_letter", "other"],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "temporary",
      ],
      job_source: ["manual", "url_paste", "api", "scraper"],
      review_action_type: [
        "submit_application",
        "send_message",
        "auto_fill_form",
        "send_email",
      ],
      review_status: ["pending", "approved", "rejected", "expired"],
    },
  },
} as const
