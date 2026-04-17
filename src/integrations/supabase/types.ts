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
      article_internal_links: {
        Row: {
          anchor_text: string
          approved: boolean
          auto_generated: boolean
          created_at: string
          id: string
          source_article_id: string
          target_article_id: string
          updated_at: string
        }
        Insert: {
          anchor_text: string
          approved?: boolean
          auto_generated?: boolean
          created_at?: string
          id?: string
          source_article_id: string
          target_article_id: string
          updated_at?: string
        }
        Update: {
          anchor_text?: string
          approved?: boolean
          auto_generated?: boolean
          created_at?: string
          id?: string
          source_article_id?: string
          target_article_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_internal_links_source_article_id_fkey"
            columns: ["source_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_internal_links_target_article_id_fkey"
            columns: ["target_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_views: {
        Row: {
          article_id: string
          created_at: string
          device: string | null
          id: string
          read_time_seconds: number | null
          referrer: string | null
          scroll_depth: number | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          device?: string | null
          id?: string
          read_time_seconds?: number | null
          referrer?: string | null
          scroll_depth?: number | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          device?: string | null
          id?: string
          read_time_seconds?: number | null
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          custom_schema: Json | null
          excerpt: string | null
          featured: boolean
          focus_keyword: string | null
          id: string
          image_url: string | null
          published: boolean
          read_time: number
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          content: string
          created_at?: string
          custom_schema?: Json | null
          excerpt?: string | null
          featured?: boolean
          focus_keyword?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          read_time?: number
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          custom_schema?: Json | null
          excerpt?: string | null
          featured?: boolean
          focus_keyword?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          read_time?: number
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component_stack: string | null
          created_at: string
          id: string
          message: string
          resolved: boolean
          session_id: string | null
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message: string
          resolved?: boolean
          session_id?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean
          session_id?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      indexing_alerts: {
        Row: {
          alert_type: string
          article_id: string
          created_at: string
          id: string
          message: string
          resolved: boolean
        }
        Insert: {
          alert_type?: string
          article_id: string
          created_at?: string
          id?: string
          message: string
          resolved?: boolean
        }
        Update: {
          alert_type?: string
          article_id?: string
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "indexing_alerts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      indexing_health_history: {
        Row: {
          created_at: string
          critical_count: number
          id: string
          recorded_at: string
          score: number
          tip_count: number
          total_articles: number
          warning_count: number
        }
        Insert: {
          created_at?: string
          critical_count?: number
          id?: string
          recorded_at?: string
          score: number
          tip_count?: number
          total_articles?: number
          warning_count?: number
        }
        Update: {
          created_at?: string
          critical_count?: number
          id?: string
          recorded_at?: string
          score?: number
          tip_count?: number
          total_articles?: number
          warning_count?: number
        }
        Relationships: []
      }
      indexing_status: {
        Row: {
          article_id: string
          changed_at: string | null
          coverage_state: string | null
          created_at: string
          id: string
          last_crawl_time: string | null
          previous_verdict: string | null
          url: string
          verdict: string
        }
        Insert: {
          article_id: string
          changed_at?: string | null
          coverage_state?: string | null
          created_at?: string
          id?: string
          last_crawl_time?: string | null
          previous_verdict?: string | null
          url: string
          verdict?: string
        }
        Update: {
          article_id?: string
          changed_at?: string | null
          coverage_state?: string | null
          created_at?: string
          id?: string
          last_crawl_time?: string | null
          previous_verdict?: string | null
          url?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexing_status_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_rankings: {
        Row: {
          clicks: number
          country: string | null
          created_at: string
          ctr: number
          date: string
          device: string | null
          id: string
          impressions: number
          page: string | null
          position: number
          query: string
        }
        Insert: {
          clicks?: number
          country?: string | null
          created_at?: string
          ctr?: number
          date: string
          device?: string | null
          id?: string
          impressions?: number
          page?: string | null
          position?: number
          query: string
        }
        Update: {
          clicks?: number
          country?: string | null
          created_at?: string
          ctr?: number
          date?: string
          device?: string | null
          id?: string
          impressions?: number
          page?: string | null
          position?: number
          query?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_audit_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          progress_done: number | null
          progress_total: number | null
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress_done?: number | null
          progress_total?: number | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress_done?: number | null
          progress_total?: number | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      social_publish_logs: {
        Row: {
          article_id: string | null
          article_title: string
          created_at: string
          error_message: string | null
          id: string
          make_status: number | null
          status: string
          triggered_at: string
        }
        Insert: {
          article_id?: string | null
          article_title: string
          created_at?: string
          error_message?: string | null
          id?: string
          make_status?: number | null
          status: string
          triggered_at?: string
        }
        Update: {
          article_id?: string | null
          article_title?: string
          created_at?: string
          error_message?: string | null
          id?: string
          make_status?: number | null
          status?: string
          triggered_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_top_articles: {
        Args: { days_back?: number; result_limit?: number }
        Returns: {
          article_id: string
          avg_read_time: number
          avg_scroll_depth: number
          category: string
          slug: string
          title: string
          unique_sessions: number
          views: number
        }[]
      }
      get_top_referrers: {
        Args: { days_back?: number; result_limit?: number }
        Returns: {
          referrer: string
          views: number
        }[]
      }
      get_views_by_category: {
        Args: { days_back?: number }
        Returns: {
          category: string
          views: number
        }[]
      }
      get_views_by_device: {
        Args: { days_back?: number }
        Returns: {
          device: string
          views: number
        }[]
      }
      get_views_timeline: {
        Args: { days_back?: number }
        Returns: {
          day: string
          unique_sessions: number
          views: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
