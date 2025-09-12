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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      blog: {
        Row: {
          activity_type: string[] | null
          author: Json | null
          category: string
          content: Json
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          grade_levels: string[] | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          subjects: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          activity_type?: string[] | null
          author?: Json | null
          category: string
          content: Json
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          grade_levels?: string[] | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          subjects?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          activity_type?: string[] | null
          author?: Json | null
          category?: string
          content?: Json
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          grade_levels?: string[] | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          subjects?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      edtech: {
        Row: {
          activity_type: string[] | null
          attachments: Json | null
          author: Json | null
          category: string
          content: Json
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration: number | null
          featured_image: string | null
          grade_levels: string[] | null
          group_sizes: string[] | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          materials_needed: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          subjects: string[] | null
          tech_requirements: string[] | null
          title: string
          tools_used: string[] | null
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          activity_type?: string[] | null
          attachments?: Json | null
          author?: Json | null
          category: string
          content: Json
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          featured_image?: string | null
          grade_levels?: string[] | null
          group_sizes?: string[] | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          materials_needed?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          subjects?: string[] | null
          tech_requirements?: string[] | null
          title: string
          tools_used?: string[] | null
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          activity_type?: string[] | null
          attachments?: Json | null
          author?: Json | null
          category?: string
          content?: Json
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          featured_image?: string | null
          grade_levels?: string[] | null
          group_sizes?: string[] | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          materials_needed?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          subjects?: string[] | null
          tech_requirements?: string[] | null
          title?: string
          tools_used?: string[] | null
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          author: Json | null
          body: Json | null
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          featured_image: string | null
          id: string
          is_online: boolean | null
          location: string | null
          max_attendees: number | null
          meta_description: string | null
          meta_title: string | null
          recording_url: string | null
          registration_url: string | null
          slug: string
          stages: string[] | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"] | null
          subjects: string[] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: Json | null
          body?: Json | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          featured_image?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meta_description?: string | null
          meta_title?: string | null
          recording_url?: string | null
          registration_url?: string | null
          slug: string
          stages?: string[] | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"] | null
          subjects?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: Json | null
          body?: Json | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          featured_image?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meta_description?: string | null
          meta_title?: string | null
          recording_url?: string | null
          registration_url?: string | null
          slug?: string
          stages?: string[] | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          subjects?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faq: {
        Row: {
          answer: Json
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: Json
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: Json
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          company: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          picture_url: string | null
          quote: string
          rating: number | null
          school_name: string | null
          updated_at: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          picture_url?: string | null
          quote: string
          rating?: number | null
          school_name?: string | null
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          picture_url?: string | null
          quote?: string
          rating?: number | null
          school_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_newsletter_subscriber_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_email_subscribed: {
        Args: { check_email: string }
        Returns: boolean
      }
    }
    Enums: {
      content_type_enum:
        | "tool"
        | "template"
        | "tutorial"
        | "teaching_technique"
        | "activity"
        | "lesson_plan"
        | "teacher_tip"
        | "blog"
        | "case_study"
        | "research"
        | "research_question"
        | "event"
        | "course"
        | "consulting"
        | "student_project"
        | "news"
      event_status: "draft" | "published" | "archived" | "cancelled"
      event_type: "workshop" | "webinar" | "meetup" | "conference"
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
      content_type_enum: [
        "tool",
        "template",
        "tutorial",
        "teaching_technique",
        "activity",
        "lesson_plan",
        "teacher_tip",
        "blog",
        "case_study",
        "research",
        "research_question",
        "event",
        "course",
        "consulting",
        "student_project",
        "news",
      ],
      event_status: ["draft", "published", "archived", "cancelled"],
      event_type: ["workshop", "webinar", "meetup", "conference"],
    },
  },
} as const
