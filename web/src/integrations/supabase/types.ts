/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: number
          resource_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          resource_id: string
          viewer_id?: string
        }
        Update: {
          created_at?: string
          id?: never
          resource_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          resource_ids: string[]
          viewer_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          name: string
          resource_ids?: string[]
          viewer_id?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          resource_ids?: string[]
          viewer_id?: string
        }
        Relationships: []
      }
      download_events: {
        Row: {
          at: string
          id: string
          resource_id: string
          school: string
          schools: string[] | null
          sub_office: string
          sub_offices: string[] | null
        }
        Insert: {
          at?: string
          id: string
          resource_id: string
          school?: string
          schools?: string[] | null
          sub_office?: string
          sub_offices?: string[] | null
        }
        Update: {
          at?: string
          id?: string
          resource_id?: string
          school?: string
          schools?: string[] | null
          sub_office?: string
          sub_offices?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "download_events_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          author: string
          comment: string
          created_at: string
          id: string
          kind: string
          resource_id: string
          stars: number
        }
        Insert: {
          author?: string
          comment?: string
          created_at?: string
          id: string
          kind?: string
          resource_id: string
          stars?: number
        }
        Update: {
          author?: string
          comment?: string
          created_at?: string
          id?: string
          kind?: string
          resource_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          at: string
          body: string
          id: string
          kind: string
          read: boolean
          resource_id: string | null
          title: string
        }
        Insert: {
          at?: string
          body?: string
          id: string
          kind?: string
          read?: boolean
          resource_id?: string | null
          title: string
        }
        Update: {
          at?: string
          body?: string
          id?: string
          kind?: string
          read?: boolean
          resource_id?: string | null
          title?: string
        }
        Relationships: []
      }
      portal_users: {
        Row: {
          active: boolean
          id: string
          last_active: string
          name: string
          role: string
          school: string
          sub_office: string
          username: string
        }
        Insert: {
          active?: boolean
          id: string
          last_active?: string
          name: string
          role?: string
          school?: string
          sub_office?: string
          username: string
        }
        Update: {
          active?: boolean
          id?: string
          last_active?: string
          name?: string
          role?: string
          school?: string
          sub_office?: string
          username?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          author: string
          competency_code: string
          copyright: string
          created_at: string
          date_created: string
          date_uploaded: string
          description: string
          division: string
          downloads: number
          duration_sec: number
          featured: boolean
          file_kind: string
          file_name: string
          file_size_kb: number
          grade_level: string
          id: string
          key_stage: string
          keywords: string[]
          language: string
          learning_area: string
          learning_competency: string
          link_url: string | null
          melc_reference: string
          pages: number
          publisher: string
          quarter: string
          resource_type: string
          school: string
          school_year: string
          schools: string[] | null
          shs_strand: string | null
          status: string
          storage_path: string | null
          sub_office: string
          sub_offices: string[] | null
          subject: string
          title: string
          updated_at: string
          version: string
          versions: Json
          views: number
        }
        Insert: {
          author: string
          competency_code?: string
          copyright?: string
          created_at?: string
          date_created?: string
          date_uploaded?: string
          description?: string
          division?: string
          downloads?: number
          duration_sec?: number
          featured?: boolean
          file_kind: string
          file_name: string
          file_size_kb?: number
          grade_level: string
          id: string
          key_stage?: string
          keywords?: string[]
          language?: string
          learning_area: string
          learning_competency?: string
          link_url?: string | null
          melc_reference?: string
          pages?: number
          publisher?: string
          quarter: string
          resource_type: string
          school?: string
          school_year?: string
          schools?: string[] | null
          shs_strand?: string | null
          status?: string
          storage_path?: string | null
          sub_office?: string
          sub_offices?: string[] | null
          subject?: string
          title: string
          updated_at?: string
          version?: string
          versions?: Json
          views?: number
        }
        Update: {
          author?: string
          competency_code?: string
          copyright?: string
          created_at?: string
          date_created?: string
          date_uploaded?: string
          description?: string
          division?: string
          downloads?: number
          duration_sec?: number
          featured?: boolean
          file_kind?: string
          file_name?: string
          file_size_kb?: number
          grade_level?: string
          id?: string
          key_stage?: string
          keywords?: string[]
          language?: string
          learning_area?: string
          learning_competency?: string
          link_url?: string | null
          melc_reference?: string
          pages?: number
          publisher?: string
          quarter?: string
          resource_type?: string
          school?: string
          school_year?: string
          schools?: string[] | null
          shs_strand?: string | null
          status?: string
          storage_path?: string | null
          sub_office?: string
          sub_offices?: string[] | null
          subject?: string
          title?: string
          updated_at?: string
          version?: string
          versions?: Json
          views?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
