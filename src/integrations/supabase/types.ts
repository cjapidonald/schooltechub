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
      admin_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip: string | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author: Json | null
          author_image: string | null
          category: string | null
          content: Json | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          is_pinned: boolean | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author?: Json | null
          author_image?: string | null
          category?: string | null
          content?: Json | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          is_pinned?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author?: Json | null
          author_image?: string | null
          category?: string | null
          content?: Json | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          is_pinned?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      builder_activity_favorites: {
        Row: {
          activity_slug: string | null
          anon_user_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          activity_slug?: string | null
          anon_user_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          activity_slug?: string | null
          anon_user_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_activity_favorites_activity_slug_fkey"
            columns: ["activity_slug"]
            isOneToOne: false
            referencedRelation: "tools_activities"
            referencedColumns: ["slug"]
          },
        ]
      }
      builder_activity_recents: {
        Row: {
          activity_slug: string | null
          anon_user_id: string | null
          id: string
          last_viewed: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_slug?: string | null
          anon_user_id?: string | null
          id?: string
          last_viewed?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_slug?: string | null
          anon_user_id?: string | null
          id?: string
          last_viewed?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_activity_recents_activity_slug_fkey"
            columns: ["activity_slug"]
            isOneToOne: false
            referencedRelation: "tools_activities"
            referencedColumns: ["slug"]
          },
        ]
      }
      builder_collection_items: {
        Row: {
          activity_slug: string | null
          collection_id: string | null
          created_at: string | null
          id: string
          position: number | null
        }
        Insert: {
          activity_slug?: string | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
        }
        Update: {
          activity_slug?: string | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_collection_items_activity_slug_fkey"
            columns: ["activity_slug"]
            isOneToOne: false
            referencedRelation: "tools_activities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "builder_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "builder_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_collections: {
        Row: {
          anon_user_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anon_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anon_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      builder_lesson_plans: {
        Row: {
          anon_user_id: string
          created_at: string | null
          data: Json | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anon_user_id: string
          created_at?: string | null
          data?: Json | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anon_user_id?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      builder_link_health_reports: {
        Row: {
          created_at: string | null
          id: string
          is_healthy: boolean | null
          last_checked: string | null
          last_error: string | null
          status_code: number | null
          status_text: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_healthy?: boolean | null
          last_checked?: string | null
          last_error?: string | null
          status_code?: number | null
          status_text?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_healthy?: boolean | null
          last_checked?: string | null
          last_error?: string | null
          status_code?: number | null
          status_text?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      builder_resource_links: {
        Row: {
          created_at: string | null
          id: string
          is_healthy: boolean | null
          last_checked: string | null
          last_error: string | null
          status_code: number | null
          status_text: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_healthy?: boolean | null
          last_checked?: string | null
          last_error?: string | null
          status_code?: number | null
          status_text?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_healthy?: boolean | null
          last_checked?: string | null
          last_error?: string | null
          status_code?: number | null
          status_text?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          category: string | null
          created_at: string | null
          current_enrollment: number | null
          description: string | null
          duration_hours: number | null
          end_date: string | null
          id: string
          image_url: string | null
          instructor_id: string | null
          instructor_name: string | null
          level: string | null
          max_capacity: number | null
          meeting_link: string | null
          meeting_schedule: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["class_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_enrollment?: number | null
          description?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          level?: string | null
          max_capacity?: number | null
          meeting_link?: string | null
          meeting_schedule?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["class_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_enrollment?: number | null
          description?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          level?: string | null
          max_capacity?: number | null
          meeting_link?: string | null
          meeting_schedule?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["class_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          blog_id: string | null
          content: string
          created_at: string | null
          event_id: string | null
          id: string
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          blog_id?: string | null
          content: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          blog_id?: string | null
          content?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_master: {
        Row: {
          content_type: string
          created_at: string | null
          id: string
          is_published: boolean | null
          language: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          last_accessed: string | null
          notes: string | null
          progress: number | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          notes?: string | null
          progress?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          notes?: string | null
          progress?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          content: Json | null
          created_at: string | null
          currency: string | null
          end_datetime: string | null
          event_capacity: number | null
          event_host: string | null
          event_language: string | null
          event_mode: Database["public"]["Enums"]["event_mode_enum"] | null
          event_price_type:
            | Database["public"]["Enums"]["event_price_type_enum"]
            | null
          event_registered: number | null
          event_status: Database["public"]["Enums"]["event_status_enum"] | null
          event_timezone: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"] | null
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          price: number | null
          published_at: string | null
          recording_url: string | null
          registration_url: string | null
          slug: string
          start_datetime: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          venue: string | null
          view_count: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          currency?: string | null
          end_datetime?: string | null
          event_capacity?: number | null
          event_host?: string | null
          event_language?: string | null
          event_mode?: Database["public"]["Enums"]["event_mode_enum"] | null
          event_price_type?:
            | Database["public"]["Enums"]["event_price_type_enum"]
            | null
          event_registered?: number | null
          event_status?: Database["public"]["Enums"]["event_status_enum"] | null
          event_timezone?: string | null
          event_type?: Database["public"]["Enums"]["event_type_enum"] | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          price?: number | null
          published_at?: string | null
          recording_url?: string | null
          registration_url?: string | null
          slug: string
          start_datetime?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          venue?: string | null
          view_count?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          currency?: string | null
          end_datetime?: string | null
          event_capacity?: number | null
          event_host?: string | null
          event_language?: string | null
          event_mode?: Database["public"]["Enums"]["event_mode_enum"] | null
          event_price_type?:
            | Database["public"]["Enums"]["event_price_type_enum"]
            | null
          event_registered?: number | null
          event_status?: Database["public"]["Enums"]["event_status_enum"] | null
          event_timezone?: string | null
          event_type?: Database["public"]["Enums"]["event_type_enum"] | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          price?: number | null
          published_at?: string | null
          recording_url?: string | null
          registration_url?: string | null
          slug?: string
          start_datetime?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          venue?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      faq: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          page: Database["public"]["Enums"]["page_enum"] | null
          question: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          page?: Database["public"]["Enums"]["page_enum"] | null
          question: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          page?: Database["public"]["Enums"]["page_enum"] | null
          question?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          audience: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          job_position: string | null
          locale: string | null
          name: string | null
          role: Database["public"]["Enums"]["user_role_enum"] | null
          segments: string[] | null
          status: string | null
          subscribed_at: string | null
        }
        Insert: {
          audience?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          job_position?: string | null
          locale?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          segments?: string[] | null
          status?: string | null
          subscribed_at?: string | null
        }
        Update: {
          audience?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          job_position?: string | null
          locale?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          segments?: string[] | null
          status?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          owner_id: string
          stage: string | null
          start_date: string | null
          subject: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          owner_id: string
          stage?: string | null
          start_date?: string | null
          subject?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string
          stage?: string | null
          start_date?: string | null
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      curricula: {
        Row: {
          academic_year: string | null
          class_id: string
          created_at: string | null
          id: string
          owner_id: string
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          class_id: string
          created_at?: string | null
          id?: string
          owner_id: string
          subject: string
          title: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          class_id?: string
          created_at?: string | null
          id?: string
          owner_id?: string
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curricula_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricula_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_items: {
        Row: {
          created_at: string | null
          curriculum_id: string
          id: string
          lesson_title: string
          position: number
          scheduled_on: string | null
          stage: string | null
          status: "planned" | "in_progress" | "done"
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curriculum_id: string
          id?: string
          lesson_title: string
          position: number
          scheduled_on?: string | null
          stage?: string | null
          status?: "planned" | "in_progress" | "done"
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curriculum_id?: string
          id?: string
          lesson_title?: string
          position?: number
          scheduled_on?: string | null
          stage?: string | null
          status?: "planned" | "in_progress" | "done"
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_items_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          body_md: string | null
          class_id: string
          created_at: string | null
          curriculum_item_id: string
          exported_docx_url: string | null
          exported_pdf_url: string | null
          id: string
          owner_id: string
          planned_date: string | null
          stage: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body_md?: string | null
          class_id: string
          created_at?: string | null
          curriculum_item_id: string
          exported_docx_url?: string | null
          exported_pdf_url?: string | null
          id?: string
          owner_id: string
          planned_date?: string | null
          stage?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body_md?: string | null
          class_id?: string
          created_at?: string | null
          curriculum_item_id?: string
          exported_docx_url?: string | null
          exported_pdf_url?: string | null
          id?: string
          owner_id?: string
          planned_date?: string | null
          stage?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_curriculum_item_id_fkey"
            columns: ["curriculum_item_id"]
            isOneToOne: true
            referencedRelation: "curriculum_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_resources: {
        Row: {
          created_at: string | null
          id: string
          lesson_plan_id: string
          position: number
          resource_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_plan_id: string
          position?: number
          resource_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_plan_id?: string
          position?: number
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_resources_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string | null
          file_path: string | null
          id: string
          instructions: string | null
          is_public: boolean | null
          meta: Json | null
          owner_id: string | null
          title: string
          type: "link" | "pdf" | "ppt" | "docx" | "image" | "video"
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          instructions?: string | null
          is_public?: boolean | null
          meta?: Json | null
          owner_id?: string | null
          title: string
          type: "link" | "pdf" | "ppt" | "docx" | "image" | "video"
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          instructions?: string | null
          is_public?: boolean | null
          meta?: Json | null
          owner_id?: string | null
          title?: string
          type?: "link" | "pdf" | "ppt" | "docx" | "image" | "video"
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          salutation: "Mr" | "Ms" | "Mx" | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          salutation?: "Mr" | "Ms" | "Mx" | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          salutation?: "Mr" | "Ms" | "Mx" | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      research_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          project_id: string
          status: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          project_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          project_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          project_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_participants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      research_submissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          participant_id: string
          project_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string | null
          submitted_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          participant_id: string
          project_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string | null
          submitted_at?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          participant_id?: string
          project_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string | null
          submitted_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          description: string | null
          format: string | null
          grade_level: string | null
          id: string
          instructional_notes: string | null
          is_active: boolean | null
          resource_type: string | null
          stage: string | null
          status: string | null
          storage_path: string | null
          subject: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          type: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          description?: string | null
          format?: string | null
          grade_level?: string | null
          id?: string
          instructional_notes?: string | null
          is_active?: boolean | null
          resource_type?: string | null
          stage?: string | null
          status?: string | null
          storage_path?: string | null
          subject?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          description?: string | null
          format?: string | null
          grade_level?: string | null
          id?: string
          instructional_notes?: string | null
          is_active?: boolean | null
          resource_type?: string | null
          stage?: string | null
          status?: string | null
          storage_path?: string | null
          subject?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          consent: boolean | null
          content: string
          created_at: string | null
          email: string | null
          id: string
          is_featured: boolean | null
          job_title: string | null
          name: string
          organization: string | null
          page: Database["public"]["Enums"]["page_enum"] | null
          rating: number | null
          related_content_id: string | null
          updated_at: string | null
        }
        Insert: {
          consent?: boolean | null
          content: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean | null
          job_title?: string | null
          name: string
          organization?: string | null
          page?: Database["public"]["Enums"]["page_enum"] | null
          rating?: number | null
          related_content_id?: string | null
          updated_at?: string | null
        }
        Update: {
          consent?: boolean | null
          content?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean | null
          job_title?: string | null
          name?: string
          organization?: string | null
          page?: Database["public"]["Enums"]["page_enum"] | null
          rating?: number | null
          related_content_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tools_activities: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          grade_levels: string[] | null
          instructions: string | null
          learning_objectives: string[] | null
          materials: string[] | null
          name: string
          slug: string
          subjects: string[] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade_levels?: string[] | null
          instructions?: string | null
          learning_objectives?: string[] | null
          materials?: string[] | null
          name: string
          slug: string
          subjects?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade_levels?: string[] | null
          instructions?: string | null
          learning_objectives?: string[] | null
          materials?: string[] | null
          name?: string
          slug?: string
          subjects?: string[] | null
          tags?: string[] | null
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
      is_admin: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      is_email_subscribed: {
        Args: { check_email: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type_enum:
        | "1:1"
        | "Pairs"
        | "Small Group"
        | "Whole Class"
        | "Stations"
        | "Clubs"
      billing_enum: "Hourly" | "Fixed" | "Retainer"
      bloom_enum:
        | "Remember"
        | "Understand"
        | "Apply"
        | "Analyze"
        | "Evaluate"
        | "Create"
      category_enum: "Lesson Planning" | "Engagement" | "Assessment"
      class_status: "active" | "completed" | "upcoming" | "archived"
      content_type_enum:
        | "blog"
        | "case_study"
        | "research"
        | "research_question"
        | "teaching_technique"
        | "activity"
        | "tutorial"
        | "diary_entry"
        | "event"
        | "service"
        | "about"
      delivery_type_enum: "In-class" | "Online" | "Live" | "Homework"
      enrollment_status: "enrolled" | "completed" | "dropped" | "pending"
      event_mode_enum: "Online" | "In-person" | "Hybrid" | "Live"
      event_price_type_enum: "Free" | "Paid"
      event_status_enum:
        | "Upcoming"
        | "Before"
        | "During"
        | "After"
        | "Follow-Up"
      event_type_enum: "Workshop" | "Webinar" | "Meetup"
      filter_type_enum:
        | "Edu Tech"
        | "Tutorials"
        | "Teaching Techniques"
        | "Class Activity"
        | "Teacher Reflection"
        | "Tips"
        | "Shop"
        | "Case Study"
        | "Research"
        | "Teacher Debates"
      instruction_type_enum:
        | "Direct Instruction"
        | "Differentiated Instruction"
        | "Inquiry-Based Learning"
        | "Project-Based Learning"
        | "Problem-Based Learning"
        | "Play-Based Learning"
        | "Game-Based Learning"
        | "Gamification"
        | "Cooperative Learning"
        | "Experiential Learning"
        | "Design Thinking"
        | "Socratic Seminar"
        | "Station Rotation"
        | "Blended Learning"
      language_level_enum: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      page_enum:
        | "research_blog"
        | "edutech"
        | "teacher_diary"
        | "events"
        | "services"
        | "about"
      payment_enum: "Free" | "Paid" | "Education Discount"
      platform_enum:
        | "Mobile App"
        | "Webapp"
        | "Smartphone"
        | "Smartboard"
        | "Mac"
        | "Windows"
      resource_type_enum:
        | "Worksheets"
        | "Printables"
        | "Task Cards"
        | "Flashcards"
        | "Mats"
        | "Slides"
        | "Presentations"
        | "Videos"
        | "Animations"
        | "Pictures"
        | "Posters"
        | "Readers"
        | "eBooks"
        | "Audio"
        | "Podcasts"
        | "Quizzes"
        | "Interactive Activities"
        | "Labs"
        | "Experiments"
        | "Simulations"
        | "Coding Challenges"
        | "Spreadsheets"
      service_model_enum: "1:1" | "Whole Staff PD" | "Audit" | "Custom"
      sla_tier_enum: "Basic" | "Standard" | "Pro" | "Enterprise"
      stage_enum:
        | "Early Childhood"
        | "Pre-K"
        | "Kindergarten"
        | "Primary"
        | "Secondary"
        | "High School"
        | "K-12"
        | "K-5"
      subcategory_enum:
        | "Lesson Planning"
        | "Lesson Delivery"
        | "Engagement"
        | "Evaluation"
      subject_enum:
        | "Phonics"
        | "English"
        | "Math"
        | "Science"
        | "Biology"
        | "Chemistry"
        | "Physics"
        | "Earth Science"
        | "History"
        | "Geography"
        | "Music"
        | "Arts"
        | "ICT"
        | "PE"
        | "Global Perspective"
        | "Circle Time"
        | "Break Time"
        | "STEAM"
      user_role_enum: "Teacher" | "Admin" | "Parent" | "Student" | "Other"
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
      activity_type_enum: [
        "1:1",
        "Pairs",
        "Small Group",
        "Whole Class",
        "Stations",
        "Clubs",
      ],
      billing_enum: ["Hourly", "Fixed", "Retainer"],
      bloom_enum: [
        "Remember",
        "Understand",
        "Apply",
        "Analyze",
        "Evaluate",
        "Create",
      ],
      category_enum: ["Lesson Planning", "Engagement", "Assessment"],
      class_status: ["active", "completed", "upcoming", "archived"],
      content_type_enum: [
        "blog",
        "case_study",
        "research",
        "research_question",
        "teaching_technique",
        "activity",
        "tutorial",
        "diary_entry",
        "event",
        "service",
        "about",
      ],
      delivery_type_enum: ["In-class", "Online", "Live", "Homework"],
      enrollment_status: ["enrolled", "completed", "dropped", "pending"],
      event_mode_enum: ["Online", "In-person", "Hybrid", "Live"],
      event_price_type_enum: ["Free", "Paid"],
      event_status_enum: ["Upcoming", "Before", "During", "After", "Follow-Up"],
      event_type_enum: ["Workshop", "Webinar", "Meetup"],
      filter_type_enum: [
        "Edu Tech",
        "Tutorials",
        "Teaching Techniques",
        "Class Activity",
        "Teacher Reflection",
        "Tips",
        "Shop",
        "Case Study",
        "Research",
        "Teacher Debates",
      ],
      instruction_type_enum: [
        "Direct Instruction",
        "Differentiated Instruction",
        "Inquiry-Based Learning",
        "Project-Based Learning",
        "Problem-Based Learning",
        "Play-Based Learning",
        "Game-Based Learning",
        "Gamification",
        "Cooperative Learning",
        "Experiential Learning",
        "Design Thinking",
        "Socratic Seminar",
        "Station Rotation",
        "Blended Learning",
      ],
      language_level_enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      page_enum: [
        "research_blog",
        "edutech",
        "teacher_diary",
        "events",
        "services",
        "about",
      ],
      payment_enum: ["Free", "Paid", "Education Discount"],
      platform_enum: [
        "Mobile App",
        "Webapp",
        "Smartphone",
        "Smartboard",
        "Mac",
        "Windows",
      ],
      resource_type_enum: [
        "Worksheets",
        "Printables",
        "Task Cards",
        "Flashcards",
        "Mats",
        "Slides",
        "Presentations",
        "Videos",
        "Animations",
        "Pictures",
        "Posters",
        "Readers",
        "eBooks",
        "Audio",
        "Podcasts",
        "Quizzes",
        "Interactive Activities",
        "Labs",
        "Experiments",
        "Simulations",
        "Coding Challenges",
        "Spreadsheets",
      ],
      service_model_enum: ["1:1", "Whole Staff PD", "Audit", "Custom"],
      sla_tier_enum: ["Basic", "Standard", "Pro", "Enterprise"],
      stage_enum: [
        "Early Childhood",
        "Pre-K",
        "Kindergarten",
        "Primary",
        "Secondary",
        "High School",
        "K-12",
        "K-5",
      ],
      subcategory_enum: [
        "Lesson Planning",
        "Lesson Delivery",
        "Engagement",
        "Evaluation",
      ],
      subject_enum: [
        "Phonics",
        "English",
        "Math",
        "Science",
        "Biology",
        "Chemistry",
        "Physics",
        "Earth Science",
        "History",
        "Geography",
        "Music",
        "Arts",
        "ICT",
        "PE",
        "Global Perspective",
        "Circle Time",
        "Break Time",
        "STEAM",
      ],
      user_role_enum: ["Teacher", "Admin", "Parent", "Student", "Other"],
    },
  },
} as const
