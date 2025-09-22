import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../../_lib/http";
import { recordAuditLog } from "../../../_lib/audit";
import { requireAdmin } from "../../../_lib/auth";
import { createNotification } from "../../../_lib/notifications";

interface ModerationPayload {
  id?: string;
}

interface BlogPostRecord {
  id: string;
  status?: string | null;
  author_id?: string | null;
  created_by?: string | null;
  title?: string | null;
}

function resolveAuthorId(record: BlogPostRecord): string | null {
  return record.author_id ?? record.created_by ?? null;
}

export default async function handler(request: Request): Promise<Response> {
  if (normalizeMethod(request.method) !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const context = await requireAdmin(request);
  if (context instanceof Response) {
    return context;
  }

  const payload = (await parseJsonBody<ModerationPayload>(request)) ?? {};
  const postId = typeof payload.id === "string" ? payload.id.trim() : "";

  if (postId.length === 0) {
    return errorResponse(400, "A blog post id is required");
  }

  const { supabase, user } = context;
  let existingResult = await supabase
    .from<BlogPostRecord>("blog_posts")
    .select("id, status, author_id, created_by, title")
    .eq("id", postId)
    .maybeSingle();

  if (existingResult.error) {
    existingResult = await supabase
      .from<BlogPostRecord>("blog_posts")
      .select("id, status, title")
      .eq("id", postId)
      .maybeSingle();
  }

  if (existingResult.error) {
    return errorResponse(500, "Failed to load blog post");
  }

  if (!existingResult.data) {
    return errorResponse(404, "Blog post not found");
  }

  const now = new Date().toISOString();
  const updateResult = await supabase
    .from("blog_posts")
    .update({
      status: "rejected",
      approved_by: user.id,
      approved_at: now,
    })
    .eq("id", postId)
    .select("id, status, approved_by, approved_at")
    .maybeSingle();

  if (updateResult.error || !updateResult.data) {
    return errorResponse(500, "Failed to reject blog post");
  }

  const authorId = resolveAuthorId(existingResult.data);
  if (authorId) {
    await createNotification(
      authorId,
      "blogpost_approved",
      {
        postId,
        title: existingResult.data.title ?? null,
        status: "rejected",
        previousStatus: existingResult.data.status ?? null,
      },
      { sendEmail: false }
    );
  }

  await recordAuditLog(supabase, {
    action: "admin.moderation.blogposts.reject",
    actorId: user.id,
    targetId: postId,
    metadata: {
      previousStatus: existingResult.data.status ?? null,
    },
  });

  return jsonResponse({ success: true, post: updateResult.data });
}
