import type { PublicEnums } from "./base";

export type AdminRolesRow = {
  granted_at: string | null;
  granted_by: string | null;
  id: string;
  role: string;
  user_id: string;
};

export type AdminRolesInsert = {
  granted_at?: string | null;
  granted_by?: string | null;
  id?: string;
  role?: string;
  user_id: string;
};

export type AdminRolesUpdate = {
  granted_at?: string | null;
  granted_by?: string | null;
  id?: string;
  role?: string;
  user_id?: string;
};

export type AdminRolesRelationships = [];

export type NewsletterSubscribersRow = {
  audience: string | null;
  created_at: string | null;
  email: string;
  full_name: string | null;
  id: string;
  job_position: string | null;
  locale: string | null;
  name: string | null;
  role: PublicEnums["user_role_enum"] | null;
  segments: string[] | null;
  status: string | null;
  subscribed_at: string | null;
};

export type NewsletterSubscribersInsert = {
  audience?: string | null;
  created_at?: string | null;
  email: string;
  full_name?: string | null;
  id?: string;
  job_position?: string | null;
  locale?: string | null;
  name?: string | null;
  role?: PublicEnums["user_role_enum"] | null;
  segments?: string[] | null;
  status?: string | null;
  subscribed_at?: string | null;
};

export type NewsletterSubscribersUpdate = {
  audience?: string | null;
  created_at?: string | null;
  email?: string;
  full_name?: string | null;
  id?: string;
  job_position?: string | null;
  locale?: string | null;
  name?: string | null;
  role?: PublicEnums["user_role_enum"] | null;
  segments?: string[] | null;
  status?: string | null;
  subscribed_at?: string | null;
};

export type NewsletterSubscribersRelationships = [];

export type ProfilesRow = {
  created_at: string | null;
  email: string | null;
  full_name: string | null;
  id: string;
  role: PublicEnums["user_role_enum"] | null;
  school_logo_url: string | null;
  school_name: string | null;
  updated_at: string | null;
};

export type ProfilesInsert = {
  created_at?: string | null;
  email?: string | null;
  full_name?: string | null;
  id: string;
  role?: PublicEnums["user_role_enum"] | null;
  school_logo_url?: string | null;
  school_name?: string | null;
  updated_at?: string | null;
};

export type ProfilesUpdate = {
  created_at?: string | null;
  email?: string | null;
  full_name?: string | null;
  id?: string;
  role?: PublicEnums["user_role_enum"] | null;
  school_logo_url?: string | null;
  school_name?: string | null;
  updated_at?: string | null;
};

export type ProfilesRelationships = [];

export type AccountTables = {
  admin_roles: {
    Row: AdminRolesRow;
    Insert: AdminRolesInsert;
    Update: AdminRolesUpdate;
    Relationships: AdminRolesRelationships;
  };
  newsletter_subscribers: {
    Row: NewsletterSubscribersRow;
    Insert: NewsletterSubscribersInsert;
    Update: NewsletterSubscribersUpdate;
    Relationships: NewsletterSubscribersRelationships;
  };
  profiles: {
    Row: ProfilesRow;
    Insert: ProfilesInsert;
    Update: ProfilesUpdate;
    Relationships: ProfilesRelationships;
  };
};
