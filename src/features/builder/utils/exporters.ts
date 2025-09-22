import type { BuilderState } from "../types";
import type { LinkHealthStatus } from "../api/linkHealth";

const formatResourceLink = (label: string, url: string | undefined | null) => {
  const safeLabel = label.trim() || (url?.trim() ? url : "Resource");
  if (url && url.trim().length > 0) {
    return `[${safeLabel}](${url.trim()})`;
  }
  return safeLabel;
};

const formatStep = (index: number, step: BuilderState["steps"][number], includeOffline: boolean) => {
  const lines = [`${index + 1}. ${step.title} (${step.durationMinutes} min)`];
  if (step.goal) lines.push(`Learning goal: ${step.goal}`);
  if (step.grouping) lines.push(`Grouping: ${step.grouping}`);
  if (step.deliveryMode) lines.push(`Delivery mode: ${step.deliveryMode}`);
  if (step.notes) lines.push(`Instructional notes: ${step.notes}`);
  if (step.tags.length) lines.push(`Tags: ${step.tags.join(", ")}`);
  if (includeOffline && step.offlineFallback) {
    lines.push(`Offline fallback: ${step.offlineFallback}`);
  }
  if (step.resources.length) {
    lines.push("Resources:");
    for (const resource of step.resources) {
      lines.push(`  - ${formatResourceLink(resource.label, resource.url)}`);
    }
  }
  return lines.join("\n");
};

export const generateTeacherExport = (state: BuilderState, linkLookup: Record<string, LinkHealthStatus>) => {
  const header = [
    `Lesson: ${state.title}`,
    state.objective ? `Learning objective: ${state.objective}` : null,
    state.stage ? `Stage: ${state.stage}` : null,
    state.subject ? `Subject: ${state.subject}` : null,
    state.lessonDate ? `Date: ${state.lessonDate}` : null,
    state.schoolLogoUrl ? `School logo: ${formatResourceLink("View logo", state.schoolLogoUrl)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const warnings: string[] = [];
  Object.values(linkLookup).forEach(status => {
    if (!status?.isHealthy) {
      warnings.push(`⚠️ ${status.url} (${status.statusText ?? "Unavailable"})`);
    }
  });

  const steps = state.steps.map((step, index) => formatStep(index, step, true)).join("\n\n");

  return [header, warnings.length ? "Link warnings:\n" + warnings.join("\n") : null, "Steps:", steps]
    .filter(Boolean)
    .join("\n\n");
};

export const generateStudentExport = (state: BuilderState) => {
  const headerLines = [
    `Lesson: ${state.title}`,
    state.lessonDate ? `Date: ${state.lessonDate}` : null,
    state.schoolLogoUrl ? `School logo: ${formatResourceLink("View logo", state.schoolLogoUrl)}` : null,
  ].filter(Boolean);
  const header = headerLines.join("\n");
  const steps = state.steps
    .map((step, index) => formatStep(index, step, false))
    .join("\n\n");
  return [header, "Steps:", steps].filter(Boolean).join("\n\n");
};

export const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
