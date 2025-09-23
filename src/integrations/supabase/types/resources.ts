import type { Json, PublicEnums } from "./base";

export type ClassesRow = {
  category: string | null;
  created_at: string | null;
  current_enrollment: number | null;
  description: string | null;
  duration_hours: number | null;
  end_date: string | null;
  id: string;
  image_url: string | null;
  instructor_id: string | null;
  instructor_name: string | null;
  level: string | null;
  max_capacity: number | null;
  meeting_link: string | null;
  meeting_schedule: string | null;
  start_date: string | null;
  status: PublicEnums["class_status"] | null;
  title: string;
  updated_at: string | null;
};

export type ClassesInsert = {
  category?: string | null;
  created_at?: string | null;
  current_enrollment?: number | null;
  description?: string | null;
  duration_hours?: number | null;
  end_date?: string | null;
  id?: string;
  image_url?: string | null;
  instructor_id?: string | null;
  instructor_name?: string | null;
  level?: string | null;
  max_capacity?: number | null;
  meeting_link?: string | null;
  meeting_schedule?: string | null;
  start_date?: string | null;
  status?: PublicEnums["class_status"] | null;
  title: string;
  updated_at?: string | null;
};

export type ClassesUpdate = {
  category?: string | null;
  created_at?: string | null;
  current_enrollment?: number | null;
  description?: string | null;
  duration_hours?: number | null;
  end_date?: string | null;
  id?: string;
  image_url?: string | null;
  instructor_id?: string | null;
  instructor_name?: string | null;
  level?: string | null;
  max_capacity?: number | null;
  meeting_link?: string | null;
  meeting_schedule?: string | null;
  start_date?: string | null;
  status?: PublicEnums["class_status"] | null;
  title?: string;
  updated_at?: string | null;
};

export type ClassesRelationships = [];

export type CommentsRow = {
  content: string;
  content_id: string | null;
  created_at: string | null;
  id: string;
  parent_id: string | null;
  updated_at: string | null;
  user_id: string | null;
};

export type CommentsInsert = {
  content: string;
  content_id?: string | null;
  created_at?: string | null;
  id?: string;
  parent_id?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
};

export type CommentsUpdate = {
  content?: string;
  content_id?: string | null;
  created_at?: string | null;
  id?: string;
  parent_id?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
};

export type CommentsRelationships = [
  {
    foreignKeyName: "comments_content_id_fkey";
    columns: ["content_id"];
    isOneToOne: false;
    referencedRelation: "content_master";
    referencedColumns: ["id"];
  },
  {
    foreignKeyName: "comments_parent_id_fkey";
    columns: ["parent_id"];
    isOneToOne: false;
    referencedRelation: "comments";
    referencedColumns: ["id"];
  },
];

export type ContentMasterRow = {
  /** Normalized author profile (name, bio, avatar, etc.). */
  author: Json | null;
  author_image: string | null;
  author_job_title: string | null;
  category: PublicEnums["category_enum"] | null;
  /** Portable content blocks used to render the page body. */
  content: Json | null;
  content_type: PublicEnums["content_type_enum"];
  created_at: string | null;
  deleted_at: string | null;
  delivery_type: PublicEnums["delivery_type_enum"] | null;
  end_datetime: string | null;
  event_capacity: number | null;
  event_certificate_pd: boolean | null;
  event_duration: string | null;
  event_host: string | null;
  event_language: string | null;
  event_mode: PublicEnums["event_mode_enum"] | null;
  event_price_type: PublicEnums["event_price_type_enum"] | null;
  event_registered: number | null;
  event_timezone: string | null;
  event_type: PublicEnums["event_type_enum"] | null;
  excerpt: string | null;
  featured_image: string | null;
  filter_type: PublicEnums["filter_type_enum"] | null;
  id: string;
  is_published: boolean | null;
  keywords: string[] | null;
  language: string | null;
  meta_description: string | null;
  meta_title: string | null;
  page: PublicEnums["page_enum"];
  payment: PublicEnums["payment_enum"] | null;
  platform: PublicEnums["platform_enum"] | null;
  price: number | null;
  published_at: string | null;
  read_time: number | null;
  recording_url: string | null;
  registration_url: string | null;
  slug: string;
  stage: PublicEnums["stage_enum"] | null;
  start_datetime: string | null;
  status: "draft" | "pending" | "approved" | "published";
  subject: PublicEnums["subject_enum"] | null;
  subtitle: string | null;
  tags: string[] | null;
  time_required: string | null;
  title: string;
  updated_at: string | null;
  venue: string | null;
};
export type ContentMasterInsert = {
  /** Normalized author profile (name, bio, avatar, etc.). */
  author?: Json | null;
  author_image?: string | null;
  author_job_title?: string | null;
  category?: PublicEnums["category_enum"] | null;
  /** Portable content blocks used to render the page body. */
  content?: Json | null;
  content_type: PublicEnums["content_type_enum"];
  created_at?: string | null;
  deleted_at?: string | null;
  delivery_type?: PublicEnums["delivery_type_enum"] | null;
  end_datetime?: string | null;
  event_capacity?: number | null;
  event_certificate_pd?: boolean | null;
  event_duration?: string | null;
  event_host?: string | null;
  event_language?: string | null;
  event_mode?: PublicEnums["event_mode_enum"] | null;
  event_price_type?: PublicEnums["event_price_type_enum"] | null;
  event_registered?: number | null;
  event_timezone?: string | null;
  event_type?: PublicEnums["event_type_enum"] | null;
  excerpt?: string | null;
  featured_image?: string | null;
  filter_type?: PublicEnums["filter_type_enum"] | null;
  id?: string;
  is_published?: boolean | null;
  keywords?: string[] | null;
  language?: string | null;
  meta_description?: string | null;
  meta_title?: string | null;
  page: PublicEnums["page_enum"];
  payment?: PublicEnums["payment_enum"] | null;
  platform?: PublicEnums["platform_enum"] | null;
  price?: number | null;
  published_at?: string | null;
  read_time?: number | null;
  recording_url?: string | null;
  registration_url?: string | null;
  slug: string;
  stage?: PublicEnums["stage_enum"] | null;
  start_datetime?: string | null;
  status?: "draft" | "pending" | "approved" | "published";
  subject?: PublicEnums["subject_enum"] | null;
  subtitle?: string | null;
  tags?: string[] | null;
  time_required?: string | null;
  title: string;
  updated_at?: string | null;
  venue?: string | null;
};
export type ContentMasterUpdate = {
  /** Normalized author profile (name, bio, avatar, etc.). */
  author?: Json | null;
  author_image?: string | null;
  author_job_title?: string | null;
  category?: PublicEnums["category_enum"] | null;
  /** Portable content blocks used to render the page body. */
  content?: Json | null;
  content_type?: PublicEnums["content_type_enum"];
  created_at?: string | null;
  deleted_at?: string | null;
  delivery_type?: PublicEnums["delivery_type_enum"] | null;
  end_datetime?: string | null;
  event_capacity?: number | null;
  event_certificate_pd?: boolean | null;
  event_duration?: string | null;
  event_host?: string | null;
  event_language?: string | null;
  event_mode?: PublicEnums["event_mode_enum"] | null;
  event_price_type?: PublicEnums["event_price_type_enum"] | null;
  event_registered?: number | null;
  event_timezone?: string | null;
  event_type?: PublicEnums["event_type_enum"] | null;
  excerpt?: string | null;
  featured_image?: string | null;
  filter_type?: PublicEnums["filter_type_enum"] | null;
  id?: string;
  is_published?: boolean | null;
  keywords?: string[] | null;
  language?: string | null;
  meta_description?: string | null;
  meta_title?: string | null;
  page?: PublicEnums["page_enum"] | null;
  payment?: PublicEnums["payment_enum"] | null;
  platform?: PublicEnums["platform_enum"] | null;
  price?: number | null;
  published_at?: string | null;
  read_time?: number | null;
  recording_url?: string | null;
  registration_url?: string | null;
  slug?: string;
  stage?: PublicEnums["stage_enum"] | null;
  start_datetime?: string | null;
  status?: "draft" | "pending" | "approved" | "published";
  subject?: PublicEnums["subject_enum"] | null;
  subtitle?: string | null;
  tags?: string[] | null;
  time_required?: string | null;
  title?: string;
  updated_at?: string | null;
  venue?: string | null;
};
export type ContentMasterRelationships = [];

export type EnrollmentsRow = {
  class_id: string;
  created_at: string | null;
  enrolled_at: string | null;
  id: string;
  last_accessed: string | null;
  notes: string | null;
  progress: number | null;
  status: PublicEnums["enrollment_status"] | null;
  updated_at: string | null;
  user_id: string;
};

export type EnrollmentsInsert = {
  class_id: string;
  created_at?: string | null;
  enrolled_at?: string | null;
  id?: string;
  last_accessed?: string | null;
  notes?: string | null;
  progress?: number | null;
  status?: PublicEnums["enrollment_status"] | null;
  updated_at?: string | null;
  user_id: string;
};

export type EnrollmentsUpdate = {
  class_id?: string;
  created_at?: string | null;
  enrolled_at?: string | null;
  id?: string;
  last_accessed?: string | null;
  notes?: string | null;
  progress?: number | null;
  status?: PublicEnums["enrollment_status"] | null;
  updated_at?: string | null;
  user_id?: string;
};

export type EnrollmentsRelationships = [
  {
    foreignKeyName: "enrollments_class_id_fkey";
    columns: ["class_id"];
    isOneToOne: false;
    referencedRelation: "classes";
    referencedColumns: ["id"];
  },
];

export type FaqRow = {
  answer: string;
  created_at: string | null;
  display_order: number | null;
  id: string;
  is_published: boolean | null;
  page: PublicEnums["page_enum"] | null;
  question: string;
  tags: string[] | null;
  updated_at: string | null;
};

export type FaqInsert = {
  answer: string;
  created_at?: string | null;
  display_order?: number | null;
  id?: string;
  is_published?: boolean | null;
  page?: PublicEnums["page_enum"] | null;
  question: string;
  tags?: string[] | null;
  updated_at?: string | null;
};

export type FaqUpdate = {
  answer?: string;
  created_at?: string | null;
  display_order?: number | null;
  id?: string;
  is_published?: boolean | null;
  page?: PublicEnums["page_enum"] | null;
  question?: string;
  tags?: string[] | null;
  updated_at?: string | null;
};

export type FaqRelationships = [];

export type ResourcesRow = {
  approved_at: string | null;
  approved_by: string | null;
  created_at: string | null;
  created_by: string | null;
  creator_id: string | null;
  description: string | null;
  format: string | null;
  grade_level: string | null;
  id: string;
  instructional_notes: string | null;
  is_active: boolean | null;
  resource_type: string | null;
  stage: string | null;
  status: string | null;
  storage_path: string | null;
  subject: string | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  title: string;
  type: string | null;
  updated_at: string | null;
  url: string | null;
};

export type ResourcesInsert = {
  approved_at?: string | null;
  approved_by?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  creator_id?: string | null;
  description?: string | null;
  format?: string | null;
  grade_level?: string | null;
  id?: string;
  instructional_notes?: string | null;
  is_active?: boolean | null;
  resource_type?: string | null;
  stage?: string | null;
  status?: string | null;
  storage_path?: string | null;
  subject?: string | null;
  tags?: string[] | null;
  thumbnail_url?: string | null;
  title: string;
  type?: string | null;
  updated_at?: string | null;
  url?: string | null;
};

export type ResourcesUpdate = {
  approved_at?: string | null;
  approved_by?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  creator_id?: string | null;
  description?: string | null;
  format?: string | null;
  grade_level?: string | null;
  id?: string;
  instructional_notes?: string | null;
  is_active?: boolean | null;
  resource_type?: string | null;
  stage?: string | null;
  status?: string | null;
  storage_path?: string | null;
  subject?: string | null;
  tags?: string[] | null;
  thumbnail_url?: string | null;
  title?: string;
  type?: string | null;
  updated_at?: string | null;
  url?: string | null;
};

export type ResourcesRelationships = [];

export type TestimonialsRow = {
  consent: boolean | null;
  content: string;
  created_at: string | null;
  email: string | null;
  id: string;
  is_featured: boolean | null;
  job_title: string | null;
  name: string;
  organization: string | null;
  page: PublicEnums["page_enum"] | null;
  rating: number | null;
  related_content_id: string | null;
  updated_at: string | null;
};

export type TestimonialsInsert = {
  consent?: boolean | null;
  content: string;
  created_at?: string | null;
  email?: string | null;
  id?: string;
  is_featured?: boolean | null;
  job_title?: string | null;
  name: string;
  organization?: string | null;
  page?: PublicEnums["page_enum"] | null;
  rating?: number | null;
  related_content_id?: string | null;
  updated_at?: string | null;
};

export type TestimonialsUpdate = {
  consent?: boolean | null;
  content?: string;
  created_at?: string | null;
  email?: string | null;
  id?: string;
  is_featured?: boolean | null;
  job_title?: string | null;
  name?: string;
  organization?: string | null;
  page?: PublicEnums["page_enum"] | null;
  rating?: number | null;
  related_content_id?: string | null;
  updated_at?: string | null;
};

export type TestimonialsRelationships = [
  {
    foreignKeyName: "testimonials_related_content_id_fkey";
    columns: ["related_content_id"];
    isOneToOne: false;
    referencedRelation: "content_master";
    referencedColumns: ["id"];
  },
];

export type ResourceTables = {
  classes: {
    Row: ClassesRow;
    Insert: ClassesInsert;
    Update: ClassesUpdate;
    Relationships: ClassesRelationships;
  };
  comments: {
    Row: CommentsRow;
    Insert: CommentsInsert;
    Update: CommentsUpdate;
    Relationships: CommentsRelationships;
  };
  content_master: {
    Row: ContentMasterRow;
    Insert: ContentMasterInsert;
    Update: ContentMasterUpdate;
    Relationships: ContentMasterRelationships;
  };
  enrollments: {
    Row: EnrollmentsRow;
    Insert: EnrollmentsInsert;
    Update: EnrollmentsUpdate;
    Relationships: EnrollmentsRelationships;
  };
  faq: {
    Row: FaqRow;
    Insert: FaqInsert;
    Update: FaqUpdate;
    Relationships: FaqRelationships;
  };
  resources: {
    Row: ResourcesRow;
    Insert: ResourcesInsert;
    Update: ResourcesUpdate;
    Relationships: ResourcesRelationships;
  };
  testimonials: {
    Row: TestimonialsRow;
    Insert: TestimonialsInsert;
    Update: TestimonialsUpdate;
    Relationships: TestimonialsRelationships;
  };
};
