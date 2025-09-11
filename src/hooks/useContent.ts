import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HubType = 'tools' | 'learn' | 'evidence' | 'community' | 'services' | 'about';
export type ContentType = 
  | 'tool' | 'template' | 'tutorial' | 'teaching_technique' | 'activity' 
  | 'lesson_plan' | 'teacher_tip' | 'blog' | 'case_study' | 'research' 
  | 'research_question' | 'event' | 'course' | 'consulting' | 'student_project' | 'news';

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  hub: HubType;
  content_type: ContentType;
  stages?: string[] | null;
  subjects?: string[] | null;
  group_sizes?: string[] | null;
  cost?: 'free' | 'freemium' | 'paid' | null;
  duration_minutes?: number | null;
  tags?: string[] | null;
  language?: string | null;
  translations?: any;
  author?: any;
  media?: any[];
  body?: any;
  seo?: any;
  status: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  tool_meta?: any;
  activity_meta?: any;
  event_meta?: any;
  created_at: string;
  updated_at: string;
}

interface UseContentOptions {
  hub?: HubType;
  contentTypes?: ContentType[];
  stages?: string[];
  subjects?: string[];
  groupSizes?: string[];
  cost?: ('free' | 'freemium' | 'paid')[];
  tags?: string[];
  searchTerm?: string;
  limit?: number;
}

export function useContent(options: UseContentOptions = {}) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [JSON.stringify(options)]);

  async function fetchContent() {
    try {
      setLoading(true);
      let query = supabase
        .from('content')
        .select('*')
        .eq('status', 'published');

      if (options.hub) {
        query = query.eq('hub', options.hub);
      }

      if (options.contentTypes && options.contentTypes.length > 0) {
        query = query.in('content_type', options.contentTypes);
      }

      if (options.stages && options.stages.length > 0) {
        query = query.overlaps('stages', options.stages);
      }

      if (options.subjects && options.subjects.length > 0) {
        query = query.overlaps('subjects', options.subjects);
      }

      if (options.groupSizes && options.groupSizes.length > 0) {
        query = query.overlaps('group_sizes', options.groupSizes);
      }

      if (options.cost && options.cost.length > 0) {
        query = query.in('cost', options.cost);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options.searchTerm) {
        query = query.or(`title.ilike.%${options.searchTerm}%,body->>'teaser'.ilike.%${options.searchTerm}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('published_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setContent(data || []);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }

  return { content, loading, error, refetch: fetchContent };
}