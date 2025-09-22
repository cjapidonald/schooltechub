export interface ResourceRecord {
  id: string;
  title: string;
  url: string;
  description: string | null;
  tags: string[] | null;
  resource_type: string | null;
  subject: string | null;
  grade_level: string | null;
  format: string | null;
  instructional_notes: string | null;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceCard {
  id: string;
  title: string;
  description: string | null;
  url: string;
  tags: string[];
  resourceType: string | null;
  subject: string | null;
  gradeLevel: string | null;
  format: string | null;
  instructionalNotes: string | null;
  creatorId: string | null;
  creatorName: string | null;
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
