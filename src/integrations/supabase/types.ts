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
      activities: {
        Row: {
          created_at: string
          delivery_modes: Database["public"]["Enums"]["lesson_delivery_mode"][]
          description: string | null
          duration_minutes: number | null
          id: string
          materials: string[]
          metadata: Json
          owner_id: string
          resource_domain: string | null
          resource_url: string | null
          share_code: string
          shared_with: string[]
          slug: string
          stage: Database["public"]["Enums"]["lesson_stage"]
          subjects: string[]
          summary: string | null
          technology_tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_modes?: Database["public"]["Enums"]["lesson_delivery_mode"][]
          description?: string | null
          duration_minutes?: number | null
          id?: string
          materials?: string[]
          metadata?: Json
          owner_id: string
          resource_domain?: string | null
          resource_url?: string | null
          share_code?: string
          shared_with?: string[]
          slug: string
          stage: Database["public"]["Enums"]["lesson_stage"]
          subjects?: string[]
          summary?: string | null
          technology_tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_modes?: Database["public"]["Enums"]["lesson_delivery_mode"][]
          description?: string | null
          duration_minutes?: number | null
          id?: string
          materials?: string[]
          metadata?: Json
          owner_id?: string
          resource_domain?: string | null
          resource_url?: string | null
          share_code?: string
          shared_with?: string[]
          slug?: string
          stage?: Database["public"]["Enums"]["lesson_stage"]
          subjects?: string[]
          summary?: string | null
          technology_tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          content: string
          content_id: string | null
          created_at: string | null
          id: string
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          content_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          content_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_master"
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
          age_grade: string | null
          audience: string | null
          author: Json | null
          author_image: string | null
          author_job_title: string | null
          billing: Database["public"]["Enums"]["billing_enum"] | null
          bloom_level: Database["public"]["Enums"]["bloom_enum"] | null
          case_study_tags: string | null
          category: Database["public"]["Enums"]["category_enum"] | null
          content: Json | null
          content_type: Database["public"]["Enums"]["content_type_enum"]
          created_at: string | null
          currency: string | null
          curriculum_alignment: string | null
          data_compliance: string | null
          deliverables: string | null
          delivery_type:
            | Database["public"]["Enums"]["delivery_type_enum"]
            | null
          device_os: string | null
          diary_type: string | null
          end_datetime: string | null
          engagement_features: string | null
          event_capacity: number | null
          event_certificate_pd: boolean | null
          event_duration: string | null
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
          faq_json: Json | null
          featured_image: string | null
          file_format: string | null
          filter_type: Database["public"]["Enums"]["filter_type_enum"] | null
          forum_category: string | null
          guarantee: string | null
          id: string
          idea_tips: string | null
          is_published: boolean | null
          keywords: string[] | null
          language: string | null
          language_level:
            | Database["public"]["Enums"]["language_level_enum"]
            | null
          learning_goals: string | null
          license: string | null
          login_method: string | null
          materials_devices: string | null
          meta_description: string | null
          meta_title: string | null
          mood: string | null
          newsletter_segment: string | null
          page: Database["public"]["Enums"]["page_enum"]
          payment: Database["public"]["Enums"]["payment_enum"] | null
          platform: Database["public"]["Enums"]["platform_enum"] | null
          prep_level: string | null
          price: number | null
          published_at: string | null
          read_time: number | null
          recording_url: string | null
          registration_url: string | null
          research_question_tags: string | null
          research_type: string | null
          resource_type:
            | Database["public"]["Enums"]["resource_type_enum"]
            | null
          service_model:
            | Database["public"]["Enums"]["service_model_enum"]
            | null
          sla_tier: Database["public"]["Enums"]["sla_tier_enum"] | null
          slug: string
          stage: Database["public"]["Enums"]["stage_enum"] | null
          standards_other: string | null
          start_datetime: string | null
          subject: Database["public"]["Enums"]["subject_enum"] | null
          subtitle: string | null
          tags: string[] | null
          testimonials_json: Json | null
          time_required: string | null
          title: string
          translation_of: string | null
          updated_at: string | null
          venue: string | null
          view_count: number | null
        }
        Insert: {
          age_grade?: string | null
          audience?: string | null
          author?: Json | null
          author_image?: string | null
          author_job_title?: string | null
          billing?: Database["public"]["Enums"]["billing_enum"] | null
          bloom_level?: Database["public"]["Enums"]["bloom_enum"] | null
          case_study_tags?: string | null
          category?: Database["public"]["Enums"]["category_enum"] | null
          content?: Json | null
          content_type: Database["public"]["Enums"]["content_type_enum"]
          created_at?: string | null
          currency?: string | null
          curriculum_alignment?: string | null
          data_compliance?: string | null
          deliverables?: string | null
          delivery_type?:
            | Database["public"]["Enums"]["delivery_type_enum"]
            | null
          device_os?: string | null
          diary_type?: string | null
          end_datetime?: string | null
          engagement_features?: string | null
          event_capacity?: number | null
          event_certificate_pd?: boolean | null
          event_duration?: string | null
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
          faq_json?: Json | null
          featured_image?: string | null
          file_format?: string | null
          filter_type?: Database["public"]["Enums"]["filter_type_enum"] | null
          forum_category?: string | null
          guarantee?: string | null
          id?: string
          idea_tips?: string | null
          is_published?: boolean | null
          keywords?: string[] | null
          language?: string | null
          language_level?:
            | Database["public"]["Enums"]["language_level_enum"]
            | null
          learning_goals?: string | null
          license?: string | null
          login_method?: string | null
          materials_devices?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mood?: string | null
          newsletter_segment?: string | null
          page: Database["public"]["Enums"]["page_enum"]
          payment?: Database["public"]["Enums"]["payment_enum"] | null
          platform?: Database["public"]["Enums"]["platform_enum"] | null
          prep_level?: string | null
          price?: number | null
          published_at?: string | null
          read_time?: number | null
          recording_url?: string | null
          registration_url?: string | null
          research_question_tags?: string | null
          research_type?: string | null
          resource_type?:
            | Database["public"]["Enums"]["resource_type_enum"]
            | null
          service_model?:
            | Database["public"]["Enums"]["service_model_enum"]
            | null
          sla_tier?: Database["public"]["Enums"]["sla_tier_enum"] | null
          slug: string
          stage?: Database["public"]["Enums"]["stage_enum"] | null
          standards_other?: string | null
          start_datetime?: string | null
          subject?: Database["public"]["Enums"]["subject_enum"] | null
          subtitle?: string | null
          tags?: string[] | null
          testimonials_json?: Json | null
          time_required?: string | null
          title: string
          translation_of?: string | null
          updated_at?: string | null
          venue?: string | null
          view_count?: number | null
        }
        Update: {
          age_grade?: string | null
          audience?: string | null
          author?: Json | null
          author_image?: string | null
          author_job_title?: string | null
          billing?: Database["public"]["Enums"]["billing_enum"] | null
          bloom_level?: Database["public"]["Enums"]["bloom_enum"] | null
          case_study_tags?: string | null
          category?: Database["public"]["Enums"]["category_enum"] | null
          content?: Json | null
          content_type?: Database["public"]["Enums"]["content_type_enum"]
          created_at?: string | null
          currency?: string | null
          curriculum_alignment?: string | null
          data_compliance?: string | null
          deliverables?: string | null
          delivery_type?:
            | Database["public"]["Enums"]["delivery_type_enum"]
            | null
          device_os?: string | null
          diary_type?: string | null
          end_datetime?: string | null
          engagement_features?: string | null
          event_capacity?: number | null
          event_certificate_pd?: boolean | null
          event_duration?: string | null
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
          faq_json?: Json | null
          featured_image?: string | null
          file_format?: string | null
          filter_type?: Database["public"]["Enums"]["filter_type_enum"] | null
          forum_category?: string | null
          guarantee?: string | null
          id?: string
          idea_tips?: string | null
          is_published?: boolean | null
          keywords?: string[] | null
          language?: string | null
          language_level?:
            | Database["public"]["Enums"]["language_level_enum"]
            | null
          learning_goals?: string | null
          license?: string | null
          login_method?: string | null
          materials_devices?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mood?: string | null
          newsletter_segment?: string | null
          page?: Database["public"]["Enums"]["page_enum"]
          payment?: Database["public"]["Enums"]["payment_enum"] | null
          platform?: Database["public"]["Enums"]["platform_enum"] | null
          prep_level?: string | null
          price?: number | null
          published_at?: string | null
          read_time?: number | null
          recording_url?: string | null
          registration_url?: string | null
          research_question_tags?: string | null
          research_type?: string | null
          resource_type?:
            | Database["public"]["Enums"]["resource_type_enum"]
            | null
          service_model?:
            | Database["public"]["Enums"]["service_model_enum"]
            | null
          sla_tier?: Database["public"]["Enums"]["sla_tier_enum"] | null
          slug?: string
          stage?: Database["public"]["Enums"]["stage_enum"] | null
          standards_other?: string | null
          start_datetime?: string | null
          subject?: Database["public"]["Enums"]["subject_enum"] | null
          subtitle?: string | null
          tags?: string[] | null
          testimonials_json?: Json | null
          time_required?: string | null
          title?: string
          translation_of?: string | null
          updated_at?: string | null
          venue?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_master_translation_of_fkey"
            columns: ["translation_of"]
            isOneToOne: false
            referencedRelation: "content_master"
            referencedColumns: ["id"]
          },
        ]
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
      lesson_plans: {
        Row: {
          created_at: string
          delivery_modes: Database["public"]["Enums"]["lesson_delivery_mode"][]
          duration_minutes: number | null
          grade_levels: string[]
          id: string
          notes: string | null
          overview: Json
          owner_id: string
          published_at: string | null
          search_vector: unknown
          share_code: string
          shared_with: string[]
          slug: string
          stage: Database["public"]["Enums"]["lesson_stage"] | null
          status: string
          subjects: string[]
          summary: string | null
          tags: string[]
          technology_tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_modes?: Database["public"]["Enums"]["lesson_delivery_mode"][]
          duration_minutes?: number | null
          grade_levels?: string[]
          id?: string
          notes?: string | null
          overview?: Json
          owner_id: string
          published_at?: string | null
          search_vector?: unknown
          share_code?: string
          shared_with?: string[]
          slug: string
          stage?: Database["public"]["Enums"]["lesson_stage"] | null
          status?: string
          subjects?: string[]
          summary?: string | null
          tags?: string[]
          technology_tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_modes?: Database["public"]["Enums"]["lesson_delivery_mode"][]
          duration_minutes?: number | null
          grade_levels?: string[]
          id?: string
          notes?: string | null
          overview?: Json
          owner_id?: string
          published_at?: string | null
          search_vector?: unknown
          share_code?: string
          shared_with?: string[]
          slug?: string
          stage?: Database["public"]["Enums"]["lesson_stage"] | null
          status?: string
          subjects?: string[]
          summary?: string | null
          tags?: string[]
          technology_tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          plan_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          plan_id: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          plan_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_sections_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_standards: {
        Row: {
          aligned_at: string
          created_at: string
          is_primary: boolean
          plan_id: string
          standard_id: string
          updated_at: string
        }
        Insert: {
          aligned_at?: string
          created_at?: string
          is_primary?: boolean
          plan_id: string
          standard_id: string
          updated_at?: string
        }
        Update: {
          aligned_at?: string
          created_at?: string
          is_primary?: boolean
          plan_id?: string
          standard_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_standards_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_steps: {
        Row: {
          activity_id: string | null
          created_at: string
          delivery_modes: Database["public"]["Enums"]["lesson_delivery_mode"][]
          duration_minutes: number | null
          id: string
          instructions: string | null
          materials: string[]
          position: number
          resource_domain: string | null
          resource_url: string | null
          section_id: string
          stage: Database["public"]["Enums"]["lesson_stage"] | null
          technology_tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          delivery_modes?: Database["public"]["Enums"]["lesson_delivery_mode"][]
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          materials?: string[]
          position?: number
          resource_domain?: string | null
          resource_url?: string | null
          section_id: string
          stage?: Database["public"]["Enums"]["lesson_stage"] | null
          technology_tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          delivery_modes?: Database["public"]["Enums"]["lesson_delivery_mode"][]
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          materials?: string[]
          position?: number
          resource_domain?: string | null
          resource_url?: string | null
          section_id?: string
          stage?: Database["public"]["Enums"]["lesson_stage"] | null
          technology_tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_steps_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_steps_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "lesson_plan_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          plan_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          snapshot: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      standards: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          framework: string
          grade_band: string | null
          id: string
          subject: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework: string
          grade_band?: string | null
          id?: string
          subject?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework?: string
          grade_band?: string | null
          id?: string
          subject?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role_enum"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "testimonials_related_content_id_fkey"
            columns: ["related_content_id"]
            isOneToOne: false
            referencedRelation: "content_master"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lesson_plan_permissions: {
        Row: {
          owner_id: string
          plan_id: string
          share_code: string
          shared_with: string[]
          status: string
        }
      }
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
      lesson_delivery_mode:
        | "in-person"
        | "blended"
        | "online"
        | "project-based"
        | "flipped"
      lesson_stage:
        | "early childhood"
        | "elementary"
        | "middle school"
        | "high school"
        | "adult learners"
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
