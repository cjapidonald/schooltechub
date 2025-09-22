/**
 * Shared representation of a learning resource stored in the public catalog.
 */
export type ResourceStatus = "pending" | "approved" | "rejected";

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
  /** External URL for the resource when supplied by the creator. */
  url: string | null;
  /** Relative storage path if the asset is stored in Supabase. */
  storage_path: string | null;
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
  /** Moderation status of the resource within the catalog. */
  status: ResourceStatus;
  /** Identifier of the admin who approved the resource, if applicable. */
  approved_by: string | null;
  /** Timestamp when the resource was approved, if applicable. */
  approved_at: string | null;
  /** Indicates whether the resource is currently visible to users. */
  is_active: boolean;
}
