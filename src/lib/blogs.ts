import { supabase } from "@/integrations/supabase/client";
import { createFileIdentifier } from "@/lib/files";
import type { Database } from "@/integrations/supabase/types";

export const BLOG_IMAGE_BUCKET = "blog-images";

export interface BlogLinkInput {
  label?: string | null;
  url?: string | null;
}

export interface BlogSubmissionPayload {
  userId: string;
  title: string;
  authorName: string;
  body: string;
  excerpt?: string;
  links?: BlogLinkInput[];
  featuredImageUrl?: string | null;
}

type BlogRow = Database["public"]["Tables"]["blogs"]["Row"];

export async function uploadBlogImage(userId: string, file: File): Promise<{ publicUrl: string; path: string }> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const identifier = createFileIdentifier();
  const filePath = `${userId}/blog-images/${identifier}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BLOG_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(filePath);

  return { publicUrl, path: filePath };
}

export async function submitBlogDraft(payload: BlogSubmissionPayload): Promise<BlogRow> {
  const title = payload.title.trim();
  if (!title) {
    throw new Error("A title is required");
  }

  const slug = await generateUniqueSlug(title);
  const excerpt = buildExcerpt(payload.excerpt ?? payload.body);
  const content = buildContentDocument(payload.body, payload.links ?? []);
  const authorName = payload.authorName.trim() || "Anonymous";

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title,
      slug,
      excerpt,
      content,
      author: {
        name: authorName,
        user_id: payload.userId,
      },
      featured_image: payload.featuredImageUrl ?? null,
      is_published: false,
      category: "teacher_blog",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to submit blog post");
  }

  return data as BlogRow;
}

export function buildContentDocument(body: string, links: BlogLinkInput[]) {
  const blocks: Array<{ type: string; data?: Record<string, unknown> }> = [];
  const trimmedBody = body.trim();

  if (trimmedBody) {
    const paragraphs = trimmedBody
      .split(/\n{2,}/)
      .map(paragraph => paragraph.trim())
      .filter(Boolean);

    for (const paragraph of paragraphs) {
      blocks.push({
        type: "paragraph",
        data: {
          text: paragraph.replace(/\n/g, "<br>"),
        },
      });
    }
  }

  links
    .filter(link => typeof link?.url === "string" && link.url.trim())
    .forEach(link => {
      const url = link.url!.trim();
      const label = typeof link.label === "string" && link.label.trim() ? link.label.trim() : url;
      blocks.push({
        type: "link",
        data: {
          url,
          label,
        },
      });
    });

  return {
    time: Date.now(),
    version: "1.0",
    blocks,
  };
}

function buildExcerpt(input: string): string | null {
  const value = input.trim();
  if (!value) {
    return null;
  }

  return value.length > 280 ? `${value.slice(0, 277)}...` : value;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || `post-${createFileIdentifier()}`;
  let candidate = base;
  let attempt = 1;

  // Loop until a unique slug is found.
  while (true) {
    const { data, error } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to verify slug availability");
    }

    if (!data) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}
