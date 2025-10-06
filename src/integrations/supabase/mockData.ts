import type { Json } from "./types";

export type MockTables = Record<string, any[]>;

const createDate = (value: string) => new Date(value).toISOString();

export const MOCK_USER = {
  id: "example-user",
  email: "TaylorRivera@gmail.com",
  app_metadata: { provider: "email" },
  user_metadata: {
    full_name: "Ms. Taylor Rivera",
    avatar_url: "https://i.pravatar.cc/150?img=47",
  },
};

export const MOCK_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: MOCK_USER,
};

export const mockTables: MockTables = {
  profiles: [
    {
      id: "example-user",
      email: "TaylorRivera@gmail.com",
      salutation: "Ms",
      first_name: "Taylor",
      last_name: "Rivera",
      display_name: "Ms. Taylor Rivera",
      avatar_url: "https://i.pravatar.cc/150?img=47",
      role: "teacher",
      bio: "Year 5 literacy lead who threads technology, family voice, and joyful routines into every unit.",
    },
    {
      id: "student-linh-san",
      email: "linhsan@gmail.com",
      display_name: "Linh San",
      avatar_url: "https://i.pravatar.cc/150?img=12",
      role: "student",
      bio: "Year 5 student in Ms. Rivera's literacy workshop with a passion for storytelling and robotics club.",
    },
  ],
  newsletter_subscribers: [],
  classes: [
    {
      id: "class-1",
      owner_id: "example-user",
      title: "Ms. Rivera's Year 5 Literacy Workshop",
      stage: "Year 5",
      subject: "Literacy & Writing",
      start_date: "2024-09-02",
      end_date: "2025-07-15",
      created_at: createDate("2024-07-01T09:00:00Z"),
    },
    {
      id: "class-2",
      owner_id: "example-user",
      title: "Ms. Rivera's STEAM Enrichment Lab",
      stage: "Year 6",
      subject: "STEM Integration",
      start_date: "2024-09-01",
      end_date: "2025-07-01",
      created_at: createDate("2024-07-05T09:00:00Z"),
    },
  ],
  curricula: [
    {
      id: "curriculum-1",
      owner_id: "example-user",
      class_id: "class-1",
      subject: "English",
      title: "Narrative Writing Mastery",
      academic_year: "2024-2025",
      created_at: createDate("2024-08-19T09:00:00Z"),
    },
  ],
  curriculum_items: [],
  curriculum_lessons: [
    {
      id: "curriculum-lesson-1",
      curriculum_id: "curriculum-1",
      lesson_plan_id: "lesson-plan-1",
      position: 1,
      created_at: createDate("2024-08-25T09:00:00Z"),
    },
  ],
  lesson_plans: [
    {
      id: "lesson-plan-1",
      curriculum_item_id: null,
      title: "Character Perspective Workshop",
      class_id: "class-1",
      stage: "Year 5",
      planned_date: "2024-09-09",
      body_md: "# Lesson Overview\nStudents explore point of view through dramatic retellings.",
      exported_pdf_url: null,
      exported_docx_url: null,
      created_at: createDate("2024-08-20T12:00:00Z"),
      updated_at: createDate("2024-08-20T12:00:00Z"),
    },
    {
      id: "lesson-plan-2",
      curriculum_item_id: null,
      title: "Suspenseful Stories Studio",
      class_id: "class-1",
      stage: "Year 5",
      planned_date: "2024-09-16",
      body_md: "# Learning Goals\nStudents craft tension using pacing and cliffhangers.",
      exported_pdf_url: null,
      exported_docx_url: null,
      created_at: createDate("2024-08-22T12:00:00Z"),
      updated_at: createDate("2024-08-22T12:00:00Z"),
    },
  ],
  lesson_plan_steps: [
    {
      id: "step-1",
      lesson_plan_id: "lesson-plan-1",
      position: 1,
      title: "Warm Up",
      content_md: "Quick think-pair-share on perspective shifts.",
    },
    {
      id: "step-2",
      lesson_plan_id: "lesson-plan-1",
      position: 2,
      title: "Mini Lesson",
      content_md: "Model rewriting a scene from a new viewpoint.",
    },
    {
      id: "step-3",
      lesson_plan_id: "lesson-plan-1",
      position: 3,
      title: "Workshop",
      content_md: "Students collaborate to transform short narratives.",
    },
  ],
  lesson_plan_resources: [
    {
      id: "lpr-1",
      lesson_plan_id: "lesson-plan-1",
      resource_id: "resource-1",
    },
    {
      id: "lpr-2",
      lesson_plan_id: "lesson-plan-1",
      resource_id: "resource-2",
    },
  ],
  class_lesson_plans: [
    {
      id: "class-lesson-plan-1",
      class_id: "class-1",
      lesson_plan_id: "lesson-plan-1",
      status: "published",
      created_at: createDate("2024-08-20T12:00:00Z"),
    },
  ],
  resources: [
    {
      id: "resource-1",
      type: "pdf",
      title: "Character Perspective Graphic Organizer",
      description: "A printable organizer guiding students through multiple points of view.",
      instructions: "Print and distribute to student pairs.",
      url: "https://example.com/resources/character-perspective.pdf",
      file_path: null,
      meta: {
        subject: "English",
        stage: "Year 5",
        keywords: ["writing", "perspective"],
      } satisfies Json,
      created_at: createDate("2024-08-10T10:00:00Z"),
    },
    {
      id: "resource-2",
      type: "video",
      title: "Author Interview: Building Suspense",
      description: "Students analyze how authors use pacing and detail to build tension.",
      instructions: "Watch during the mini lesson and discuss key moves.",
      url: "https://example.com/resources/suspense-video",
      file_path: null,
      meta: {
        subject: "English",
        stage: "Year 5",
        keywords: ["narrative", "storytelling"],
      } satisfies Json,
      created_at: createDate("2024-08-11T10:00:00Z"),
    },
  ],
  resource_shortcuts: [
    {
      id: "shortcut-1",
      resource_id: "resource-1",
      owner_id: "example-user",
      created_at: createDate("2024-08-21T11:00:00Z"),
    },
  ],
  builder_resource_links: [
    {
      id: "builder-link-1",
      owner_id: "example-user",
      title: "Storytelling Article",
      url: "https://example.com/storytelling",
      status: "healthy",
      last_checked_at: createDate("2024-08-01T12:00:00Z"),
      created_at: createDate("2024-07-25T09:00:00Z"),
    },
  ],
  builder_link_health_reports: [
    {
      id: "builder-report-1",
      resource_link_id: "builder-link-1",
      status: "healthy",
      checked_at: createDate("2024-08-01T12:00:00Z"),
      notes: "Link is accessible and loads quickly.",
    },
  ],
  builder_lesson_plans: [
    {
      id: "builder-plan-1",
      owner_id: "example-user",
      title: "Interactive Story Circles",
      subject: "English",
      stage: "Year 5",
      status: "draft",
      content: {
        overview: "Students build stories collaboratively using story circle prompts.",
        essentialQuestion: "How does collaboration improve storytelling?",
        steps: [
          {
            id: "builder-step-1",
            title: "Launch",
            description: "Introduce story circles and brainstorm themes.",
          },
        ],
      },
      updated_at: createDate("2024-08-05T12:00:00Z"),
      created_at: createDate("2024-08-01T09:00:00Z"),
    },
  ],
  builder_collections: [
    {
      id: "collection-1",
      owner_id: "example-user",
      name: "Narrative Hooks",
      description: "Favorite activities for hooking readers.",
      created_at: createDate("2024-07-01T09:00:00Z"),
    },
  ],
  builder_collection_items: [
    {
      id: "collection-item-1",
      collection_id: "collection-1",
      activity_id: "activity-1",
      notes: "Great Monday opener.",
      created_at: createDate("2024-07-02T09:00:00Z"),
    },
  ],
  builder_activity_favorites: [
    {
      id: "favorite-1",
      owner_id: "example-user",
      activity_id: "activity-2",
      created_at: createDate("2024-07-05T10:00:00Z"),
    },
  ],
  builder_activity_recents: [
    {
      id: "recent-1",
      owner_id: "example-user",
      activity_id: "activity-1",
      opened_at: createDate("2024-07-10T08:00:00Z"),
    },
  ],
  tools_activities: [
    {
      id: "activity-1",
      name: "Story Dice Collaboration",
      delivery: "group",
      duration: "30 min",
      skills: ["storytelling", "collaboration"],
      lesson_idea: "Students roll dice to generate characters and settings before writing.",
      setup_time: "Low",
      best_for: "Collaborative writing",
      subject: "English",
      stage: "Year 5",
      created_at: createDate("2024-06-20T09:00:00Z"),
    },
    {
      id: "activity-2",
      name: "Podcast Reflection",
      delivery: "individual",
      duration: "20 min",
      skills: ["speaking", "listening"],
      lesson_idea: "Students record reflections after reading mentor texts.",
      setup_time: "Medium",
      best_for: "Assessment",
      subject: "English",
      stage: "Year 5",
      created_at: createDate("2024-06-22T09:00:00Z"),
    },
  ],
  students: [
    {
      id: "student-linh-san",
      class_id: "class-1",
      first_name: "Linh",
      last_name: "San",
      stage: "Year 5",
      student_email: "linhsan@gmail.com",
      guardian_email: "mai.san@example.com",
      guardian_phone: "+1 555 0110",
      photo_url: "https://i.pravatar.cc/150?img=12",
      created_at: createDate("2024-08-15T09:00:00Z"),
    },
    {
      id: "student-amelia-johnson",
      class_id: "class-1",
      first_name: "Amelia",
      last_name: "Johnson",
      stage: "Year 5",
      guardian_email: "sarah.johnson@example.com",
      guardian_phone: "+1 555 0111",
      photo_url: "https://i.pravatar.cc/150?img=1",
      created_at: createDate("2024-08-15T09:05:00Z"),
    },
    {
      id: "student-oliver-chen",
      class_id: "class-1",
      first_name: "Oliver",
      last_name: "Chen",
      stage: "Year 5",
      guardian_email: "david.chen@example.com",
      guardian_phone: "+1 555 0112",
      photo_url: "https://i.pravatar.cc/150?img=2",
      created_at: createDate("2024-08-15T09:10:00Z"),
    },
    {
      id: "student-ethan-brooks",
      class_id: "class-2",
      first_name: "Ethan",
      last_name: "Brooks",
      stage: "Year 6",
      guardian_email: "guardian.brooks@example.com",
      guardian_phone: "+1 555 0113",
      photo_url: "https://i.pravatar.cc/150?img=4",
      created_at: createDate("2024-08-15T09:15:00Z"),
    },
    {
      id: "student-sofia-hernandez",
      class_id: "class-2",
      first_name: "Sofia",
      last_name: "Hernandez",
      stage: "Year 6",
      guardian_email: "guardian.hernandez@example.com",
      guardian_phone: "+1 555 0114",
      photo_url: "https://i.pravatar.cc/150?img=5",
      created_at: createDate("2024-08-15T09:20:00Z"),
    },
  ],
  enrollments: [
    {
      id: "enrollment-1",
      class_id: "class-1",
      student_id: "student-linh-san",
      status: "active",
      created_at: createDate("2024-08-16T09:00:00Z"),
    },
    {
      id: "enrollment-2",
      class_id: "class-1",
      student_id: "student-amelia-johnson",
      status: "active",
      created_at: createDate("2024-08-16T09:05:00Z"),
    },
    {
      id: "enrollment-3",
      class_id: "class-1",
      student_id: "student-oliver-chen",
      status: "active",
      created_at: createDate("2024-08-16T09:10:00Z"),
    },
    {
      id: "enrollment-4",
      class_id: "class-2",
      student_id: "student-ethan-brooks",
      status: "active",
      created_at: createDate("2024-08-16T09:15:00Z"),
    },
    {
      id: "enrollment-5",
      class_id: "class-2",
      student_id: "student-sofia-hernandez",
      status: "active",
      created_at: createDate("2024-08-16T09:20:00Z"),
    },
  ],
  student_reports: [
    {
      id: "report-1",
      student_id: "student-linh-san",
      class_id: "class-1",
      summary: "Linh leads small-group discussions with empathy and captures vivid details in her narratives.",
      growth_focus: "Encourage her to publish more of her drafts to the family portal without over-editing.",
      created_at: createDate("2024-07-15T12:00:00Z"),
    },
    {
      id: "report-2",
      student_id: "student-amelia-johnson",
      class_id: "class-1",
      summary: "Amelia applies feedback quickly and anchors the storyboard team during project work.",
      growth_focus: "Stretch descriptive vocabulary during independent writing sprints.",
      created_at: createDate("2024-07-16T12:30:00Z"),
    },
    {
      id: "report-3",
      student_id: "student-oliver-chen",
      class_id: "class-1",
      summary: "Oliver is a reflective writer who anchors group discussions with evidence.",
      growth_focus: "Build confidence sharing drafts in whole-class showcases.",
      created_at: createDate("2024-07-17T12:45:00Z"),
    },
    {
      id: "report-4",
      student_id: "student-ethan-brooks",
      class_id: "class-2",
      summary: "Ethan experiments with bold STEM ideas and iterates quickly on prototypes.",
      growth_focus: "Document design decisions more clearly in lab notebooks.",
      created_at: createDate("2024-07-18T13:00:00Z"),
    },
    {
      id: "report-5",
      student_id: "student-sofia-hernandez",
      class_id: "class-2",
      summary: "Sofia excels at peer tutoring and keeps the enrichment lab organized.",
      growth_focus: "Explore advanced coding challenges to extend problem solving.",
      created_at: createDate("2024-07-19T13:15:00Z"),
    },
  ],
  student_behavior_logs: [
    {
      id: "behavior-1",
      student_id: "student-linh-san",
      class_id: "class-1",
      note: "Helped peers troubleshoot story ideas during workshop and captured highlights for the class blog.",
      created_at: createDate("2024-07-18T09:30:00Z"),
    },
    {
      id: "behavior-2",
      student_id: "student-oliver-chen",
      class_id: "class-1",
      note: "Initiated a quiet peer review circle to support classmates' drafts.",
      created_at: createDate("2024-07-19T09:45:00Z"),
    },
    {
      id: "behavior-3",
      student_id: "student-ethan-brooks",
      class_id: "class-2",
      note: "Stayed after club to recalibrate the robotics sensors for the team.",
      created_at: createDate("2024-07-20T10:15:00Z"),
    },
  ],
  student_appraisals: [
    {
      id: "appraisal-1",
      student_id: "student-amelia-johnson",
      class_id: "class-1",
      skill: "Creative Writing",
      rating: 4,
      comment: "Inventive storytelling voice and strong peer collaborator.",
      created_at: createDate("2024-07-20T10:00:00Z"),
    },
    {
      id: "appraisal-2",
      student_id: "student-oliver-chen",
      class_id: "class-1",
      skill: "Reflective Thinking",
      rating: 5,
      comment: "Synthesizes feedback from multiple sources into next-step goals.",
      created_at: createDate("2024-07-21T10:30:00Z"),
    },
    {
      id: "appraisal-3",
      student_id: "student-ethan-brooks",
      class_id: "class-2",
      skill: "STEM Problem Solving",
      rating: 4,
      comment: "Rapid prototyping with strong attention to safety checks.",
      created_at: createDate("2024-07-22T10:45:00Z"),
    },
    {
      id: "appraisal-4",
      student_id: "student-sofia-hernandez",
      class_id: "class-2",
      skill: "Collaboration",
      rating: 5,
      comment: "Mentors peers and keeps group tasks on schedule with shared checklists.",
      created_at: createDate("2024-07-23T11:00:00Z"),
    },
  ],
  assessments: [
    {
      id: "assessment-1",
      class_id: "class-1",
      title: "Narrative Writing Rubric",
      description: "Assess narrative techniques and voice.",
      scheduled_for: "2024-09-20",
      created_at: createDate("2024-08-01T12:00:00Z"),
    },
  ],
  assessment_grades: [
    {
      id: "grade-1",
      assessment_id: "assessment-1",
      student_id: "student-linh-san",
      score: 18,
      total: 20,
      created_at: createDate("2024-09-21T15:00:00Z"),
    },
  ],
  assessment_submissions: [
    {
      id: "submission-1",
      assessment_id: "assessment-1",
      student_id: "student-amelia-johnson",
      submitted_at: createDate("2024-09-20T14:00:00Z"),
      status: "submitted",
    },
  ],
  blogs: [
    {
      id: "blog-1",
      slug: "building-joyful-classrooms",
      title: "Building Joyful Classrooms",
      subtitle: "Strategies to spark curiosity every day",
      excerpt: "Practical strategies for creating engaged learning environments.",
      content_md: `# Building Joyful Classrooms

Creating a joyful classroom means tending to the conditions that let students feel safe, seen, and ready to take risks. When the tone is right, curiosity follows and learners lean into the work with genuine energy.

## Start with Shared Rituals

Begin the week with a community circle that invites every voice. Quick check-in prompts like "What made you smile this weekend?" keep the moment light while reinforcing that everyone belongs. Rotate student facilitators so the routine becomes something learners co-own instead of a teacher-led script.

- Use a visual schedule and music cue to signal transitions.
- Encourage students to design greetings or affirmations that reflect your class culture.

## Design Learning that Sparks Wonder

Blend movement, discussion, and creation throughout each lesson arc. A three-part flow—ignite, explore, reflect—helps every activity feel purposeful. During the explore phase, offer choice boards or station menus so students can pick the modality that fits how they learn best.

## Celebrate Growth Out Loud

Create space every day to recognize small wins. Invite students to shout out a peer for persistence, creativity, or collaboration. Capture those moments on a "Joy Wall" with sticky notes or digital badges so the celebrations live beyond the day they happen.

## Sustain Joy for the Long Term

Joyful classrooms are intentional, not accidental. Protect planning time to notice which routines are working and where energy dips. Gather quick feedback from learners each Friday and make one adjustment for the following week. The steady rhythm of reflection keeps joy sustainable for both students and teachers.
`,
      featured_image: "/images/blog/joyful-classroom.jpg",
      featured_image_caption: "Ms. Rivera welcoming Year 5 students into their morning circle ritual",
      tags: ["pedagogy", "culture"],
      author_id: "example-user",
      author_name: "Ms. Taylor Rivera",
      author_job_title: "Lead Literacy Teacher",
      author_avatar: "https://i.pravatar.cc/150?img=47",
      is_published: true,
      published_at: createDate("2024-08-12T10:00:00Z"),
      created_at: createDate("2024-08-10T09:00:00Z"),
      updated_at: createDate("2024-08-12T11:00:00Z"),
      read_time: 6,
      category: "Teaching Practice",
      time_required: "15 minutes",
      language: "en",
      featured: true,
      seo_description: "Build thriving learning communities with intentional rituals.",
    },
    {
      id: "blog-2",
      slug: "leveraging-student-voice",
      title: "Leveraging Student Voice in Planning",
      subtitle: "Co-create lessons with learners",
      excerpt: "Invite learners into the planning process with surveys and reflections.",
      content_md: `# Leveraging Student Voice in Planning

When students shape what and how they learn, engagement becomes authentic. Centering student voice in planning builds ownership, surfaces hidden interests, and helps instruction stay responsive.

## Listen Before You Plan

Start each unit with a short interest survey and a "wonder wall" brainstorm. Ask questions that reveal curiosities, preferred collaboration styles, and pacing needs. Pair the responses with formative data to identify themes—those insights become the anchor for your lesson sequence.

## Co-Design the Learning Path

Share the big learning goals with students and invite them to suggest how they might demonstrate mastery. Some may gravitate toward multimedia projects while others prefer written reflections or live demonstrations. Capture the ideas in a planning doc and commit to incorporating at least two student-generated options.

## Keep Feedback Loops Open

Schedule quick midpoint conferences or use a weekly exit ticket that asks, "What should we keep, stop, or start next week?" Close the loop by naming which suggestions you acted on and why. Visible responsiveness builds trust and encourages even quieter students to speak up.

## Reflect Together

End the unit with a collective retrospective. Invite students to share what helped them learn, what stretched them, and what they want to explore next. Their reflections become the launchpad for your next planning cycle, ensuring student voice remains a constant, not a one-time survey.
`,
      featured_image: "/images/blog/student-voice.jpg",
      featured_image_caption: "Ms. Rivera co-designing unit goals with students during planning circle",
      tags: ["student voice", "planning"],
      author_id: "example-user",
      author_name: "Ms. Taylor Rivera",
      author_job_title: "Lead Literacy Teacher",
      author_avatar: "https://i.pravatar.cc/150?img=47",
      is_published: true,
      published_at: createDate("2024-07-22T09:00:00Z"),
      created_at: createDate("2024-07-20T09:00:00Z"),
      updated_at: createDate("2024-07-22T09:30:00Z"),
      read_time: 5,
      category: "Lesson Design",
      time_required: "10 minutes",
      language: "en",
      featured: false,
      seo_description: "Plan with learners by centering their insights.",
    },
  ],
  comments: [
    {
      id: "comment-1",
      post_id: "blog-1",
      author_id: "example-user",
      content: "Love these ideas! Our morning circle transformed participation.",
      created_at: createDate("2024-08-13T12:00:00Z"),
      parent_id: null,
    },
  ],
  saved_posts: [
    {
      id: "saved-1",
      user_id: "example-user",
      post_id: "blog-1",
      created_at: createDate("2024-08-14T08:00:00Z"),
    },
  ],
  events: [
    {
      id: "event-1",
      slug: "ai-for-teachers-summit",
      title: "AI for Teachers Virtual Summit",
      description: "A hands-on summit exploring AI tools for instructional planning.",
      excerpt: "Discover practical AI strategies for the classroom.",
      location: "Virtual",
      start_date: createDate("2024-10-05T14:00:00Z"),
      end_date: createDate("2024-10-05T18:00:00Z"),
      featured_image: "/images/events/ai-summit.jpg",
      is_virtual: true,
      registration_url: "https://example.com/events/ai-summit",
      timezone: "UTC",
      speakers: ["Dr. Mia Chen", "Luis Alvarez"],
      agenda: ["Opening keynote", "Interactive breakout rooms", "Implementation workshops"],
      language: "en",
      created_at: createDate("2024-07-01T10:00:00Z"),
      updated_at: createDate("2024-08-01T12:00:00Z"),
    },
    {
      id: "event-2",
      slug: "blended-learning-labs",
      title: "Blended Learning Lab Series",
      description: "Regional meetups to prototype blended learning experiences.",
      excerpt: "Experiment with station rotations and flex models.",
      location: "Chicago, IL",
      start_date: createDate("2024-11-12T15:00:00Z"),
      end_date: createDate("2024-11-12T20:00:00Z"),
      featured_image: "/images/events/blended-learning.jpg",
      is_virtual: false,
      registration_url: "https://example.com/events/blended",
      timezone: "America/Chicago",
      speakers: ["Priya Singh"],
      agenda: ["Welcome lunch", "School showcase", "Design studio"],
      language: "en",
      created_at: createDate("2024-07-15T10:00:00Z"),
      updated_at: createDate("2024-08-02T12:00:00Z"),
    },
  ],
  faq: [
    {
      id: "faq-1",
      question: "How can SchoolTech Hub support my teachers?",
      answer: "We provide coaching, lesson design templates, and integration support for your existing tools.",
      category: "General",
      order: 1,
    },
    {
      id: "faq-2",
      question: "Do you offer onboarding for administrators?",
      answer: "Yes, our onboarding services include strategic planning and leadership workshops tailored to your goals.",
      category: "Services",
      order: 2,
    },
  ],
  notifications: [
    {
      id: "notification-1",
      user_id: "example-user",
      title: "New lesson plan template released",
      body: "Explore the latest literacy workshop template in your library.",
      created_at: createDate("2024-08-15T09:00:00Z"),
      read_at: null,
      action_url: "/lesson-builder",
    },
    {
      id: "notification-2",
      user_id: "example-user",
      title: "Student progress update",
      body: "Linh San submitted her narrative reflection.",
      created_at: createDate("2024-08-14T16:00:00Z"),
      read_at: createDate("2024-08-14T17:15:00Z"),
      action_url: "/students/student-linh-san",
    },
  ],
  notification_prefs: [
    {
      id: "pref-1",
      user_id: "example-user",
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      newsletter_opt_in: true,
      digest_frequency: "weekly",
    },
  ],
  research_projects: [
    {
      id: "research-1",
      slug: "ai-literacy",
      title: "AI Literacy in Middle School Classrooms",
      summary: "Studying how AI tools impact student agency.",
      status: "active",
      owner_id: "example-user",
      created_at: createDate("2024-05-01T09:00:00Z"),
      updated_at: createDate("2024-07-01T09:00:00Z"),
      tags: ["AI", "Literacy"],
      contact_email: "research@example.com",
    },
  ],
  research_participants: [
    {
      id: "participant-1",
      project_id: "research-1",
      school_name: "Riverbend Middle School",
      region: "Midwest",
      type: "school",
      joined_at: createDate("2024-06-01T12:00:00Z"),
      contact_name: "Jamie Patel",
      contact_email: "jamie.patel@example.com",
    },
  ],
  research_applications: [
    {
      id: "application-1",
      project_id: "research-1",
      organization: "Bright Future Academy",
      contact_email: "hello@brightfuture.edu",
      status: "pending",
      submitted_at: createDate("2024-08-05T10:00:00Z"),
      notes: "Interested in pilot for 7th grade.",
    },
  ],
  research_documents: [
    {
      id: "document-1",
      project_id: "research-1",
      title: "Student Interview Protocol",
      description: "Guiding questions for 1:1 interviews.",
      file_path: "research/ai-literacy/interview-protocol.pdf",
      created_at: createDate("2024-07-10T10:00:00Z"),
    },
  ],
  research_submissions: [
    {
      id: "submission-1",
      project_id: "research-1",
      participant_id: "participant-1",
      title: "Quarter 1 Reflection",
      description: "Teacher reflection on AI-assisted planning.",
      file_path: "research/ai-literacy/q1-reflection.docx",
      submitted_at: createDate("2024-09-01T09:00:00Z"),
    },
  ],
  blogs_moderation_queue: [],
  admin_audit_logs: [
    {
      id: "audit-1",
      actor_id: "example-user",
      action: "login",
      created_at: createDate("2024-08-01T09:00:00Z"),
      meta: {
        ip: "127.0.0.1",
      } satisfies Json,
    },
  ],
};

export const ensureTable = (table: string) => {
  if (!mockTables[table]) {
    mockTables[table] = [];
  }
  return mockTables[table];
};

let idCounter = 0;
export const createMockId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}-mock-${idCounter}`;
};
