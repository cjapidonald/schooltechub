import type { Database } from "@/integrations/supabase/types";

interface TextChild {
  text: string;
  bold?: boolean;
}

interface ContentBlock {
  type: "paragraph" | "heading" | "image" | "youtube";
  level?: number;
  children?: TextChild[];
  src?: string;
  alt?: string;
  caption?: string;
  videoId?: string;
}

interface AuthorInfo {
  name?: string | null;
  job_title?: string | null;
}

type BlogPostRow = Database["public"]["Tables"]["blogs"]["Row"] & {
  subtitle?: string | null;
  author_name?: string | null;
  time_required?: string | null;
  language?: string | null;
  is_pinned?: boolean | null;
};

export type SampleBlogPost = BlogPostRow & {
  author?: AuthorInfo | null;
  content: ContentBlock[];
};

export const SAMPLE_BLOG_POSTS: SampleBlogPost[] = [
  {
    id: "sample-ai-coteacher",
    title: "How an AI Co-Teacher Personalizes Every Classroom",
    subtitle: "Inside a pilot program where teachers collaborate with AI for differentiated instruction.",
    slug: "ai-co-teacher-personalizes-classrooms",
    excerpt:
      "Discover how Ms. Saunders uses an AI planning assistant to map out weekly lessons, surface intervention groups, and keep families in the loop.",
    category: "eduTech",
    tags: ["AI", "Differentiation", "Planning"],
    keywords: ["secondary", "science", "ai"],
    featured_image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        type: "heading",
        level: 2,
        children: [{ text: "Where the AI Co-Teacher Fits In" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "Ms. Saunders begins every Monday by launching an AI workspace that collects benchmark data, formative checks, and anecdotal notes into one dashboard. The assistant highlights which students are ready to move ahead with inquiry labs and which need targeted reteaches, saving her hours of spreadsheet wrangling.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "During planning, the AI proposes three differentiated pathways for the upcoming unit. Saunders selects the resources that align to state standards, and the assistant automatically maps them to a shared family newsletter. Parents receive concrete examples of vocabulary, guiding questions, and at-home extension ideas tailored to their child’s group.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [{ text: "What Students Experience" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "In the classroom, learners rotate through mini-workshops while the AI quietly monitors exit tickets. When a misconception spikes, Saunders receives a gentle notification prompting a quick clarification or a hands-on demo. The flow feels more conversational than scripted, letting her focus on coaching and celebrating growth.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "At the end of each week the assistant drafts a reflection summary. Saunders can accept it as-is or edit the language before it is published to student portfolios. Families love the specific shout-outs, and Saunders appreciates that documentation no longer eats into her weekends.",
          },
        ],
      },
    ],
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
      "https://images.unsplash.com/photo-1580894908361-967195033215?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        type: "heading",
        level: 2,
        children: [{ text: "Setting the Stage for Safe Exploration" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "The lesson opens with a tactile warm-up where students pass around real shells and coral replicas. Before anyone wears a headset, the class practices the VR safety cues using paper goggles. This quick rehearsal calms nerves and builds excitement without overwhelming first-time explorers.",
          },
        ],
      },
      { 
        type: "paragraph",
        children: [
          {
            text:
              "While half the class dives into the virtual reef, the other half completes observation sketches at an analog station. The teacher circulates between groups, using the AI-generated prompts on a tablet to ask guiding questions tailored to each student’s journal responses.",
          },
        ],
      },
      {
        type: "youtube",
        videoId: "TVLqVTtCneE",
      },
      {
        type: "heading",
        level: 3,
        children: [{ text: "Reflection that Sparks Transfer" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "Students close the session by recording a 30-second audio postcard describing one discovery and one wonder. These clips are auto-transcribed and sent to families alongside a prompt for dinner-table conversations. Teachers report that the postcards become artifacts for later writing workshops and science talks.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "A follow-up station the next day encourages learners to remix their VR observations into a collaborative mural. Combining digital immersion with hands-on synthesis keeps the novelty grounded in core literacy and science practices.",
          },
        ],
      },
    ],
    author: { name: "Ritika Menon", job_title: "Primary Innovation Coach" },
    author_name: "Ritika Menon",
    author_image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    created_at: "2024-01-22T14:10:00Z",
    published_at: "2024-01-22T14:10:00Z",
    updated_at: "2024-01-22T14:10:00Z",
    is_published: true,
    read_time: 6,
    is_pinned: true,
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
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        type: "heading",
        level: 2,
        children: [{ text: "Launching with Clear Agreements" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "The seventh-grade humanities team co-designed a privacy charter with students before inviting families onto the new portal. Learners decided which types of drafts could be shared publicly, which required a passcode, and how peers should respond to feedback threads.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "During project launch week, students posted mission statements and inquiry questions. Teachers uploaded rubrics and mini-lesson replays so families could see what success looked like. The transparency reduced the volume of email check-ins and let conferences focus on strategy rather than status updates.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [{ text: "Keeping Momentum Through Showcases" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "Every Friday the portal automatically assembled a highlight reel of photos, quick wins, and student voice notes. Families could react with applause emojis or leave questions that teachers triaged before Monday. The analytics dashboard made it easy to spot who needed additional outreach.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "At exhibition night, the team projected the live portal feed so visitors could follow each project’s arc from proposal to final reflection. The shared documentation built confidence across the community and set a new baseline for authentic family partnership in future units.",
          },
        ],
      },
    ],
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
  {
    id: "sample-stem-labs",
    title: "Running Low-Lift STEM Labs with Recycled Materials",
    subtitle: "Keep experimentation alive even when budgets are tight.",
    slug: "low-lift-stem-labs-recycled-materials",
    excerpt:
      "See how a fifth-grade team uses a rolling makerspace cart, student captains, and quick reflection cards to make weekly STEM labs manageable.",
    category: "tips",
    tags: ["STEM", "Makerspace", "Sustainability"],
    keywords: ["primary", "science", "design"],
    featured_image:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        type: "heading",
        level: 2,
        children: [{ text: "A Cart that Keeps Supplies Mobile" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "The team repurposed a library cart into a mobile makerspace stocked with labeled bins for cardboard, connectors, and student-built tools. Each Friday a rotating crew of student captains checks inventory and leaves sticky note requests for the community donation box.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "During lab time the cart rolls between classrooms so every group gets rapid access to materials without long transition breaks. The simple system keeps setup under five minutes and lets teachers focus on facilitating inquiry instead of hunting for supplies.",
          },
        ],
      },
      {
        type: "heading",
        level: 3,
        children: [{ text: "Reflection that Builds Momentum" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "Before clean-up, teams jot one win and one wonder onto color-coded reflection cards. Captains snap quick photos for the class blog so families can replicate the experiments at home using everyday recyclables.",
          },
        ],
      },
    ],
    author: { name: "Luis Ortega", job_title: "STEM Integration Coach" },
    author_name: "Luis Ortega",
    author_image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    created_at: "2023-11-10T11:20:00Z",
    published_at: "2023-11-10T11:20:00Z",
    updated_at: "2023-11-10T11:20:00Z",
    is_published: true,
    read_time: 5,
    is_pinned: true,
    view_count: 1675,
    language: null,
  },
  {
    id: "sample-ai-ethics-roundtable",
    title: "Leading Student AI Ethics Roundtables",
    subtitle: "Protocols for future-ready discussions in secondary classrooms.",
    slug: "student-ai-ethics-roundtables",
    excerpt:
      "Facilitate meaningful AI ethics conversations with scenario cards, collaborative norms, and artifact-based reflection tasks.",
    category: "teacherDebates",
    tags: ["AI", "Citizenship", "Discussion"],
    keywords: ["secondary", "ethics", "debate"],
    featured_image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        type: "heading",
        level: 2,
        children: [{ text: "Scenario Cards that Center Student Voice" }],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "Students begin by reviewing AI scenario cards that range from adaptive grading to predictive policing. Mixed-role groups identify the people impacted and surface potential blind spots before debating a stance.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "Facilitators use a simple norm tracker projected on the board to make sure every voice enters the conversation twice. When dialogue stalls, students consult curated research snippets to ground opinions in evidence.",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text:
              "Roundtables close with students composing a public-facing reflection that captures how their thinking shifted and what additional data they would gather before advising school leaders.",
          },
        ],
      },
    ],
    author: { name: "Maya Thompson", job_title: "Digital Citizenship Lead" },
    author_name: "Maya Thompson",
    author_image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    created_at: "2023-10-02T08:40:00Z",
    published_at: "2023-10-02T08:40:00Z",
    updated_at: "2023-10-02T08:40:00Z",
    is_published: true,
    read_time: 7,
    is_pinned: false,
    view_count: 1892,
    language: null,
  },
];

