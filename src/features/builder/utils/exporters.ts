import type { BuilderState } from "../types";
import type { LinkHealthStatus } from "../api/linkHealth";

const formatStep = (
  index: number,
  step: BuilderState["steps"][number],
  options: { includeOffline?: boolean } = {},
) => {
  const { includeOffline = false } = options;
  const lines = [`${index + 1}. ${step.title}${step.duration ? ` (${step.duration})` : ""}`];
  if (step.learningGoals) lines.push(`Learning goals: ${step.learningGoals}`);
  if (step.grouping) lines.push(`Grouping: ${step.grouping}`);
  if (step.deliveryMode) lines.push(`Delivery: ${step.deliveryMode}`);
  if (includeOffline) {
    const fallback = step.notes?.trim();
    lines.push(
      `Offline fallback: ${fallback && fallback.length ? fallback : "Plan an analog alternative if technology is unavailable."}`,
    );
  }
  if (step.resources.length) {
    lines.push("Resources:");
    for (const resource of step.resources) {
      lines.push(`  - ${resource.title}: ${resource.url}`);
      if (resource.instructionalNotes) {
        lines.push(`      Notes: ${resource.instructionalNotes}`);
      }
    }
  }
  return lines.join("\n");
};

export const generateTeacherExport = (state: BuilderState, linkLookup: Record<string, LinkHealthStatus>) => {
  const header = [
    `Lesson: ${state.title}`,
    state.objective ? `Objective: ${state.objective}` : null,
    state.stage ? `Stage: ${state.stage}` : null,
    state.subject ? `Subject: ${state.subject}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const warnings: string[] = [];
  Object.values(linkLookup).forEach(status => {
    if (!status?.isHealthy) {
      warnings.push(`⚠️ ${status.url} (${status.statusText ?? "Unavailable"})`);
    }
  });

  const steps = state.steps.map((step, index) => formatStep(index, step, { includeOffline: true })).join("\n\n");

  return [header, warnings.length ? "Link warnings:\n" + warnings.join("\n") : null, "Steps:", steps]
    .filter(Boolean)
    .join("\n\n");
};

export const generateStudentExport = (state: BuilderState) => {
  const header = `Lesson: ${state.title}`;
  const steps = state.steps
    .map((step, index) => formatStep(index, step, { includeOffline: false }))
    .join("\n\n");
  return [header, "Steps:", steps].join("\n\n");
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
