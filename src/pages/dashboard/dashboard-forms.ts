import { z } from "zod";

export const classSchema = z.object({
  title: z.string().min(2),
  stage: z.string().optional(),
  subject: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const curriculumSchema = z.object({
  title: z.string().min(3),
  class_id: z.string().uuid(),
  subject: z.string().min(2),
  academic_year: z.string().optional(),
  lesson_titles: z.string().min(3),
});

export type ClassFormValues = z.infer<typeof classSchema>;
export type CurriculumFormValues = z.infer<typeof curriculumSchema>;
