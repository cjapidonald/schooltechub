export const SUBJECTS = [
  "English",
  "Math",
  "Science",
  "History",
  "Geography",
  "ICT",
  "Arts",
  "PE",
  "ESL",
] as const;

export type Subject = (typeof SUBJECTS)[number];
