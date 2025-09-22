import { errorResponse, jsonResponse, methodNotAllowed } from "../../_lib/http";
import { getSupabaseClient } from "../../_lib/supabase";

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function resolveExtension(file: File): string {
  const parts = file.name?.split?.(".") ?? [];
  const ext = parts.length > 1 ? parts.pop() : null;
  if (ext && ext.length <= 8) {
    return ext.toLowerCase();
  }
  if (file.type && file.type.includes("/")) {
    return file.type.split("/").pop() ?? "bin";
  }
  return "bin";
}

export default async function handler(request: Request): Promise<Response> {
  if (!request.method || request.method.toUpperCase() !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Invalid form data");
  }

  const file = formData.get("file");
  const profileId = formData.get("profileId");

  if (!(file instanceof File)) {
    return errorResponse(400, "A file upload is required");
  }

  if (typeof profileId !== "string" || profileId.trim().length === 0) {
    return errorResponse(400, "A profile identifier is required");
  }

  if (file.type && !file.type.startsWith("image/")) {
    return errorResponse(400, "Only image uploads are supported");
  }

  const supabase = getSupabaseClient();

  const extension = resolveExtension(file);
  const safeName = sanitizeFileName(file.name || "logo");
  const timestamp = Date.now();
  const path = `${profileId}/${timestamp}-${safeName}.${extension}`;

  const uploadResult = await supabase.storage.from("logos").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });

  if (uploadResult.error) {
    return errorResponse(500, "Failed to upload logo");
  }

  const { data: publicUrlData } = supabase.storage.from("logos").getPublicUrl(path);
  const publicUrl = publicUrlData?.publicUrl ?? null;

  const updateResult = await supabase
    .from("profiles")
    .update({ school_logo_url: publicUrl })
    .eq("id", profileId)
    .select("school_logo_url")
    .maybeSingle();

  if (updateResult.error) {
    return errorResponse(500, "Failed to update profile");
  }

  return jsonResponse({ url: publicUrl, path });
}
