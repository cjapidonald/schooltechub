import type { Database } from "@/integrations/supabase/types";

type BlogPostRow = Database["public"]["Tables"]["blogs"]["Row"] & {
  subtitle?: string | null;
  author_name?: string | null;
  author_job_title?: string | null;
  time_required?: string | null;
  language?: string | null;
  is_featured?: boolean | null;
};

type RichTextChild = {
  text: string;
  bold?: boolean;
};

type RichContentBlock =
  | { type: "paragraph"; children: RichTextChild[] }
  | { type: "heading"; level?: number; children: RichTextChild[] }
  | { type: "image"; src: string; alt?: string; caption?: string }
  | { type: "call_to_action"; children: RichTextChild[]; url?: string };

type BlogContent = NonNullable<BlogPostRow["content"]>;

const createContent = (blocks: RichContentBlock[]): BlogContent =>
  blocks as unknown as BlogContent;

export type SampleBlogPost = BlogPostRow & {
  content: BlogContent;
};

export const SAMPLE_BLOG_POSTS: SampleBlogPost[] = [
  {
    id: "sample-ai-coteacher",
    title: "How an AI Co-Teacher Personalizes Every Classroom",
    subtitle:
      "Inside a pilot program where teachers collaborate with AI for differentiated instruction.",
    slug: "ai-co-teacher-personalizes-classrooms",
    excerpt:
      "Discover how Ms. Saunders uses an AI planning assistant to map out weekly lessons, surface intervention groups, and keep families in the loop.",
    category: "eduTech",
    tags: ["AI", "Differentiation", "Planning"],
    keywords: ["secondary", "science", "ai"],
    featured_image:
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
    content: createContent([
      {
        type: "heading",
        level: 2,
        children: [
          {
            text: "Why pair an AI coach with human intuition?",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "When Amelia Saunders introduced an AI planning assistant to her 9th grade science team, the goal wasn't to replace teacher expertise—it was to free time for more of it. The AI drafts lesson frames aligned to the state standards, while Amelia and her colleagues layer in experiments, reflective prompts, and the soft skills their students need most.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [
          {
            text: "A weekly workflow that stays responsive",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "Each Friday, Amelia feeds the assistant formative assessment notes, family concerns, and lab reflections. Within minutes the team receives differentiated small group plans, suggested demos, and a checklist of family messages. Teachers use the recommendations as a starting point, then adjust pacing for upcoming field work and add culturally responsive hooks to keep the unit grounded in students' lived experiences.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [
          {
            text: "Keeping families in the loop without burnout",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "Because the AI drafts family updates tied to each learning target, Amelia simply personalizes tone and student highlights before sending. The result is a warm, weekly window into the classroom that would be impossible to sustain manually. Families report feeling more connected to the work, and teachers report recovering hours they can reinvest in feedback and relationship building.",
          },
        ],
      },
      {
        type: "call_to_action",
        children: [
          {
            text: "Download Amelia's AI planning template and adapt it for your grade level.",
          },
        ],
        url: "https://schooltechub.com/resources/ai-planning-template",
      },
    ]),
    author: { name: "Amelia Saunders", job_title: "Instructional Technologist" },
    author_name: "Amelia Saunders",
    author_image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    created_at: "2024-02-12T09:30:00Z",
    published_at: "2024-02-12T09:30:00Z",
    updated_at: "2024-02-12T09:30:00Z",
    is_published: true,
    read_time: 8,
    view_count: 1430,
    language: null,
  },
  {
    id: "sample-vr-field-trip",
    title: "Designing Virtual Reality Field Trips for Primary Classrooms",
    subtitle: "Step-by-step guidance for building immersive explorations that fit a 40-minute block.",
    slug: "virtual-reality-field-trips-primary",
    excerpt:
      "Learn how educators scaffold VR experiences with inquiry journals, safety checkpoints, and reflection prompts for young learners.",
    category: "teachingTechniques",
    tags: ["VR", "Primary", "Inquiry"],
    keywords: ["primary", "steam", "virtual reality"],
    featured_image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
    content: createContent([
      {
        type: "heading",
        level: 2,
        children: [
          {
            text: "Start with an inquiry question young learners can own",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "Coach Ritika Menon launches every VR field trip by asking students what they already wonder. For a coral reef exploration, questions like ‘How do clownfish hide?’ or ‘Why are reefs bright?’ become the anchor for a shared journal. Students sketch predictions before the headsets ever appear, priming vocabulary and curiosity.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [
          {
            text: "Design rotations that balance awe with accountability",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "Ritika breaks her 40-minute block into four stations: headset exploration, observation drawing, vocabulary building, and safety monitoring. Each station lasts seven minutes, giving students a clear job and reducing downtime. The VR assistant quietly notes who might need support, while the teacher floats to narrate academic language and spotlight collaboration norms.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [
          {
            text: "Reflect, celebrate, and extend",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "After the trip, students return to their inquiry journals to record new discoveries and lingering questions. Families receive a short video recap with student voice clips, plus optional at-home experiments that reuse low-cost materials. The VR experience becomes one chapter in an ongoing project rather than a one-off novelty.",
          },
        ],
      },
      {
        type: "call_to_action",
        children: [
          {
            text: "Grab the VR rotation planner and printable reflection journal Ritika uses every month.",
          },
        ],
        url: "https://schooltechub.com/resources/vr-field-trip-kit",
      },
    ]),
    author: { name: "Ritika Menon", job_title: "Primary Innovation Coach" },
    author_name: "Ritika Menon",
    author_image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    created_at: "2024-01-22T14:10:00Z",
    published_at: "2024-01-22T14:10:00Z",
    updated_at: "2024-01-22T14:10:00Z",
    is_published: true,
    read_time: 6,
    is_featured: true,
    view_count: 980,
    language: null,
  },
  {
    id: "sample-family-portal",
    title: "Building a Family Portal for Project-Based Learning",
    subtitle: "A case study on sharing artefacts, progress, and feedback in real time.",
    slug: "family-portal-project-based-learning",
    excerpt:
      "Follow a middle school team that launched a secure family portal to document PBL milestones, celebrate wins, and streamline conferencing.",
    category: "caseStudy",
    tags: ["Community", "PBL", "Communication"],
    keywords: ["secondary", "english", "project based"],
    featured_image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    content: createContent([
      {
        type: "heading",
        level: 2,
        children: [
          {
            text: "Translate exhibitions into an ongoing narrative",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "Jordan Ellis' team wanted families to witness project milestones as they unfolded. They prototyped a simple portal using shared slides and short video clips. Students upload weekly evidence of progress, and the AI transcription assistant generates quick captions so that multilingual families can access updates without delay.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [
          {
            text: "Build trust with transparent routines",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "Families receive a Friday digest that highlights essential questions, project checkpoints, and learner shout-outs. Because the portal logs teacher feedback, students can reference it during conferences to advocate for next steps. The consistent cadence reduced email volume by 40% and increased family participation in mid-unit reviews.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [
          {
            text: "Scale with student ownership",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "Eighth graders now lead the curation process, choosing artefacts that best illustrate collaboration, revision, and impact. Teachers monitor for quality and privacy, but the storytelling belongs to students. Next year the team plans to embed quick polls so families can signal where they need more insight or support.",
          },
        ],
      },
      {
        type: "call_to_action",
        children: [
          {
            text: "Copy the family portal checklist and privacy agreement that guided Jordan's rollout.",
          },
        ],
        url: "https://schooltechub.com/resources/family-portal-blueprint",
      },
    ]),
    author: { name: "Jordan Ellis", job_title: "Community Partnerships Lead" },
    author_name: "Jordan Ellis",
    author_image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
    created_at: "2023-12-05T17:45:00Z",
    published_at: "2023-12-05T17:45:00Z",
    updated_at: "2023-12-05T17:45:00Z",
    is_published: true,
    read_time: 9,
    view_count: 2110,
    language: null,
  },
];
