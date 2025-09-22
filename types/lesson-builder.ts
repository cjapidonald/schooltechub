export function mergeStandardValues(
  values: Partial<LessonBuilderStandard>
): LessonBuilderStandard {
  return {
    id: values.id ?? cryptoRandomId("std"),
    code: ensureString(values.code) ?? "STD",
    description: ensureString(values.description) ?? "Standard",
    domain: ensureString(values.domain),
    subject: ensureString(values.subject),
    gradeLevels: ensureStringArray(values.gradeLevels),
  };
}

export function mergeActivityValues(
  values: Partial<LessonBuilderActivity>
): LessonBuilderActivity {
  return {
    id: values.id ?? cryptoRandomId("act"),
    title: ensureString(values.title) ?? "Untitled Activity",
    summary: ensureString(values.summary),
    subjects: ensureStringArray(values.subjects),
    gradeLevels: ensureStringArray(values.gradeLevels),
    durationMinutes:
      typeof values.durationMinutes === "number" && Number.isFinite(values.durationMinutes)
        ? Math.max(0, Math.trunc(values.durationMinutes))
        : null,
    sourceUrl: ensureString(values.sourceUrl),
    tags: ensureStringArray(values.tags),
  };
}

export function mergeResourceValues(
  values: Partial<LessonBuilderStepResource>
): LessonBuilderStepResource {
  const base = (typeof values === "object" && values !== null ? values : {}) as Record<string, unknown>;
  const url = ensureString(base.url) ?? "";
  const label = ensureString(base.label) ?? ensureString(base.title) ?? "Resource";

  return {
    ...base,
    id: ensureString(base.id) ?? cryptoRandomId("res"),
    label,
    url,
    type: ensureString(base.type),
    thumbnail: ensureString(base.thumbnail),
    domain: ensureString(base.domain) ?? (url ? extractDomain(url) : null),
  } as LessonBuilderStepResource;
}

export function mergeStepValues(
  values: Partial<LessonBuilderStep>
): LessonBuilderStep {
  const base = values as Record<string, unknown>;
  const normalizedDescription = ensureString(values.description);
  const learningGoals =
    ensureString((base.learningGoals as string | undefined) ?? (base.learning_goals as string | undefined)) ??
    normalizedDescription;
  const durationText =
    ensureString((base.duration as string | undefined) ?? (base.durationText as string | undefined)) ??
    (typeof values.durationMinutes === "number" && Number.isFinite(values.durationMinutes)
      ? String(Math.max(0, Math.trunc(values.durationMinutes)))
      : null);
  const grouping = ensureString(base.grouping as string | undefined);
  const delivery =
    ensureString((base.delivery as string | undefined) ?? (base.deliveryMode as string | undefined)) ??
    null;
  const notes =
    ensureString(values.notes) ??
    ensureString((base.instructionalNote as string | undefined) ?? (base.instructional_note as string | undefined));

  return {
    id: values.id ?? cryptoRandomId("step"),
    title: ensureString(values.title) ?? "",
    description: learningGoals ?? normalizedDescription,
    learningGoals,
    durationMinutes:
      typeof values.durationMinutes === "number" && Number.isFinite(values.durationMinutes)
        ? Math.max(0, Math.trunc(values.durationMinutes))
        : null,
    duration: durationText,
    grouping,
    delivery,
    notes,
    activities: Array.isArray(values.activities)
      ? values.activities.map((activity) => mergeActivityValues(activity))
      : [],
    resources: Array.isArray((base.resources as unknown[] | undefined))
      ? (base.resources as unknown[]).map((resource) => mergeResourceValues(resource as Partial<LessonBuilderStepResource>))
      : [],
  };
}

export function cryptoRandomId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}