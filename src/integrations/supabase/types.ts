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
      blog_post_tags: {
        Row: {
          blog_post_id: string
          tag_id: string
        }
        Insert: {
          blog_post_id: string
          tag_id: string
        }
        Update: {
          blog_post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string
          featured_image_url: string | null
          grade_band: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          primary_keyword: string | null
          published_at: string | null
          slug: string
          takeaway: string | null
          teaser: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          featured_image_url?: string | null
          grade_band?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          slug: string
          takeaway?: string | null
          teaser?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          featured_image_url?: string | null
          grade_band?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          slug?: string
          takeaway?: string | null
          teaser?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          additional_notes: string | null
          booking_type: Database["public"]["Enums"]["booking_type"]
          confirmation_sent_at: string | null
          constraints: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          devices_available: string | null
          duration_hours: number | null
          id: string
          payment_status: string | null
          preferred_date: string
          preferred_time: string | null
          reminder_sent_at: string | null
          school_name: string | null
          status: Database["public"]["Enums"]["booking_status"]
          topic: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          booking_type: Database["public"]["Enums"]["booking_type"]
          confirmation_sent_at?: string | null
          constraints?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          devices_available?: string | null
          duration_hours?: number | null
          id?: string
          payment_status?: string | null
          preferred_date: string
          preferred_time?: string | null
          reminder_sent_at?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          topic?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          booking_type?: Database["public"]["Enums"]["booking_type"]
          confirmation_sent_at?: string | null
          constraints?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          devices_available?: string | null
          duration_hours?: number | null
          id?: string
          payment_status?: string | null
          preferred_date?: string
          preferred_time?: string | null
          reminder_sent_at?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          topic?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          challenge: string | null
          created_at: string
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          results: string | null
          school_name: string | null
          slug: string
          solution: string | null
          testimonial_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          challenge?: string | null
          created_at?: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          results?: string | null
          school_name?: string | null
          slug: string
          solution?: string | null
          testimonial_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          challenge?: string | null
          created_at?: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          results?: string | null
          school_name?: string | null
          slug?: string
          solution?: string | null
          testimonial_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          source_page: string | null
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          source_page?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          source_page?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          created_at: string
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          quote: string
          school_name: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          quote: string
          school_name?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          quote?: string
          school_name?: string | null
        }
        Relationships: []
      }
      tools_activities: {
        Row: {
          accessibility_notes: string | null
          activity_types: string[] | null
          best_for: string | null
          classroom_flow: string | null
          cost: Database["public"]["Enums"]["cost_type"]
          created_at: string
          description: string | null
          devices: string[] | null
          external_link: string | null
          featured_image_url: string | null
          free_tier_limits: string | null
          group_sizes: Database["public"]["Enums"]["group_size"][] | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          lesson_idea: string | null
          name: string
          offline_option: boolean | null
          privacy_security_notes: string | null
          quick_start_steps: Json | null
          school_stages: Database["public"]["Enums"]["school_stage"][] | null
          setup_time: string | null
          slug: string
          subjects: Database["public"]["Enums"]["subject"][] | null
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          activity_types?: string[] | null
          best_for?: string | null
          classroom_flow?: string | null
          cost?: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          description?: string | null
          devices?: string[] | null
          external_link?: string | null
          featured_image_url?: string | null
          free_tier_limits?: string | null
          group_sizes?: Database["public"]["Enums"]["group_size"][] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          lesson_idea?: string | null
          name: string
          offline_option?: boolean | null
          privacy_security_notes?: string | null
          quick_start_steps?: Json | null
          school_stages?: Database["public"]["Enums"]["school_stage"][] | null
          setup_time?: string | null
          slug: string
          subjects?: Database["public"]["Enums"]["subject"][] | null
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          activity_types?: string[] | null
          best_for?: string | null
          classroom_flow?: string | null
          cost?: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          description?: string | null
          devices?: string[] | null
          external_link?: string | null
          featured_image_url?: string | null
          free_tier_limits?: string | null
          group_sizes?: Database["public"]["Enums"]["group_size"][] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          lesson_idea?: string | null
          name?: string
          offline_option?: boolean | null
          privacy_security_notes?: string | null
          quick_start_steps?: Json | null
          school_stages?: Database["public"]["Enums"]["school_stage"][] | null
          setup_time?: string | null
          slug?: string
          subjects?: Database["public"]["Enums"]["subject"][] | null
          updated_at?: string
        }
        Relationships: []
      }
      tutorials: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          category: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          language: string | null
          learning_outcomes: string[] | null
          likes_count: number | null
          prerequisites: string[] | null
          published_at: string | null
          resources: Json | null
          slug: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          transcript: string | null
          updated_at: string
          video_id: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          learning_outcomes?: string[] | null
          likes_count?: number | null
          prerequisites?: string[] | null
          published_at?: string | null
          resources?: Json | null
          slug: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
          video_id?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          learning_outcomes?: string[] | null
          likes_count?: number | null
          prerequisites?: string[] | null
          published_at?: string | null
          resources?: Json | null
          slug?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
          video_id?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      use_cases: {
        Row: {
          category: string | null
          content: string
          created_at: string
          description: string | null
          difficulty_level: string | null
          featured_image_url: string | null
          gallery_images: string[] | null
          grade_level: string[] | null
          id: string
          implementation_time: string | null
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          required_tools: string[] | null
          results: string | null
          slug: string
          student_count: string | null
          subject_areas: string[] | null
          success_metrics: string | null
          tags: string[] | null
          testimonial: string | null
          testimonial_author: string | null
          testimonial_school: string | null
          tips: string[] | null
          title: string
          updated_at: string
          variations: string[] | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          featured_image_url?: string | null
          gallery_images?: string[] | null
          grade_level?: string[] | null
          id?: string
          implementation_time?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          required_tools?: string[] | null
          results?: string | null
          slug: string
          student_count?: string | null
          subject_areas?: string[] | null
          success_metrics?: string | null
          tags?: string[] | null
          testimonial?: string | null
          testimonial_author?: string | null
          testimonial_school?: string | null
          tips?: string[] | null
          title: string
          updated_at?: string
          variations?: string[] | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          featured_image_url?: string | null
          gallery_images?: string[] | null
          grade_level?: string[] | null
          id?: string
          implementation_time?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          required_tools?: string[] | null
          results?: string | null
          slug?: string
          student_count?: string | null
          subject_areas?: string[] | null
          success_metrics?: string | null
          tags?: string[] | null
          testimonial?: string | null
          testimonial_author?: string | null
          testimonial_school?: string | null
          tips?: string[] | null
          title?: string
          updated_at?: string
          variations?: string[] | null
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
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      booking_type: "consultation" | "mini_audit" | "workshop"
      cost_type: "Free" | "Paid"
      group_size: "Solo" | "Pairs" | "Small Group" | "Whole Class"
      school_stage: "Pre-K" | "K-2" | "3-5" | "6-8" | "9-12"
      subject:
        | "Phonics"
        | "Math"
        | "Science"
        | "CS/ICT"
        | "Social Studies"
        | "Arts"
        | "Music"
        | "PE/Health"
        | "SEL"
        | "Languages"
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
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      booking_type: ["consultation", "mini_audit", "workshop"],
      cost_type: ["Free", "Paid"],
      group_size: ["Solo", "Pairs", "Small Group", "Whole Class"],
      school_stage: ["Pre-K", "K-2", "3-5", "6-8", "9-12"],
      subject: [
        "Phonics",
        "Math",
        "Science",
        "CS/ICT",
        "Social Studies",
        "Arts",
        "Music",
        "PE/Health",
        "SEL",
        "Languages",
      ],
    },
  },
} as const
