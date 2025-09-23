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

  const fileNameBase = slugify(title) || "lesson-plan";
  const response = await fetch(`/api/lesson-plans/${planId}/export.${FORMAT_EXTENSION[format]}`, {
    credentials: "include",
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
