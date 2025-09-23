import type { Json } from "./base";

export type BuilderActivityFavoritesRow = {
  activity_slug: string | null;
  anon_user_id: string | null;
  created_at: string | null;
  id: string;
  user_id: string | null;
};

export type BuilderActivityFavoritesInsert = {
  activity_slug?: string | null;
  anon_user_id?: string | null;
  created_at?: string | null;
  id?: string;
  user_id?: string | null;
};

export type BuilderActivityFavoritesUpdate = {
  activity_slug?: string | null;
  anon_user_id?: string | null;
  created_at?: string | null;
  id?: string;
  user_id?: string | null;
};

export type BuilderActivityFavoritesRelationships = [
  {
    foreignKeyName: "builder_activity_favorites_activity_slug_fkey";
    columns: ["activity_slug"];
    isOneToOne: false;
    referencedRelation: "tools_activities";
    referencedColumns: ["slug"];
  },
];

export type BuilderActivityRecentsRow = {
  activity_slug: string | null;
  anon_user_id: string | null;
  id: string;
  last_viewed: string | null;
  /** Snapshot of the activity used to render recents without refetching. */
  metadata: Json | null;
  user_id: string | null;
};

export type BuilderActivityRecentsInsert = {
  activity_slug?: string | null;
  anon_user_id?: string | null;
  id?: string;
  last_viewed?: string | null;
  /** Snapshot of the activity used to render recents without refetching. */
  metadata?: Json | null;
  user_id?: string | null;
};

export type BuilderActivityRecentsUpdate = {
  activity_slug?: string | null;
  anon_user_id?: string | null;
  id?: string;
  last_viewed?: string | null;
  /** Snapshot of the activity used to render recents without refetching. */
  metadata?: Json | null;
  user_id?: string | null;
};

export type BuilderActivityRecentsRelationships = [
  {
    foreignKeyName: "builder_activity_recents_activity_slug_fkey";
    columns: ["activity_slug"];
    isOneToOne: false;
    referencedRelation: "tools_activities";
    referencedColumns: ["slug"];
  },
];

export type BuilderCollectionItemsRow = {
  activity_slug: string | null;
  collection_id: string | null;
  created_at: string | null;
  id: string;
  position: number | null;
};

export type BuilderCollectionItemsInsert = {
  activity_slug?: string | null;
  collection_id?: string | null;
  created_at?: string | null;
  id?: string;
  position?: number | null;
};

export type BuilderCollectionItemsUpdate = {
  activity_slug?: string | null;
  collection_id?: string | null;
  created_at?: string | null;
  id?: string;
  position?: number | null;
};

export type BuilderCollectionItemsRelationships = [
  {
    foreignKeyName: "builder_collection_items_activity_slug_fkey";
    columns: ["activity_slug"];
    isOneToOne: false;
    referencedRelation: "tools_activities";
    referencedColumns: ["slug"];
  },
  {
    foreignKeyName: "builder_collection_items_collection_id_fkey";
    columns: ["collection_id"];
    isOneToOne: false;
    referencedRelation: "builder_collections";
    referencedColumns: ["id"];
  },
];

export type BuilderCollectionsRow = {
  anon_user_id: string | null;
  created_at: string | null;
  description: string | null;
  id: string;
  name: string;
  updated_at: string | null;
  user_id: string | null;
};

export type BuilderCollectionsInsert = {
  anon_user_id?: string | null;
  created_at?: string | null;
  description?: string | null;
  id?: string;
  name: string;
  updated_at?: string | null;
  user_id?: string | null;
};

export type BuilderCollectionsUpdate = {
  anon_user_id?: string | null;
  created_at?: string | null;
  description?: string | null;
  id?: string;
  name?: string;
  updated_at?: string | null;
  user_id?: string | null;
};

export type BuilderCollectionsRelationships = [];

export type BuilderLessonPlansRow = {
  anon_user_id: string;
  created_at: string | null;
  /** Serialized lesson plan data produced by the builder UI. */
  data: Json | null;
  id: string;
  title: string | null;
  updated_at: string | null;
};

export type BuilderLessonPlansInsert = {
  anon_user_id: string;
  created_at?: string | null;
  /** Serialized lesson plan data produced by the builder UI. */
  data?: Json | null;
  id?: string;
  title?: string | null;
  updated_at?: string | null;
};

export type BuilderLessonPlansUpdate = {
  anon_user_id?: string;
  created_at?: string | null;
  /** Serialized lesson plan data produced by the builder UI. */
  data?: Json | null;
  id?: string;
  title?: string | null;
  updated_at?: string | null;
};

export type BuilderLessonPlansRelationships = [];

export type BuilderLinkHealthReportsRow = {
  created_at: string | null;
  id: string;
  is_healthy: boolean | null;
  last_checked: string | null;
  last_error: string | null;
  status_code: number | null;
  status_text: string | null;
  updated_at: string | null;
  url: string;
};

export type BuilderLinkHealthReportsInsert = {
  created_at?: string | null;
  id?: string;
  is_healthy?: boolean | null;
  last_checked?: string | null;
  last_error?: string | null;
  status_code?: number | null;
  status_text?: string | null;
  updated_at?: string | null;
  url: string;
};

export type BuilderLinkHealthReportsUpdate = {
  created_at?: string | null;
  id?: string;
  is_healthy?: boolean | null;
  last_checked?: string | null;
  last_error?: string | null;
  status_code?: number | null;
  status_text?: string | null;
  updated_at?: string | null;
  url?: string;
};

export type BuilderLinkHealthReportsRelationships = [];

export type BuilderResourceLinksRow = {
  created_at: string | null;
  id: string;
  is_healthy: boolean | null;
  last_checked: string | null;
  last_error: string | null;
  status_code: number | null;
  status_text: string | null;
  updated_at: string | null;
  url: string;
};

export type BuilderResourceLinksInsert = {
  created_at?: string | null;
  id?: string;
  is_healthy?: boolean | null;
  last_checked?: string | null;
  last_error?: string | null;
  status_code?: number | null;
  status_text?: string | null;
  updated_at?: string | null;
  url: string;
};

export type BuilderResourceLinksUpdate = {
  created_at?: string | null;
  id?: string;
  is_healthy?: boolean | null;
  last_checked?: string | null;
  last_error?: string | null;
  status_code?: number | null;
  status_text?: string | null;
  updated_at?: string | null;
  url?: string;
};

export type BuilderResourceLinksRelationships = [];

export type ToolsActivitiesRow = {
  created_at: string | null;
  description: string | null;
  duration_minutes: number | null;
  grade_levels: string[] | null;
  instructions: string | null;
  learning_objectives: string[] | null;
  materials: string[] | null;
  name: string;
  slug: string;
  subjects: string[] | null;
  tags: string[] | null;
  updated_at: string | null;
};

export type ToolsActivitiesInsert = {
  created_at?: string | null;
  description?: string | null;
  duration_minutes?: number | null;
  grade_levels?: string[] | null;
  instructions?: string | null;
  learning_objectives?: string[] | null;
  materials?: string[] | null;
  name: string;
  slug: string;
  subjects?: string[] | null;
  tags?: string[] | null;
  updated_at?: string | null;
};

export type ToolsActivitiesUpdate = {
  created_at?: string | null;
  description?: string | null;
  duration_minutes?: number | null;
  grade_levels?: string[] | null;
  instructions?: string | null;
  learning_objectives?: string[] | null;
  materials?: string[] | null;
  name?: string;
  slug?: string;
  subjects?: string[] | null;
  tags?: string[] | null;
  updated_at?: string | null;
};

export type ToolsActivitiesRelationships = [];

export type BuilderTables = {
  builder_activity_favorites: {
    Row: BuilderActivityFavoritesRow;
    Insert: BuilderActivityFavoritesInsert;
    Update: BuilderActivityFavoritesUpdate;
    Relationships: BuilderActivityFavoritesRelationships;
  };
  builder_activity_recents: {
    Row: BuilderActivityRecentsRow;
    Insert: BuilderActivityRecentsInsert;
    Update: BuilderActivityRecentsUpdate;
    Relationships: BuilderActivityRecentsRelationships;
  };
  builder_collection_items: {
    Row: BuilderCollectionItemsRow;
    Insert: BuilderCollectionItemsInsert;
    Update: BuilderCollectionItemsUpdate;
    Relationships: BuilderCollectionItemsRelationships;
  };
  builder_collections: {
    Row: BuilderCollectionsRow;
    Insert: BuilderCollectionsInsert;
    Update: BuilderCollectionsUpdate;
    Relationships: BuilderCollectionsRelationships;
  };
  builder_lesson_plans: {
    Row: BuilderLessonPlansRow;
    Insert: BuilderLessonPlansInsert;
    Update: BuilderLessonPlansUpdate;
    Relationships: BuilderLessonPlansRelationships;
  };
  builder_link_health_reports: {
    Row: BuilderLinkHealthReportsRow;
    Insert: BuilderLinkHealthReportsInsert;
    Update: BuilderLinkHealthReportsUpdate;
    Relationships: BuilderLinkHealthReportsRelationships;
  };
  builder_resource_links: {
    Row: BuilderResourceLinksRow;
    Insert: BuilderResourceLinksInsert;
    Update: BuilderResourceLinksUpdate;
    Relationships: BuilderResourceLinksRelationships;
  };
  tools_activities: {
    Row: ToolsActivitiesRow;
    Insert: ToolsActivitiesInsert;
    Update: ToolsActivitiesUpdate;
    Relationships: ToolsActivitiesRelationships;
  };
};
