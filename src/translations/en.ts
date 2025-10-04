export const en = {
  nav: {
    dashboard: "My profile",
    home: "Home",
    about: "About",
    services: "Services",
    blog: "Blog",
    curriculum: "Curriculum",
    lessonPlans: "Lesson Plans",
    builder: "Lesson Builder",
    worksheets: "Worksheets",
    events: "Events",
    contact: "Contact",
    edutech: "Edu Tech",
    teacherDiary: "Teacher Diary",
    faq: "FAQ",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    profile: "My profile"
  },
  profilePage: {
    title: "My Profile",
    subtitle: "Manage your teacher information and security preferences.",
    editButton: "Edit profile",
    info: {
      title: "Teacher Information",
      description: "Review the personal details connected to your SchoolTech Hub account.",
      firstName: "First name",
      lastName: "Last name",
      school: "School",
      subject: "Subject",
      phone: "Phone number",
      email: "Email",
    },
    security: {
      title: "Security",
      description: "Keep your account secure by updating your password when needed.",
      instructions:
        "Send a password reset link to your email address. Follow the instructions in the email to choose a new password.",
      resetButton: "Send password reset email",
      resetSent: "Password reset sent",
      resetDescription: "Check your inbox for the password reset email and follow the link provided.",
      resetError: "Unable to send reset email",
      noEmail: "We could not find an email associated with your account.",
    },
    fallback: {
      notProvided: "Not provided",
      signInRequired: "Sign in to view your profile details.",
    },
  },
  dashboard: {
    fallbackDisplayName: "Teacher",
    header: {
      title: "My Dashboard",
      greeting: "Welcome {name}",
      subtitle: "Review your classes, build curricula, and start new lesson plans.",
    },
    quickActions: {
      askQuestion: "Ask a Question",
      postBlog: "Post a Blog",
      newCurriculum: "New Curriculum",
      newClass: "New Class",
    },
    tabs: {
      curriculum: "Curriculum",
      classes: "My Classes",
      lessonPlans: "Lesson Plans",
      activity: "Activity",
    },
    common: {
      loading: "Loading...",
      signInPrompt: "Sign in to manage your dashboard.",
      exampleTag: "Example",
      exampleDescription: "Preview data to show how your workspace will look.",
      exampleActionsDisabled: "Actions are disabled for example items.",
    },
    toasts: {
      classCreated: "Class created",
      curriculumCreated: "Curriculum created",
      lessonPlanCreated: "Lesson plan created",
      exportUnavailable: "CSV export will be available soon.",
      error: "Something went wrong. Please try again.",
    },
    classes: {
      title: "My Classes",
      subtitle: "Track the classes you own and jump into their dashboards.",
      columns: {
        title: "Class",
        stage: "Stage",
        subject: "Subject",
        dates: "Dates",
        actions: "Actions",
      },
      labels: {
        start: "Start",
        end: "End",
      },
      actions: {
        view: "View",
        edit: "Edit",
      },
      empty: "You haven't created any classes yet.",
    },
    curriculum: {
      title: "Curriculum",
      subtitle: "Build curriculum outlines and sequence your lessons.",
      empty: {
        title: "Create your first curriculum",
        description: "Start by selecting a class, subject, and pasting lesson titles.",
        cta: "New Curriculum",
      },
      labels: {
        academicYear: "Academic year",
        itemsCount: "Lessons",
        createdOn: "Created",
      },
      actions: {
        open: "Open",
        exportCsv: "Export outline CSV",
      },
    },
    curriculumView: {
      title: "Curriculum items for {title}",
      empty: "Add lessons to this curriculum to begin planning.",
      columns: {
        lessonTitle: "Lesson Title",
        stage: "Stage",
        date: "Date",
        status: "Status",
        actions: "Actions",
      },
      status: {
        planned: "Planned",
        in_progress: "In progress",
        done: "Done",
      },
      actions: {
        createLessonPlan: "Create Lesson Plan",
      },
    },
    dialogs: {
      newClass: {
        title: "New Class",
        fields: {
          title: "Class title",
          stage: "Stage",
          subject: "Subject",
          startDate: "Start date",
          endDate: "End date",
        },
        submit: "Create class",
      },
      newCurriculum: {
        title: "New Curriculum",
        fields: {
          title: "Curriculum title",
          class: "Choose class",
          classPlaceholder: "Select a class",
          subject: "Subject",
          academicYear: "Academic year",
          lessonTitles: "Lesson titles",
          lessonTitlesPlaceholder: "Paste lesson titles here, one per line",
        },
        helper: "We will create curriculum items in the order provided.",
        submit: "Create curriculum",
      },
    },
  },
  hero: {
    title: "The Digital Staffroom Built for Teachers",
    subtitle: "Plan lessons, track progress, and assign homework with confidence",
    description:
      "SchoolTech Hub unites lesson planning, student analytics, and classroom technology guidance in one secure workspace designed for teachers.",
    getStarted: "Build my workspace",
    learnMore: "See everything included"
  },
  features: {
    title: "An AI-ready teacher workspace",
    subtitle: "Bring planning, reporting, and classroom technology together in one place",
    feature1: {
      title: "Guided lesson planning",
      description: "Blueprint every lesson with ready-made templates, curriculum alignment, and AI-powered suggestions"
    },
    feature2: {
      title: "Automated student reports",
      description: "Turn classroom data into parent-friendly summaries, growth snapshots, and inspection-ready evidence"
    },
    feature3: {
      title: "Skill tracking dashboards",
      description: "Monitor mastery, intervene early, and celebrate wins with visual progress insights for every learner"
    },
    feature4: {
      title: "Digital homework hub",
      description: "Assign interactive activities, collect submissions, and give feedback from the same workspace"
    },
    feature5: {
      title: "Technology coaching",
      description: "Follow practical guides and micro-courses on using EdTech tools to energize your classroom"
    },
    feature6: {
      title: "On-demand support",
      description: "Join live clinics, office hours, and a peer community whenever you need a co-teacher"
    }
  },
  about: {
    seo: {
      title: "About Us | SchoolTech Hub",
      description:
        "Learn about SchoolTech Hub's mission to make educational technology accessible. 7+ years experience, 100+ schools helped, certified educators supporting your tech journey.",
      keywords:
        "about SchoolTech Hub, educational technology company, EdTech consultants, teacher training experts, classroom technology specialists",
      canonical: "https://schooltechhub.com/about"
    },
    hero: {
      title: "About SchoolTech Hub",
      subtitle: "Making educational technology accessible and practical for every teacher"
    },
    story: {
      title: "Our Story",
      paragraphs: [
        "SchoolTech Hub was founded by educators who saw the gap between amazing technology and overwhelmed teachers. We bridge that gap with practical, proven solutions."
      ],
      ceo: {
        title: "CEO Message",
        message:
          "Technology should empower teachers, not overwhelm them. Our mission is to make every educator confident with the tools that can transform their classrooms.",
        signature: "- Donald Cjapi, CEO & Founder"
      },
      mission: {
        title: "Our Mission",
        description:
          "To democratize educational technology by providing accessible, affordable, and actionable support to educators worldwide."
      }
    },
    values: {
      title: "Our Values",
      items: [
        {
          title: "Practical First",
          description: "Every strategy must work in real classrooms, not just in theory."
        },
        {
          title: "Teacher-Centered",
          description: "We understand the daily challenges and time constraints you face."
        },
        {
          title: "Continuous Learning",
          description: "Technology evolves, and so do our methods and recommendations."
        }
      ]
    },
    stats: {
      items: [
        { number: "7+", label: "Years Experience" },
        { number: "100+", label: "Schools Helped" },
        { number: "1,000+", label: "Teachers Supported" },
        { number: "50+", label: "Tools Tested" }
      ]
    },
    credentials: {
      title: "Credentials & Partnerships",
      certifications: {
        title: "Certifications",
        items: [
          "Google Certified Educator Level 2",
          "Microsoft Innovative Educator",
          "Apple Teacher",
          "ISTE Certified Educator",
          "Common Sense Digital Citizenship"
        ]
      },
      featured: {
        title: "Featured In",
        items: ["EdTech Magazine", "Teaching Channel", "ASCD"]
      },
      partnerships: {
        title: "School Partnerships",
        description:
          "We're proud to work with schools nationwide to pilot new approaches and gather real-world feedback. Our partner schools help us ensure every strategy is classroom-tested and teacher-approved.",
        cta: "Partner With Us"
      }
    },
    cta: {
      title: "Ready to Transform Your Teaching?",
      description: "Join thousands of teachers who've discovered that technology doesn't have to be overwhelming.",
      primary: "Book a Consultation",
      secondary: "Browse Free Resources"
    },
    expertise: {
      title: "Certifications & Expertise",
      items: [
        "ClassDojo Mentorship",
        "Wordwall Certified",
        "Canvas Certification",
        "Microsoft Educator",
        "AI Education",
        "Leadership Management"
      ]
    },
    testimonials: {
      title: "What Teachers Say",
      items: [
        {
          quote: "The AI tools training transformed how I create lesson plans. I'm saving hours every week!",
          name: "Sarah M.",
          role: "5th Grade Teacher"
        },
        {
          quote: "Finally, someone who understands classroom reality and doesn't just push the latest tech trends.",
          name: "Mike T.",
          role: "High School Science"
        },
        {
          quote: "The dashboard setup service revolutionized our school's data management. Highly recommend!",
          name: "Principal Johnson",
          role: "Elementary School"
        }
      ]
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          question: "How do you stay current with EdTech?",
          answer:
            "We continuously test new tools, attend conferences, and collaborate with teachers worldwide to ensure our recommendations are cutting-edge yet practical."
        },
        {
          question: "Do you work with schools outside your local area?",
          answer:
            "Yes! We partner with schools worldwide through virtual consulting and training, drawing on experience across multiple education systems."
        },
        {
          question: "What makes your approach different?",
          answer:
            "We focus on practical, immediately implementable solutions that work within real classroom constraints, not theoretical best practices."
        }
      ]
    }
  },
  services: {
    title: "Our Services",
    subtitle: "Comprehensive Educational Technology Solutions",
    lms: {
      title: "Learning Management Systems",
      description: "State-of-the-art LMS platforms with AI-powered personalization",
      features: ["AI-powered personalization", "Real-time progress tracking", "Interactive content creation", "Automated grading systems"]
    },
    virtual: {
      title: "Virtual Classroom Solutions",
      description: "Immersive online learning environments",
      features: ["HD video conferencing", "Interactive whiteboards", "Breakout rooms", "Screen sharing & recording"]
    },
    assessment: {
      title: "Digital Assessment Tools",
      description: "Comprehensive testing and evaluation platforms",
      features: ["Online exam creation", "Automated grading", "Plagiarism detection", "Performance analytics"]
    },
    management: {
      title: "School Management Software",
      description: "Complete administrative solutions",
      features: ["Student information systems", "Attendance tracking", "Fee management", "Parent communication portals"]
    },
    page: {
      seo: {
        title: "Services & Pricing",
        description:
          "Professional EdTech consulting services. 1:1 coaching ($30), whole-school PD programs ($60), and custom dashboard setup. Transform your classroom with expert guidance.",
        keywords:
          "EdTech consulting, teacher coaching, professional development, school technology training, educational dashboard, classroom technology support"
      },
      header: {
        title: "Services & Pricing",
        subtitle: "Get the support you need to transform your classroom"
      },
      badge: "Most Popular",
      bookNow: "Book Now",
      idealLabel: "Ideal for:",
      structuredData: {
        serviceType: "Educational Technology Consulting"
      }
    },
    packages: [
      {
        id: "consultation",
        title: "1:1 Coaching",
        price: "$30/session",
        duration: "60 minutes",
        description: "Get personalized support for your specific classroom tech challenges",
        features: [
          "Customized to your exact needs",
          "Screen sharing for hands-on help",
          "Action plan you can use tomorrow",
          "Follow-up resources included",
          "Recording available for review"
        ],
        ideal: "Teachers who need quick, targeted solutions",
        highlight: true
      },
      {
        id: "whole-staff-pd",
        title: "Whole-Staff PD Program",
        price: "$60",
        duration: "per session",
        description:
          "Up to 30 staff members (larger groups possible with prior arrangement). Schools can choose any edtech topic most relevant to their needs.",
        features: [
          "60-90 minutes of live, engaging professional development",
          "Hands-on activities and demonstrations",
          "Differentiated by staff experience level (beginners to advanced)",
          "School receives a digital resource hub (guides, templates, links)",
          "30-day follow-up Q&A session (online) for continued support"
        ],
        ideal: "Schools wanting affordable, practical training to build staff confidence in technology"
      },
      {
        id: "custom-dashboard",
        title: "Custom School Dashboard & Tracker Setup",
        price: "$300",
        duration: "flat rate",
        description: "Design and implement custom digital dashboards tailored to your school's needs",
        features: [
          "60-minute consultation to identify your priorities and current tools",
          "Build centralized dashboards (Google Sheets, Airtable, Notion, or Supabase)",
          "Student performance trackers (grades, attendance, behavior, SEL)",
          "Teacher workflow dashboards & leadership dashboards",
          "Ready-to-use templates and staff training",
          "30-day implementation support (email or video check-ins)"
        ],
        ideal: "Schools that want to improve organization, communication, and data-driven decision making"
      }
    ],
    guarantee: {
      title: "Our Guarantee",
      description:
        "If you don't learn at least 3 implementable strategies in your first session, we'll refund your payment - no questions asked."
    },
    steps: {
      title: "How It Works",
      tabs: [
        {
          value: "before",
          label: "Before",
          title: "What to Prepare",
          items: [
            {
              icon: "target",
              title: "Your biggest challenge",
              description: "What's the #1 thing you want to solve?"
            },
            {
              icon: "users",
              title: "Your classroom context",
              description: "Grade level, subject, class size"
            },
            {
              icon: "fileText",
              title: "Available technology",
              description: "What devices and tools you can access"
            }
          ]
        },
        {
          value: "during",
          label: "During",
          title: "Your Session",
          items: [
            { icon: "check", text: "Quick assessment of your current setup" },
            { icon: "check", text: "Hands-on demonstration of solutions" },
            { icon: "check", text: "Practice with immediate feedback" },
            { icon: "check", text: "Q&A for your specific situation" }
          ]
        },
        {
          value: "after",
          label: "After",
          title: "Follow-Up Support",
          items: [
            { icon: "check", text: "Written summary of strategies discussed" },
            { icon: "check", text: "Links to all resources mentioned" },
            { icon: "check", text: "Recording available for 30 days (if applicable)" },
            { icon: "check", text: "Email support for clarifications" }
          ]
        }
      ]
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          question: "What devices do I need?",
          answer:
            "Any device with internet access works! We'll adapt to whatever you have - Chromebooks, iPads, laptops, or even smartphones."
        },
        {
          question: "What about school filters and restrictions?",
          answer: "We specialize in working within school constraints. We'll find solutions that work with your existing security settings."
        },
        {
          question: "How do you handle student privacy?",
          answer:
            "All recommendations are COPPA and FERPA compliant. We prioritize tools with strong privacy policies and minimal data collection."
        },
        {
          question: "Can you help with LMS integration?",
          answer: "Yes! We work with Google Classroom, Canvas, Schoology, and most major learning management systems."
        },
        {
          question: "Do you provide receipts for reimbursement?",
          answer: "Absolutely. You'll receive detailed invoices suitable for school reimbursement or professional development funds."
        },
        {
          question: "What can I expect after one session?",
          answer:
            "You'll leave with at least 3 implementable strategies, relevant resources, and confidence to try something new immediately."
        }
      ],
      cta: {
        button: "Book Your Session Today",
        note: "Questions? Email us at",
        email: "dcjapi@gmail.com"
      }
    }
  },
  blog: {
    title: "Latest Insights & Updates",
    subtitle: "Stay informed about the latest trends in educational technology",
    searchPlaceholder: "Search posts...",
    readMore: "Read More",
    minRead: "min read",
    postedBy: "Posted by",
    hero: {
      title: "Blog & Resources",
      subtitle: "Ideas, research, teaching techniques, and resources for K-12 educators."
    },
    seo: {
      title: "Blog: EdTech Ideas, Research & Teaching Resources",
      description:
        "Explore EdTech ideas, research notes, teaching techniques, and case studies for K-12. Find practical strategies to integrate technology and improve engagement."
    },
    states: {
      loading: "Loading blog posts...",
      empty: "No blog posts found matching your criteria."
    },
    badges: {
      featured: "Featured"
    },
    readTime: {
      minutes: "{minutes} min read"
    },
    filters: {
      title: "Filters",
      helper: "Refine posts by topic, stage, subject, and format.",
      clear: "Clear filters",
      category: "Category",
      stage: "Stage",
      subject: "Subject",
      delivery: "Delivery Type",
      payment: "Payment",
      platform: "Platform",
      categories: {
        eduTech: "Edu Tech",
        tutorials: "Tutorials",
        teachingTechniques: "Teaching Techniques",
        classActivity: "Class Activity",
        teacherReflection: "Teacher Reflection",
        tips: "Tips",
        shop: "Shop",
        caseStudy: "Case Study",
        research: "Research",
        researchQuestion: "Research Questions",
        teacherDebates: "Teacher Debates"
      },
      stages: {
        earlyChildhood: "Early Childhood",
        preK: "Pre-K",
        kindergarten: "Kindergarten",
        primary: "Primary",
        secondary: "Secondary",
        highSchool: "High School",
        k12: "K-12",
        k5: "K-5"
      },
      subjects: {
        phonics: "Phonics",
        english: "English",
        math: "Math",
        science: "Science",
        biology: "Biology",
        chemistry: "Chemistry",
        physics: "Physics",
        earthScience: "Earth Science",
        history: "History",
        geography: "Geography",
        music: "Music",
        arts: "Arts",
        ict: "ICT",
        pe: "PE",
        globalPerspective: "Global Perspective",
        circleTime: "Circle Time",
        breakTime: "Break Time",
        steam: "STEAM"
      },
      deliveries: {
        inClass: "In-class",
        online: "Online",
        live: "Live",
        homework: "Homework"
      },
      payments: {
        free: "Free",
        paid: "Paid",
        educationDiscount: "Education Discount"
      },
      platforms: {
        mobileApp: "Mobile App",
        webapp: "Webapp",
        smartphone: "Smartphone",
        smartboard: "Smartboard",
        mac: "Mac",
        windows: "Windows"
      }
    },
    author: {
      default: "SchoolTechHub Team"
    },
    newsletter: {
      title: "📩 Join our Teacher Updates",
      description: "Get curated resources and tips delivered weekly.",
      emailPlaceholder: "Email (required)",
      namePlaceholder: "Full Name",
      jobPlaceholder: "Job Position",
      roleLabel: "Role",
      submit: "Subscribe to Newsletter",
      roles: {
        teacher: "Teacher",
        admin: "Admin",
        parent: "Parent",
        student: "Student",
        other: "Other"
      },
      toast: {
        successTitle: "Success!",
        successDescription: "You've been subscribed to our Teacher Updates newsletter.",
        duplicateTitle: "Already subscribed",
        duplicateDescription: "This email is already subscribed to our newsletter.",
        errorTitle: "Error",
        errorDescription: "Failed to subscribe. Please try again."
      }
    },
    savedPosts: {
      title: "Saved posts",
      subtitle: "Pick up reading where you left off.",
      empty: "Save any article to revisit it here.",
      savedOn: "Saved {date}",
      manage: "Manage saved posts"
    },
    communityActivity: {
      title: "Community activity",
      subtitle: "Track your latest interactions around the hub.",
      askQuestion: "Ask a question"
    },
    researchHighlights: {
      title: "Research highlights",
      subtitle: "Discover emerging practice and contribute your own classroom research.",
      share: "Share a research post",
      explore: "Explore research hub"
    },
    lockedFeatures: {
      title: "Create a free account to unlock more",
      subtitle: "Join SchoolTech Hub to bookmark posts, follow conversations, and explore our research community.",
      savedPosts: {
        title: "Saved posts",
        description: "Bookmark resources to return to them anytime."
      },
      communityActivity: {
        title: "Community activity",
        description: "See your lesson drafts, replies, and forum conversations in one feed."
      },
      researchHighlights: {
        title: "Research highlights",
        description: "Dive deeper into collaborative classroom research and educator insights."
      }
    }
  },
  lessonPlans: {
    seo: {
      title: "Lesson Plans Library",
      description:
        "Browse ready-to-teach lesson plans filtered by grade level, delivery style, and classroom technology.",
    },
    hero: {
      title: "Lesson Plans",
      subtitle: "Find practical, tech-ready lessons for every classroom stage.",
    },
    filters: {
      title: "Filters",
      searchPlaceholder: "Search lesson plans",
      stageLabel: "Stage",
      deliveryLabel: "Delivery mode",
      technologyLabel: "Technology focus",
      clear: "Clear filters",
      stages: {
        earlyChildhood: {
          label: "Early Childhood",
          description: "Play-based foundations",
          gradeRange: "PreK-1",
        },
        elementary: {
          label: "Elementary",
          description: "Building core skills",
          gradeRange: "Grades 2-5",
        },
        middleSchool: {
          label: "Middle School",
          description: "Exploration and inquiry",
          gradeRange: "Grades 6-8",
        },
        highSchool: {
          label: "High School",
          description: "College and career ready",
          gradeRange: "Grades 9-12",
        },
        adultLearners: {
          label: "Adult Learners",
          description: "Professional and higher ed",
          gradeRange: "Post-secondary",
        },
      },
      deliveries: {
        inPerson: {
          label: "In-person",
          description: "Face-to-face classroom",
        },
        blended: {
          label: "Blended",
          description: "Mix of online and in-class",
        },
        online: {
          label: "Online",
          description: "Live or asynchronous remote",
        },
        projectBased: {
          label: "Project-based",
          description: "Student-led projects",
        },
        flipped: {
          label: "Flipped",
          description: "Learn at home, apply in class",
        },
      },
      technologyOptions: {
        ai: "AI & automation",
        robotics: "Robotics",
        coding: "Coding",
        vr: "Virtual reality",
        steam: "STEAM",
      },
    },
    states: {
      loading: "Loading lesson plans...",
      emptyTitle: "No lesson plans found",
      emptyDescription: "Try adjusting your filters or search keywords.",
      resetFilters: "Reset filters",
      error: "We couldn't load lesson plans right now. Please try again soon.",
      loadMore: "Load more plans",
    },
    card: {
      openLabel: "View lesson plan",
      durationLabel: "{minutes} minutes",
    },
    modal: {
      stage: "Stage",
      subjects: "Subjects",
      delivery: "Delivery",
      technology: "Technology",
      duration: "Duration",
      summary: "Summary",
      overview: "Lesson overview",
      objectives: "Objectives",
      successCriteria: "Success criteria",
      materials: "Materials",
      assessment: "Assessment",
      technologyOverview: "Technology tools",
      deliveryOverview: "Delivery modes",
      durationOverview: "Suggested duration",
      structure: "Lesson structure",
      resources: "Resources",
      resourceLink: "Open resource",
      empty: "Lesson details will be added soon.",
      download: "Download PDF",
      downloadDocx: "Download Word doc",
      openFull: "Open full page",
      close: "Close",
    },
    detail: {
      backToList: "Back to lesson plans",
      errorDescription: "We couldn't load this lesson plan. Please return to the library and try again.",
      notFoundTitle: "Lesson plan not found",
      notFoundDescription: "This lesson plan may have been unpublished or removed.",
    },
  },
  worksheets: {
    seo: {
      title: "Worksheet Library",
      description:
        "Download standards-aligned worksheets filtered by grade, subject, skill focus, and format.",
    },
    hero: {
      title: "Worksheets",
      subtitle: "Find printable and digital activities with filters built for teachers.",
    },
    filters: {
      title: "Filters",
      searchPlaceholder: "Search worksheets",
      stageLabel: "Stage",
      subjectLabel: "Subject(s)",
      skillLabel: "Skill focus",
      typeLabel: "Worksheet type",
      difficultyLabel: "Difficulty",
      formatLabel: "Format",
      techOnly: "Tech-integrated only",
      techOnlyDescription: "Show only worksheets that use classroom technology or devices.",
      answersOnly: "Includes answer key",
      answersOnlyDescription: "Limit results to worksheets that include an answer key.",
      clear: "Clear filters",
      mobileToggle: "Filter worksheets",
      stages: {
        k: {
          label: "Kindergarten",
          description: "Playful foundations",
          hint: "Age 5",
        },
        "1": { label: "Grade 1", description: "Early readers", hint: "Age 6" },
        "2": { label: "Grade 2", description: "Growing fluency", hint: "Age 7" },
        "3": { label: "Grade 3", description: "Skill builders", hint: "Age 8" },
        "4": { label: "Grade 4", description: "Problem solving", hint: "Age 9" },
        "5": { label: "Grade 5", description: "Project ready", hint: "Age 10" },
        "6": { label: "Grade 6", description: "Middle school", hint: "Age 11" },
        "7": { label: "Grade 7", description: "Critical thinking", hint: "Age 12" },
        "8": { label: "Grade 8", description: "Inquiry driven", hint: "Age 13" },
        "9": { label: "Grade 9", description: "High school", hint: "Age 14" },
        "10": { label: "Grade 10", description: "Depth and rigor", hint: "Age 15" },
        "11": { label: "Grade 11", description: "Advanced practice", hint: "Age 16" },
        "12": { label: "Grade 12", description: "College ready", hint: "Age 17" },
      },
      subjects: {
        english: "English language arts",
        englishDescription: "Reading, writing, and phonics",
        math: "Mathematics",
        mathDescription: "Number sense, operations, algebra",
        science: "Science",
        scienceDescription: "Life, earth, and physical science",
        socialStudies: "Social studies",
        socialStudiesDescription: "History, civics, geography",
        technology: "Technology",
        technologyDescription: "STEM, coding, robotics",
        art: "Arts & creativity",
        artDescription: "Visual arts and design thinking",
      },
      skills: {
        phonics: "Phonics",
        phonicsDescription: "Decoding, blends, sounds",
        fractions: "Fractions",
        fractionsDescription: "Comparing, modeling, operations",
        reading: "Reading comprehension",
        readingDescription: "Fiction and nonfiction texts",
        writing: "Writing",
        writingDescription: "Paragraphs, prompts, graphic organizers",
        stem: "STEM",
        stemDescription: "Hands-on science and engineering",
        ai: "AI literacy",
        aiDescription: "Responsible AI use and ethics",
      },
      types: {
        practice: "Practice",
        quiz: "Quiz",
        station: "Learning station",
        project: "Project sheet",
        discussion: "Discussion prompts",
      },
      difficultyOptions: {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
      },
      formatOptions: {
        pdf: "Printable PDF",
        digital: "Digital interactive",
      },
    },
    states: {
      loading: "Loading worksheets...",
      emptyTitle: "No worksheets found",
      emptyDescription: "Try updating your filters or searching a different keyword.",
      resetFilters: "Reset filters",
      error: "We couldn't load worksheets right now. Please try again soon.",
      loadMore: "Load more worksheets",
    },
    card: {
      openLabel: "Preview worksheet",
      answerKey: "Answer key",
      formatPdf: "Printable",
      formatDigital: "Digital",
    },
    modal: {
      stage: "Stage",
      subjects: "Subjects",
      skills: "Skills",
      type: "Worksheet type",
      difficulty: "Difficulty",
      format: "Format",
      formatPdf: "Printable PDF",
      formatDigital: "Digital interactive",
      techIntegrated: "Tech-integrated",
      answerKey: "Answer key",
      tags: "Tags",
      preview: "Preview",
      noPreview: "Preview coming soon",
      download: "Download PDF",
      downloadAnswers: "Download answer key",
      openFull: "Open full page",
      close: "Close",
    },
    detail: {
      backToList: "Back to worksheets",
      titleFallback: "Worksheet",
      descriptionFallback: "Downloadable worksheet",
      errorTitle: "Something went wrong",
      errorDescription: "We couldn't load this worksheet right now. Please refresh or return to the library.",
      notFoundTitle: "Worksheet not found",
      notFoundDescription: "This worksheet may have been unpublished or removed.",
    },
  },
  blogPost: {
    backToBlog: "Back to Blog",
    share: "Share",
    save: "Save post",
    saved: "Saved",
    comments: "Comments",
    commentPlaceholder: "Share your thoughts...",
    postComment: "Post Comment",
    loginPrompt: "Please log in to leave a comment",
    loginCta: "Log In to Comment",
    reply: "Reply",
    replyPlaceholder: "Write your reply...",
    postReply: "Post Reply",
    cancel: "Cancel",
    emptyState: "No comments yet. Be the first to share your thoughts!",
    notFound: {
      title: "Blog Post Not Found",
      description: "The blog post you're looking for doesn't exist."
    },
    toast: {
      authRequiredTitle: "Authentication required",
      authRequiredComment: "Please log in to comment",
      authRequiredReply: "Please log in to reply",
      authRequiredSave: "Please log in to save posts",
      errorTitle: "Error",
      commentError: "Failed to post comment",
      replyError: "Failed to post reply",
      saveError: "Failed to save post",
      removeError: "Failed to remove saved post",
      successTitle: "Success",
      commentSuccess: "Comment posted successfully",
      replySuccess: "Reply posted successfully",
      saveSuccess: "Post saved to your list",
      removeSuccess: "Removed from saved posts"
    }
  },
  contact: {
    seo: {
      title: "Contact & Book a Session",
      description:
        "Book your EdTech consultation today. Get personalized 1:1 coaching or whole-school training. Contact School Tech Hub for expert educational technology support.",
      keywords:
        "book consultation, EdTech support, contact education consultant, schedule training, teacher coaching booking"
    },
    hero: {
      title: "Get In Touch",
      subtitle: "Book a consultation or ask us anything about educational technology"
    },
    info: {
      quickContact: {
        title: "Quick Contact",
        email: {
          label: "Email",
          value: "dcjapi@gmail.com"
        },
        phone: {
          label: "Phone",
          value: "+84 0372725432",
          whatsapp: "WhatsApp: +84 0372725432"
        },
        location: {
          label: "Location",
          description: "Available worldwide for online consultations"
        }
      },
      officeHours: {
        title: "Office Hours",
        weekdays: "Monday - Friday: 8am - 6pm EST",
        saturday: "Saturday: 10am - 2pm EST",
        sunday: "Sunday: Closed"
      },
      responseTime: {
        title: "Response Time",
        description:
          "We typically respond within 24 hours during business days. Urgent requests are prioritized."
      }
    },
    form: {
      title: "Book a Session",
      fields: {
        name: {
          label: "Full Name *",
          placeholder: "Jane Smith"
        },
        email: {
          label: "Email Address *",
          placeholder: "jane@school.edu"
        },
        phone: {
          label: "Phone Number",
          placeholder: "(555) 123-4567"
        },
        school: {
          label: "School/Organization",
          placeholder: "Lincoln Elementary"
        },
        preferredDate: {
          label: "Preferred Date",
          placeholder: "Pick a date"
        },
        preferredTime: {
          label: "Preferred Time",
          placeholder: "Select preferred time",
          options: [
            { value: "09:00", label: "9:00 AM" },
            { value: "10:00", label: "10:00 AM" },
            { value: "11:00", label: "11:00 AM" },
            { value: "12:00", label: "12:00 PM" },
            { value: "13:00", label: "1:00 PM" },
            { value: "14:00", label: "2:00 PM" },
            { value: "15:00", label: "3:00 PM" },
            { value: "16:00", label: "4:00 PM" }
          ]
        },
        topic: {
          label: "Topic/Challenge to Address",
          placeholder: "e.g., Implementing AI tools, Google Classroom setup"
        },
        message: {
          label: "Additional Information",
          placeholder: "Tell us more about your goals and any specific requirements..."
        }
      },
      serviceType: {
        label: "Service Type *",
        options: {
          consultation: "1:1 Consulting ($30)",
          wholeSchool: "Whole School Consulting ($60)"
        }
      },
      cta: {
        idle: "Send Booking Request",
        loading: "Sending..."
      },
      disclaimer:
        "By submitting this form, you agree to our terms of service and privacy policy. We'll never share your information with third parties.",
      toast: {
        successTitle: "Booking request sent!",
        successDescription: "We'll get back to you within 24 hours to confirm your session.",
        errorTitle: "Error",
        errorDescription: "Failed to send booking request. Please try again."
      }
    }
  },
  footer: {
    tagline: "Empowering education through innovative technology solutions",
    quickLinks: "Quick Links",
    solutions: "Solutions",
    followUs: "Follow Us",
    newsletter: "Newsletter",
    newsletterText: "Subscribe to get the latest updates",
    emailLabel: "Email address for newsletter",
    emailPlaceholder: "Your email",
    subscribe: "Subscribe",
    subscribing: "Subscribing...",
    toast: {
      successTitle: "Success!",
      successMessage: "You've been subscribed to our monthly tech tips.",
      errorTitle: "Error",
      errorMessage: "Failed to subscribe. Please try again."
    },
    social: {
      facebook: "Facebook",
      instagram: "Instagram",
      linkedin: "LinkedIn",
      email: "Email"
    },
    contact: {
      emailLabel: "Email",
      phoneLabel: "Phone",
      availability: "Available worldwide for online consultations"
    },
    allRights: "All rights reserved",
    privacy: "Privacy Policy",
    terms: "Terms of Service"
  },
  auth: {
    seo: {
      title: "Sign In / Sign Up",
      description: "Join SchoolTechHub to access exclusive educational content, participate in teacher debates, and receive monthly newsletters",
      canonical: "https://schooltechhub.com/auth"
    },
    card: {
      title: "Welcome to SchoolTechHub",
      description: "Sign in to access exclusive content and features"
    },
    tabs: {
      signIn: "Sign In",
      signUp: "Sign Up"
    },
    roles: {
      teacher: "Teacher",
      admin: "Admin",
      parent: "Parent",
      student: "Student",
      other: "Other"
    },
    backToHome: "Back to Home",
    googleSignIn: "Sign in with Google",
    googleSigningIn: "Connecting to Google...",
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    emailPlaceholder: "your@email.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    passwordCreatePlaceholder: "Create a password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm your password",
    name: "Full Name",
    namePlaceholder: "John Doe",
    role: "Role",
    selectRole: "Select your role",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    orContinueWith: "Or continue with",
    signingIn: "Signing in...",
    signingUp: "Signing up...",
    signInWith: "Sign in with",
    toast: {
      errorTitle: "Error",
      successTitle: "Success",
      successDescription: "Please check your email to verify your account"
    },
    welcomeBack: "Welcome back",
    createAccount: "Create an account",
    getStarted: "Get started with School Tech Hub Solutions",
    continueJourney: "Continue your educational technology journey",
    checkEmail: "Please check your email to confirm your account",
    successSignUp: "Account created successfully!",
    errorSignIn: "Invalid email or password",
    errorSignUp: "Failed to create account"
  },
  events: {
    title: "Upcoming Events & Webinars",
    subtitle: "Join us for exclusive educational technology events",
    registerNow: "Register Now",
    spotsLeft: "spots left",
    virtual: "Virtual Event",
    inPerson: "In-Person",
    viewDetails: "View Details"
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Find answers to common questions about our services",
    hero: {
      title: "Frequently Asked Questions",
      subtitle: "Get answers to common questions about our services and tools"
    },
    loading: "Loading FAQs...",
    empty: "No FAQs available at the moment.",
    cta: {
      title: "Still have questions?",
      subtitle: "Our team is here to help you with any additional questions",
      button: "Contact Us"
    }
  },
  edutech: {
    title: "Edutech Hub",
    subtitle: "Learn new technologies, teaching techniques, activities, and AI lesson planning.",
    searchPlaceholder: "Search tutorials, techniques, activities...",
    categories: {
      all: "All",
      lessonPlanning: "Lesson Planning",
      lessonDelivery: "Lesson Delivery",
      engagement: "Engagement",
      evaluation: "Evaluation"
    },
    filters: {
      title: "Filters",
      groups: {
        contentType: {
          title: "Blog Type",
          options: {
            tutorial: "Tutorial",
            teachingTechnique: "Teaching Technique",
            activity: "Activity"
          }
        },
        deliveryType: {
          title: "Delivery Type",
          options: {
            inClass: "In-class",
            online: "Online",
            hybrid: "Hybrid",
            selfPaced: "Self-paced",
            distanceLearning: "Distance Learning",
            live: "Live"
          }
        },
        payment: {
          title: "Payment",
          options: {
            free: "Free",
            freemium: "Freemium",
            paid: "Paid",
            freeTrial: "Free Trial",
            educationDiscount: "Education Discount"
          }
        },
        stage: {
          title: "Stage",
          options: {
            earlyChildhood: "Early Childhood",
            preK: "Pre-K",
            kindergarten: "Kindergarten",
            lowerPrimary: "Lower Primary",
            upperPrimary: "Upper Primary",
            primary: "Primary",
            secondary: "Secondary",
            highSchool: "High School",
            k12: "K-12",
            k5: "K-5"
          }
        },
        subject: {
          title: "Subject",
          options: {
            phonics: "Phonics",
            reading: "Reading",
            writing: "Writing",
            grammar: "Grammar",
            spelling: "Spelling",
            vocabulary: "Vocabulary",
            englishEla: "English/ELA",
            math: "Math",
            science: "Science",
            biology: "Biology",
            chemistry: "Chemistry",
            physics: "Physics",
            earthScience: "Earth Science",
            ict: "ICT",
            stem: "STEM",
            steam: "STEAM"
          }
        },
        instructionType: {
          title: "Instruction Type",
          options: {
            directInstruction: "Direct Instruction",
            differentiatedInstruction: "Differentiated Instruction",
            inquiryBasedLearning: "Inquiry-Based Learning",
            projectBasedLearning: "Project-Based Learning",
            problemBasedLearning: "Problem-Based Learning",
            playBasedLearning: "Play-Based Learning",
            gameBasedLearning: "Game-Based Learning",
            gamification: "Gamification",
            cooperativeLearning: "Cooperative Learning",
            experientialLearning: "Experiential Learning",
            designThinking: "Design Thinking",
            socraticSeminar: "Socratic Seminar",
            stationRotation: "Station Rotation",
            blendedLearning: "Blended Learning"
          }
        }
      }
    },
    states: {
      loading: "Loading content...",
      empty: "No content found matching your criteria."
    },
    cta: {
      learnMore: "Click to learn more..."
    }
  },
  teacherDiary: {
    title: "Teacher's Digital Diary",
    subtitle: "Track your teaching journey and student progress",
    addEntry: "Add New Entry",
    todayClasses: "Today's Classes",
    upcomingTasks: "Upcoming Tasks",
    studentProgress: "Student Progress Overview",
    recentEntries: "Recent Diary Entries",
    viewAll: "View All",
    classSchedule: "Class Schedule",
    notes: "Notes & Observations"
  },
  home: {
    highlights: {
      workspace: "Plan purposeful lessons in minutes",
      resourceLibrary: "Generate insight-rich student reports",
      community: "Assign interactive homework & track progress"
    },
    stats: {
      lessonPlans: "Lesson plans organized",
      resourceDownloads: "Resources shared with teachers",
      teacherSatisfaction: "Teacher satisfaction rating",
      supportAvailable: "Live support hours each week"
    },
    cta: {
      title: "Launch your SchoolTech Hub workspace",
      description: "Bring lesson planning, student insights, and digital homework together for your whole class.",
      primary: "Start my free tour",
      secondary: "Discover teacher resources",
      social: {
        facebook: "Facebook",
        instagram: "Instagram",
        linkedin: "LinkedIn",
        email: "Email"
      }
    },
    workflow: {
      title: "Everything you need for the modern classroom",
      subtitle: "Follow an intuitive flow from planning to reporting, built around the way teachers work.",
      items: [
        {
          badge: "Plan",
          title: "Craft lessons with smart templates",
          description: "Start with standards-aligned templates, add your strategies, and let AI suggest differentiation."
        },
        {
          badge: "Report",
          title: "Generate student-ready insights",
          description: "Transform attendance, assessment, and behaviour data into clear progress reports instantly."
        },
        {
          badge: "Assign",
          title: "Deliver digital homework with ease",
          description: "Send interactive tasks, collect evidence, and monitor completion without juggling extra tools."
        }
      ]
    },
    techTopics: {
      title: "Technology inspiration for your next lesson",
      subtitle: "Browse trending topics from our blog to help you blend pedagogy and innovation.",
      action: "Read the guide",
      items: [
        {
          title: "AI coaching for personalised learning",
          description: "Discover how to pair teacher intuition with AI prompts that adapt to every student's pace."
        },
        {
          title: "Interactive whiteboard workflows",
          description: "Turn devices into collaborative spaces with ready-to-use routines and classroom management tips."
        },
        {
          title: "Data dashboards that inform instruction",
          description: "Learn how to connect your gradebook and formative checks to spot trends faster."
        },
        {
          title: "Digital homework that sparks curiosity",
          description: "Explore platforms and app smash ideas that keep students practicing between lessons."
        }
      ]
    }
  },
  sitemap: {
    title: "Sitemap",
    description: "Find all pages and resources available on School Tech Hub",
    sections: {
      englishPages: "English Pages",
      localizedPages: "{{language}} Pages",
      freshContent: "Fresh content",
      blogPosts: "Blog Posts",
      events: "Events",
      teacherDiaryEntries: "Teacher Diary Entries",
      xmlTitle: "XML Sitemap",
      xmlDescription: "For search engines and automated tools, access our XML sitemap:"
    },
    links: {
      authPortal: "Auth Portal",
      sitemap: "Sitemap"
    },
    languages: {
      en: "English"
    }
  },
  lessonBuilder: {
    editor: {
      heading: "Lesson Plan",
      prefilledNotice: "Prefilled from your curriculum. Change these details in the source record.",
      classLabel: "Class",
      stageLabel: "Stage",
      changeLink: "Change",
      addResource: "Add Resource",
      exportPdf: "Export PDF",
      exportDocx: "Export DOCX",
      bodyLabel: "Lesson plan body",
      bodyPlaceholder: "Draft your lesson using markdown...",
      save: "Save",
      autosaveSaving: "Saving...",
      autosaveSaved: "Saved at {time}",
      autosaveSavedNow: "Saved",
      autosaveIdle: "Autosave ready",
      autosaveError: "We couldn't save changes.",
      saved: "Lesson plan saved",
      pageTitle: "Lesson Builder • {title}",
      pageDescription: "Two-pane lesson builder with resource picker",
      loading: "Loading lesson plan...",
      loadingTitle: "Loading lesson...",
      unknownClass: "Unassigned class",
      dateLabel: "Date",
      loadError: "We couldn't load this lesson plan.",
    },
    resources: {
      title: "Resource Finder",
      searchLabel: "Search resources",
      searchPlaceholder: "Search resources...",
      filtersTitle: "Filters",
      typeFilter: {
        link: "Link",
        pdf: "PDF",
        ppt: "PPT",
        docx: "DOCX",
        image: "Image",
        video: "Video",
      },
      tagsLabel: "Tags",
      tagsPlaceholder: "Type a tag and press Enter",
      removeTagLabel: "Remove tag {tag}",
      stageLabel: "Stage",
      stagePlaceholder: "e.g. Stage 3",
      subjectLabel: "Subject",
      subjectPlaceholder: "e.g. Science",
      costLabel: "Cost",
      costFilters: {
        both: "All",
        free: "Free",
        paid: "Paid",
      },
      loading: "Searching resources...",
      empty: "No resources match your filters.",
      insert: "Insert",
      noInstructions: "No instructions provided.",
      added: "Resource added to lesson",
      error: "Couldn't add resource",
    },
    exports: {
      success: "Export ready",
      error: "We couldn't export the lesson plan.",
    },
    states: {
      creating: "Preparing your new lesson plan...",
      creatingDescription: "Setting up a fresh workspace for your ideas.",
      error: "We couldn't open the builder",
      errorDescription: "Please retry or refresh the page.",
      retry: "Try again",
      loading: "Loading lesson plan...",
    },
    toolbar: {
      draftStatus: "Draft",
      publishedStatus: "Published",
      previewLabel: "Preview",
      savingLabel: "Saving...",
      historyLabel: "Version history",
      lastSavedPrefix: "Last saved",
      noHistory: "No versions yet",
    },
    parts: {
      title: "Plan structure",
      empty: "Add parts to organise your plan.",
    },
    history: {
      title: "Recent versions",
      empty: "No saved versions yet.",
    },
    meta: {
      titleLabel: "Lesson title",
      summaryLabel: "Lesson summary",
      stageLabel: "Stage",
      stagePlaceholder: "Select a stage",
      objectivesLabel: "Objectives for this lesson",
      objectivesPlaceholder: "List the intended learning objectives, one per line...",
      successCriteriaLabel: "Success criteria",
      successCriteriaPlaceholder: "Describe how learners will show success, one per line...",
      subjectsLabel: "Subjects",
      durationLabel: "Duration",
      technologyLabel: "Technology",
      logoLabel: "Upload school logo",
      logoChangeLabel: "Change logo",
      logoUploadingLabel: "Uploading...",
      logoAlt: "School logo",
      dateLabel: "Lesson date",
      datePlaceholder: "Select a date",
    },
    canvas: {
      title: "Learning sequence",
      addStep: "Add step",
      empty: "Start by adding your first learning step.",
      stepCopy: {
        titlePlaceholder: "Name this learning step",
        learningGoalsLabel: "Learning goals",
        learningGoalsPlaceholder: "Paste or type the key student outcomes for this step...",
        durationLabel: "Duration",
        durationPlaceholder: "e.g. 10 minutes, 2 class periods",
        groupingLabel: "Grouping",
        deliveryLabel: "Delivery",
        instructionalNoteLabel: "Instructional notes",
        instructionalNotePlaceholder: "Teacher-facing reminders, facilitation moves, differentiation prompts...",
        searchResources: "Search resources",
        resourcesTitle: "Resources",
        resourcesEmpty: "No resources added yet.",
        resourceNotesLabel: "Resource notes",
        resourceNotesPlaceholder: "Add instructions or reminders for using this resource...",
      },
    },
    resourceSearch: {
      title: "Search resources",
      placeholder: "Search by keyword, URL, or tool",
      mediaLabel: "Media type",
      stageLabel: "Stage",
      subjectLabel: "Subject",
      tagsLabel: "Add tags",
      clearFilters: "Clear filters",
      empty: "Try adjusting your keywords or filters to find resources.",
      addLabel: "Add",
      loading: "Searching resources...",
      loadMoreLabel: "Load more",
      errorTitle: "We couldn't load resources right now.",
      errorDescription: "Please try again in a moment.",
      retryLabel: "Try again",
    },
    classLinking: {
      ariaLabel: "Link lesson plan to a class",
      placeholder: "Link to class",
      loading: "Loading classes...",
      noClasses: "No classes available",
      signedInHelp: "Linking a class adds this lesson to their schedule.",
      signedOutHelp: "Sign in to link this lesson to one of your classes.",
    },
    activities: {
      title: "Find activities",
      placeholder: "Search by topic, tool, or outcome",
      helper: "Type at least {min} characters to search our activity library.",
      addLabel: "Add to step",
      empty: "No activities match your search yet.",
    },
    standards: {
      title: "Standards & objectives",
      empty: "No standards available yet.",
      selectedLabel: "General objective",
    },
    preview: {
      title: "Lesson preview",
    },
  },
  account: {
    seo: {
      title: "My Account | SchoolTech Hub",
      description: "Manage your SchoolTech Hub profile, preferences, notifications, and security settings in one place.",
      canonical: "https://schooltechhub.com/account"
    },
    heading: {
      title: "My Account",
      subtitle: "Keep your personal details, privacy settings, and activity up to date."
    },
    image: {
      title: "Ready to upload",
      description: "Upload a square image under 2MB. We'll optimise it across SchoolTech Hub.",
      changeButton: "Change avatar",
      uploadButton: "Save new avatar"
    },
    personal: {
      title: "Personal information",
      description: "Update the details that appear on your profile.",
      firstNameLabel: "First name",
      firstNamePlaceholder: "e.g. Jordan",
      lastNameLabel: "Last name",
      lastNamePlaceholder: "e.g. Rivera",
      subjectLabel: "Subject focus",
      subjectPlaceholder: "e.g. Mathematics",
      phoneLabel: "Phone number",
      phonePlaceholder: "e.g. +1 555 123 4567",
      saveButton: "Save personal info"
    },
    school: {
      title: "School information",
      description: "Share your school's details to personalise lesson previews and exports.",
      nameLabel: "School name",
      namePlaceholder: "e.g. Riverside Elementary",
      logoLabel: "School logo",
      logoAlt: "School logo",
      logoPlaceholder: "No logo yet",
      logoHelp: "Use a square image under 1MB for the best results.",
      uploadButton: "Choose image",
      removeButton: "Remove logo",
      restoreButton: "Restore logo"
    },
    actions: {
      backToHome: "Back to homepage"
    },
    tabs: {
      overview: "Overview",
      classes: "Classes",
      lessonPlans: "Lesson Plans",
      savedPosts: "Saved Posts",
      activity: "Activity",
      security: "Security",
      settings: "Settings",
      research: "Research"
    },
    overview: {
      title: "My Dashboard",
      subtitle: "Here’s a personalized snapshot of your SchoolTech Hub activity and upcoming lessons.",
      ctas: {
        postBlog: "Post a blog",
        askQuestion: "Ask a question",
      },
      upcoming: {
        title: "Upcoming lessons",
        description: "Stay ready for what's next on your teaching calendar.",
        empty: "No upcoming lessons scheduled.",
        errorTitle: "Unable to load upcoming lessons",
        errorDescription: "Please try again in a moment.",
        retry: "Try again",
        dateTbd: "Date TBD",
      },
    },
    research: {
      badge: "Coming soon",
      cardTitle: "Research & Applications",
      cardDescription: "Preview our upcoming research hub for educators and partners.",
      cardBody:
        "Opt in to hear about pilot opportunities, classroom research, and application windows as soon as they open.",
      toggleLabel: "Notify me when applications open",
      toggleDescription: "We'll send an email when new research projects accept participants.",
      toggleAria: "Toggle research application notifications",
      notificationsEnabledTitle: "Notifications enabled",
      notificationsEnabledDescription: "We'll let you know as soon as new research applications open.",
      notificationsDisabledTitle: "Notifications updated",
      notificationsDisabledDescription: "You won't receive updates about new research opportunities.",
      errorTitle: "Unable to update preference",
      errorDescription: "Please try again in a moment.",
      tabTitle: "Research workspace",
      tabDescription: "We're preparing a dedicated space for research collaboration and applications.",
      tabHelper: "Check back soon for project listings and application tools.",
    },
    profile: {
      title: "Profile details",
      description: "This information is visible to collaborators across the platform.",
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Your name as it should appear",
      roleLabel: "Role",
      rolePlaceholder: "Select a role",
      roles: {
        Teacher: "Teacher",
        Admin: "Administrator",
        Parent: "Parent",
        Student: "Student",
        Other: "Other"
      },
      bioLabel: "Bio",
      bioPlaceholder: "Tell the community a little about yourself (optional)"
    },
    settings: {
      title: "Account preferences",
      description: "Customise how SchoolTech Hub works for you.",
      timezone: "Time zone",
      timezonePlaceholder: "e.g. GMT+1, London",
      language: "Content language",
      languagePlaceholder: "English",
      languageValue: "English",
      theme: "Theme",
      themePlaceholder: "Select a theme",
      themeOptions: {
        system: "Match system",
        light: "Light",
        dark: "Dark"
      },
      saveButton: "Save preferences"
    },
    security: {
      title: "Password",
      description: "Update your password to keep your account secure.",
      newPasswordLabel: "New password",
      confirmPasswordLabel: "Confirm new password",
      submitButton: "Update password"
    },
    notifications: {
      title: "Notifications",
      description: "Decide when you'd like to hear from us.",
      updates: "Product and newsletter updates",
      updatesDescription: "Occasional product announcements and curated resources.",
      commentReplies: "Comment replies",
      commentRepliesDescription: "Email me when someone responds to my comments.",
      productAnnouncements: "Service announcements",
      productAnnouncementsDescription: "Important information about maintenance or downtime.",
      blogMentions: "Blog mentions",
      blogMentionsDescription: "Alerts when one of my articles is published or featured."
    },
    activity: {
      title: "Activity summary",
      description: "Track your engagement at a glance.",
      comments: "Comments",
      posts: "Published posts",
      lastLogin: "Last sign in",
      neverLoggedIn: "No sign-in recorded yet"
    },
    resources: {
      manageCta: "Manage resources",
      heading: "My teaching resources",
      subheading: "Update the links and materials you've shared with the community.",
      seo: {
        title: "My Resources | SchoolTech Hub",
        description: "Review, update, and share your classroom resources from a single dashboard.",
        canonical: "https://schooltechhub.com/account/resources"
      },
      listTitle: "Your resources",
      listDescription: "Update details, refresh links, or share another resource with peers.",
      newCta: "Submit resource",
      empty: "You haven't added any resources yet.",
      emptyCta: "Add your first resource",
      viewLink: "Open resource",
      pagination: "Page {current} of {total}",
      toast: {
        created: "Resource submitted",
        updated: "Resource updated",
        deleted: "Resource removed",
        updateError: "We couldn't update that resource",
        deleteError: "We couldn't delete that resource"
      },
      instructionalNotesLabel: "Instructional notes",
      deleteConfirmTitle: "Remove this resource?",
      deleteConfirmBody: "This will delete the resource from your dashboard but won't remove it from existing lesson plans.",
      form: {
        title: "Submit a resource",
        editTitle: "Update resource",
        description: "Share resources you trust with fellow educators.",
        editDescription: "Keep the details, metadata, and notes accurate for this resource.",
        titleLabel: "Title",
        titlePlaceholder: "Resource name",
        urlLabel: "Link",
        descriptionLabel: "Summary",
        descriptionPlaceholder: "What does this resource help educators accomplish?",
        typeLabel: "Resource type",
        typePlaceholder: "e.g. Video, Template, Article",
        subjectsLabel: "Subject",
        subjectsPlaceholder: "Add a subject",
        gradeLabel: "Grade band",
        gradePlaceholder: "e.g. 3-5",
        formatLabel: "Format",
        formatPlaceholder: "PDF, Slides, Website...",
        tagsLabel: "Tags",
        tagsPlaceholder: "Add tags to help discovery",
        notesLabel: "Instructional notes",
        notesPlaceholder: "Explain how you use this resource in class",
        submit: "Save resource"
      },
      new: {
        heading: "Submit a new resource",
        subheading: "Share a classroom-ready resource with other educators.",
        seo: {
          title: "Submit Resource | SchoolTech Hub",
          description: "Add a new classroom resource for teachers to discover.",
          canonical: "https://schooltechhub.com/account/resources/new"
        }
      },
      edit: {
        heading: "Edit resource",
        subheading: "Keep resource details accurate before publishing.",
        seo: {
          title: "Edit {title} | SchoolTech Hub",
          description: "Update the metadata and notes for this teaching resource.",
          canonical: "https://schooltechhub.com/account/resources"
        }
      }
    },
    support: {
      title: "Need help?",
      description: "Our team is here to support any account changes.",
      contact: "Contact us if you need assistance updating your details or accessing content.",
      response: "We reply to most messages within one business day.",
      cta: "Contact support"
    },
    password: {
      title: "Reset password",
      description: "Choose a strong password that you haven't used elsewhere.",
      newPassword: "New password",
      newPasswordPlaceholder: "Enter a new password",
      confirmPassword: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter the new password",
      updateButton: "Update password"
    },
    securityTips: {
      title: "Security recommendations",
      description: "Best practices to keep your account safe.",
      tips: [
        "Enable multi-factor authentication when it becomes available.",
        "Use a password manager to generate unique passwords.",
        "Review your account activity regularly for unfamiliar changes.",
        "Sign out on shared devices after each session."
      ]
    },
    classes: {
      viewer: {
        calendarHelper: "Select a date to filter plans.",
        showAll: "Show all plans",
        attachExisting: "Attach existing plan",
        updating: "Updating results…",
        errorTitle: "Unable to load linked plans",
        errorDescription: "Please try again in a moment.",
        retry: "Try again",
        noScheduledDate: "No scheduled date",
        scheduledFor: "Scheduled for {date}",
        durationLabel: "Duration: {duration}",
        linkedOn: "Linked on {date}",
        unlink: "Unlink",
        emptyTitle: "No lesson plans match the current date filter.",
        emptyDescription: "Clear the filter or attach an existing plan using the button above.",
      },
      dashboard: {
        seoTitle: "Class dashboard | SchoolTech Hub",
        seoDescription: "Review your class schedule, linked lesson plans, and upcoming sessions in one place.",
        backToOverview: "Back to account overview",
        addLessonPlan: "Add lesson plan",
        errorTitle: "Unable to load class",
        errorDescription: "We couldn't retrieve this class. Please try again.",
        notFoundTitle: "Class not found",
        notFoundDescription: "This class may have been removed or you no longer have access to it.",
        lessonCount: "Lesson plans: {count}",
        lessonCountLoading: "Lesson plans: —",
        noSummary: "Keep track of attendance, assignments, and resources for this class.",
        overviewLessonsLabel: "Lesson plans linked",
        overviewLessonsDescription: "Use the lesson builder tab to draft and refine your planning notes.",
        overviewCurriculumLabel: "Curriculum alignment",
        overviewCurriculumValue: "Launch from curriculum tab",
        overviewCurriculumDescription: "Filters, class, and dates carry over when you open the lesson builder.",
        overviewReportsLabel: "Student insights",
        overviewReportsValue: "Prepare AI reports",
        overviewReportsDescription: "Capture behaviour and appraisal notes before requesting a progress summary.",
        scheduleLabel: "Meeting details",
        schedulePlaceholder: "Add meeting times to help you stay organised.",
        dateRangePlaceholder: "Set class start and end dates to build a clear timeline.",
        capacityLabel: "Enrollment",
        capacityValue: "{current} of {max} learners enrolled",
        capacityUnknown: "Enrollment details not provided",
        openMeeting: "Open virtual meeting",
        nextClassLabel: "Next session",
        nextClassPlaceholder: "No upcoming sessions scheduled",
        locationLabel: "Location",
        virtualLocation: "Virtual classroom",
        noLocation: "Location not set",
        lessonPlansTitle: "Lesson plans",
        quickActions: "Quick actions",
        managePlans: "Manage lesson plans",
        workspaceTipsTitle: "Workspace tips",
        workspaceTipsDescription: "Keep everything connected as you move between tabs.",
        workspaceTips: [
          "Create or refine your curriculum entries before launching the lesson builder.",
          "Attach resources from the builder so every handout and link lives with the plan.",
          "Use Assessment Tracking to record results that feed into AI-generated progress reports.",
        ],
      },
      schedule: {
        title: "Recurring class schedule",
        description: "Set up a repeating class schedule and preview upcoming sessions. We'll highlight these dates on your calendar.",
        startDate: "Start date",
        startTime: "Start time",
        frequencyLabel: "Repeat",
        frequencyOptions: {
          daily: "Every day",
          weekly: "Weekly",
        },
        frequencyDailyHelper: "Create a daily schedule for intensive programmes or revision weeks.",
        frequencyWeeklyHelper: "Choose the days of the week this class meets.",
        intervalLabel: "Repeat every",
        intervalHelper: "Number of days or weeks between sessions.",
        weeklyDays: "Days of the week",
        durationLabel: "Lesson duration (minutes)",
        durationHelper: "Used for your schedule highlights.",
        endLabel: "End schedule",
        endOptions: {
          count: "After a number of sessions",
          date: "On a specific date",
        },
        endCountLabel: "Stop after",
        endDateLabel: "End date",
        saveButton: "Save schedule",
        resetButton: "Reset",
        occurrencesTitle: "Upcoming sessions ({count})",
        occurrencesEmpty: "Once you save a schedule the next sessions will appear here.",
        durationShort: "{minutes} min",
        additionalOccurrences: "And {count} more sessions",
        summaryEmpty: "No schedule saved yet",
        summaryDaily: "Repeats daily starting {date}",
        summaryWeekly: "Repeats on {days}, next on {date}",
      },
    },
    savedPosts: {
      title: "Saved posts",
      description: "Quickly revisit the articles you've bookmarked.",
      empty: "You haven't saved any posts yet.",
      savedOn: "Saved on {date}",
      viewPost: "View article",
      remove: "Remove",
      unavailable: "This post is no longer available.",
      toast: {
        removed: "Removed from saved posts",
        removeError: "We couldn't remove that saved post"
      }
    },
    comments: {
      title: "My comments",
      description: "Jump back into conversations you've started or joined.",
      empty: "You haven't posted any comments yet.",
      viewPost: "View blog post"
    },
    blogs: {
      title: "My blog posts",
      description: "Keep an eye on the posts you're contributing to.",
      empty: "No blog posts are linked to your account yet.",
      statusPublished: "Published",
      statusDraft: "Draft",
      readPost: "Open article"
    },
    toast: {
      classCreated: "Class created",
      classCreatedDescription: "“{title}” has been added to your classes.",
      attachedToClass: "Attached to class",
      attachedToClassDescription: "The lesson plan is now linked to this class.",
      schoolInfoSaved: "School info saved",
      profileUpdated: "Profile updated",
      passwordMismatch: "Passwords must match",
      passwordLength: "Passwords need to be at least 8 characters.",
      passwordUpdated: "Password updated",
      passwordError: "We couldn't update your password",
      notificationsUpdated: "Notification preferences saved",
      settingsUpdated: "Account settings saved",
      avatarUpdated: "Profile image updated",
      avatarError: "We couldn't upload that image"
    }
  },
  blogBuilder: {
    seo: {
      title: "Build a blog post",
      description: "Draft your story, attach helpful links, and send it to our editorial team for review.",
      canonical: "https://schooltechub.com/blog/new",
    },
    heading: "Build a blog post",
    subheading: "Share classroom wins, reflections, and big ideas. Submissions are reviewed before publishing.",
    sections: {
      detailsTitle: "Post details",
      detailsDescription: "Give your post a clear title, who it's from, and an optional summary.",
      contentTitle: "Write your post",
      contentDescription: "Add your story, supporting links, and resources readers should explore.",
    },
    fields: {
      title: "Post title",
      titlePlaceholder: "What should readers know at a glance?",
      authorName: "Display name",
      authorPlaceholder: "How should we credit this post?",
      excerpt: "Short summary (optional)",
      excerptPlaceholder: "A quick preview that will appear on cards and social media.",
      excerptHelper: "Keep it under 280 characters for the best fit across the site.",
      coverImage: "Featured image",
      removeImage: "Remove image",
      imageHelper: "Upload a landscape image (1200x630 works best). We'll host it privately in {bucket} until published.",
      body: "Post body",
      bodyPlaceholder: "Share your ideas, classroom stories, or practical tips...",
      bodyHelper: "Use blank lines to create new paragraphs. We'll handle formatting when it's published.",
    },
    links: {
      title: "Helpful links",
      helper: "Add websites, resources, or references you mention in the article.",
      add: "Add link",
      label: "Link label",
      labelPlaceholder: "Optional label",
      url: "URL",
      urlPlaceholder: "https://",
      remove: "Remove",
      empty: "No links added yet.",
    },
    actions: {
      submit: "Submit for review",
      submitting: "Submitting…",
      helper: "Uploaded images are stored in the {bucket} bucket until your post is approved.",
    },
    success: {
      title: "Submission received",
      description: "Thanks for sharing! Our editorial team will review your post and follow up if it’s approved.",
      accountCta: "Back to dashboard",
      newCta: "Draft another post",
    },
    toast: {
      successTitle: "Post submitted",
      successDescription: "We'll let you know once it's been reviewed.",
      errorTitle: "Submission failed",
      errorDescription: "Something went wrong while saving your post.",
      imageError: "We couldn't upload the featured image",
    },
  },
  common: {
    loading: "Loading...",
    error: "An error occurred",
    tryAgain: "Try Again",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    close: "Close",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    share: "Share",
    download: "Download",
    upload: "Upload",
    next: "Next",
    previous: "Previous",
    yes: "Yes",
    no: "No"
  }
};