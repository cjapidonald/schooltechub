import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { errorResponse, jsonResponse, methodNotAllowed, normalizeMethod } from "../../_lib/http";
import { requireAdmin } from "../../_lib/auth";

interface PendingCounts {
  resources: number;
  blogposts: number;
  researchApplications: number;
}

interface DashboardSummary {
  generatedAt: string;
  pendingModeration: PendingCounts;
  research: {
    activeProjects: number;
  };
  users: {
    newLast7Days: number;
    newLast30Days: number;
  };
  notifications: {
    recentFailedEmails: FailedEmailRecord[];
  };
}

interface FailedEmailRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  type: string;
  createdAt: string;
  payload: unknown;
}

interface NotificationRow {
  id: string;
  user_id: string | null;
  type: string;
  created_at: string;
  payload: unknown;
}

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const { supabase } = context;

  try {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      pendingResourcesResult,
      pendingBlogpostsResult,
      pendingBlogDraftsResult,
      pendingResearchAppsResult,
      activeProjectsResult,
      newUsers7DaysResult,
      newUsers30DaysResult,
    ] = await Promise.all([
      supabase
        .from("resources")
        .select<{ id: string }>("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("content_master")
        .select<{ id: string }>("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in("page", ["research_blog", "edutech", "teacher_diary"]),
      supabase
        .from("blogs")
        .select<{ id: string }>("id", { count: "exact", head: true })
        .eq("is_published", false),
      supabase
        .from("research_applications")
        .select<{ id: string }>("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("research_projects")
        .select<{ id: string }>("id", { count: "exact", head: true })
        .eq("status", "open"),
      supabase
        .from("profiles")
        .select<{ id: string }>("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("profiles")
        .select<{ id: string }>("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
    ]);

    const pendingResources = extractCount(pendingResourcesResult, "pending resources");
    const legacyPendingBlogposts = extractCount(pendingBlogpostsResult, "pending blogposts");
    const pendingBlogDrafts = extractCount(pendingBlogDraftsResult, "pending submitted blogs");
    const pendingBlogposts = legacyPendingBlogposts + pendingBlogDrafts;
    const pendingResearchApps = extractCount(pendingResearchAppsResult, "pending research applications");
    const activeProjects = extractCount(activeProjectsResult, "active research projects");
    const newUsers7Days = extractCount(newUsers7DaysResult, "new users (7 days)");
    const newUsers30Days = extractCount(newUsers30DaysResult, "new users (30 days)");

    const failedEmails = await loadFailedEmails(supabase);

    const payload: DashboardSummary = {
      generatedAt: new Date(now).toISOString(),
      pendingModeration: {
        resources: pendingResources,
        blogposts: pendingBlogposts,
        researchApplications: pendingResearchApps,
      },
      research: {
        activeProjects,
      },
      users: {
        newLast7Days: newUsers7Days,
        newLast30Days: newUsers30Days,
      },
      notifications: {
        recentFailedEmails: failedEmails,
      },
    };

    return jsonResponse(payload, 200, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard metrics";
    return errorResponse(500, message);
  }
}

function extractCount(result: { count: number | null; error: PostgrestError | null }, label: string): number {
  if (result.error) {
    throw new Error(result.error.message || `Failed to count ${label}`);
  }

  return typeof result.count === "number" ? result.count : 0;
}

async function loadFailedEmails(supabase: SupabaseClient): Promise<FailedEmailRecord[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select<NotificationRow>("id,user_id,type,created_at,payload")
    .eq("email_sent", false)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message || "Failed to load notification failures");
  }

  const notifications = data ?? [];

  if (notifications.length === 0) {
    return [];
  }

  const userIds = Array.from(new Set(notifications.map(item => item.user_id).filter((id): id is string => Boolean(id))));

  let profiles = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select<ProfileRow>("id,email,full_name")
      .in("id", userIds);

    if (profileError) {
      throw new Error(profileError.message || "Failed to load user profiles");
    }

    profiles = new Map((profileRows ?? []).map(row => [row.id, row]));
  }

  return notifications.map(notification => {
    const profile = notification.user_id ? profiles.get(notification.user_id) : undefined;
    return {
      id: notification.id,
      userId: notification.user_id,
      userEmail: profile?.email ?? null,
      userName: profile?.full_name ?? null,
      type: notification.type,
      createdAt: notification.created_at,
      payload: notification.payload,
    };
  });
}
