import { supabase } from "@/integrations/supabase/client";

const FORMAT_EXTENSION: Record<"pdf" | "docx", string> = {
  pdf: "pdf",
  docx: "docx",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export async function downloadPlanExport(
  planId: string,
  format: "pdf" | "docx",
  title: string,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  let accessToken: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token ?? null;
  } catch (error) {
    console.warn("Unable to verify Supabase session before download", error);
  }

  const fileNameBase = slugify(title) || "lesson-plan";
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`/api/lesson-plans/${planId}/export.${FORMAT_EXTENSION[format]}`, {
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => null);
    throw new Error(message || "Failed to download lesson plan export.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileNameBase}.${FORMAT_EXTENSION[format]}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
