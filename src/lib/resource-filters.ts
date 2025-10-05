export const RESOURCE_TYPE_OPTIONS = [
  "Worksheet",
  "Video",
  "Interactive",
  "Presentation",
  "Assessment",
  "Article",
  "Audio",
  "Game",
  "Template",
  "Other",
] as const;

export const RESOURCE_SUBJECT_OPTIONS = [
  "Math",
  "Science",
  "English",
  "Social Studies",
  "STEM",
  "ICT",
  "Arts",
  "Languages",
] as const;

export const RESOURCE_STAGE_OPTIONS = [
  "Early Childhood",
  "Primary",
  "Lower Secondary",
  "Upper Secondary",
  "Higher Education",
] as const;

export const RESOURCE_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most-tagged", label: "Most tags" },
  { value: "title", label: "Title A–Z" },
] as const;

export type ResourceSortOption = (typeof RESOURCE_SORT_OPTIONS)[number];
export type ResourceSortOptionValue = ResourceSortOption["value"];
