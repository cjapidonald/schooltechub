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
      blog_posts: {
        Row: {
          content: string | null
          created_at: string | null
          grade_band: string | null
          id: string
          is_published: boolean | null
          primary_keyword: string | null
          published_at: string | null
          slug: string | null
          takeaway: string | null
          teaser: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          grade_band?: string | null
          id?: string
          is_published?: boolean | null
          primary_keyword?: string | null
          published_at?: string | null
          slug?: string | null
          takeaway?: string | null
          teaser?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          grade_band?: string | null
          id?: string
          is_published?: boolean | null
          primary_keyword?: string | null
          published_at?: string | null
          slug?: string | null
          takeaway?: string | null
          teaser?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          additional_notes: string | null
          booking_type: string
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          preferred_date: string | null
          preferred_time: string | null
          school_name: string | null
          status: string | null
          topic: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          booking_type: string
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          school_name?: string | null
          status?: string | null
          topic?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          booking_type?: string
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          school_name?: string | null
          status?: string | null
          topic?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          challenge: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          results: string[] | null
          school_name: string
          solution: string | null
          testimonial_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          challenge?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          results?: string[] | null
          school_name: string
          solution?: string | null
          testimonial_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          challenge?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          results?: string[] | null
          school_name?: string
          solution?: string | null
          testimonial_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_testimonial"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_published: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question?: string
          updated_at?: string
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
          created_at: string | null
          id: string
          is_featured: boolean | null
          quote: string
          school_name: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          quote: string
          school_name?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          quote?: string
          school_name?: string | null
        }
        Relationships: []
      }
      tools_activities: {
        Row: {
          accessibility: string | null
          activity_types: string[] | null
          best_for: string | null
          cost: string | null
          created_at: string | null
          description: string | null
          devices: string[] | null
          grade_bands: string[] | null
          group_size: string | null
          id: string
          name: string
          quick_start: Json | null
          school_stages: string[] | null
          setup_time: string | null
          subjects: string[] | null
          tutorial_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          accessibility?: string | null
          activity_types?: string[] | null
          best_for?: string | null
          cost?: string | null
          created_at?: string | null
          description?: string | null
          devices?: string[] | null
          grade_bands?: string[] | null
          group_size?: string | null
          id?: string
          name: string
          quick_start?: Json | null
          school_stages?: string[] | null
          setup_time?: string | null
          subjects?: string[] | null
          tutorial_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          accessibility?: string | null
          activity_types?: string[] | null
          best_for?: string | null
          cost?: string | null
          created_at?: string | null
          description?: string | null
          devices?: string[] | null
          grade_bands?: string[] | null
          group_size?: string | null
          id?: string
          name?: string
          quick_start?: Json | null
          school_stages?: string[] | null
          setup_time?: string | null
          subjects?: string[] | null
          tutorial_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      tutorials: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_time: string | null
          id: string
          is_published: boolean | null
          learning_outcomes: string[] | null
          school_stages: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_time?: string | null
          id?: string
          is_published?: boolean | null
          learning_outcomes?: string[] | null
          school_stages?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_time?: string | null
          id?: string
          is_published?: boolean | null
          learning_outcomes?: string[] | null
          school_stages?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
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
