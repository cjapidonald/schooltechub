/**
 * Shared representation of a resource stored within the Supabase `public.resources` table.
 */
export interface Resource {
  /** Primary identifier for the resource record. */
  id: string;
  /** Short descriptive title for the resource. */
  title: string;
  /** Optional longer-form description of the resource contents. */
  description: string | null;
  /** Absolute or storage-backed URL pointing to the resource asset. */
  url: string;
  /** Resource classification (e.g. worksheet, video, ppt, offline). */
  type: string;
  /** Subject association such as Math, Science, or Social Studies. */
  subject: string | null;
  /** Target learning stage or grade. */
  stage: string | null;
  /** Tags used for categorisation and filtering. */
  tags: string[];
  /** Optional thumbnail or preview image for the resource. */
  thumbnail_url: string | null;
  /** Identifier of the creating user, if tracked. */
  created_by: string | null;
  /** Timestamp when the record was created (ISO 8601). */
  created_at: string;
  /** Indicates whether the resource is currently visible to users. */
  is_active: boolean;
}

/**
 * Attributes accepted when creating a new resource entry.
 */
export interface ResourceCreateInput {
  title: string;
  description?: string | null;
  url: string;
  type: string;
  subject?: string | null;
  stage?: string | null;
  tags?: string[];
  thumbnail_url?: string | null;
  is_active?: boolean;
}

/**
 * Attributes that may be updated on an existing resource entry.
 */
export interface ResourceUpdateInput {
  title?: string;
  description?: string | null;
  url?: string;
  type?: string;
  subject?: string | null;
  stage?: string | null;
  tags?: string[];
  thumbnail_url?: string | null;
  is_active?: boolean;
}
