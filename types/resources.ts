export type ResourceStatus = "draft" | "published" | "archived";
export type ResourceVisibility = "private" | "unlisted" | "public";

export interface ResourceRecord {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  url: string;
  normalized_url: string;
  domain: string;
  favicon_url: string | null;
  thumbnail_url: string | null;
  resource_type: string | null;
  subjects: string[] | null;
  topics: string[] | null;
  tags: string[] | null;
  instructional_notes: string | null;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  created_at: string;
  updated_at: string;
}

export interface ResourceCard {
  id: string;
  title: string;
  description: string | null;
  url: string;
  domain: string;
  faviconUrl: string | null;
  thumbnailUrl: string | null;
  resourceType: string | null;
  subjects: string[];
  topics: string[];
  tags: string[];
  instructionalNotes: string | null;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceListResponse {
  items: ResourceCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextPage: number | null;
}
