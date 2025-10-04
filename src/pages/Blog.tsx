import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Calendar,
  Clock,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  ChevronDown,
  BookOpen,
  Microscope,
  ShoppingBag,
  Tag,
  User,
  Bookmark,
  Activity,
  ArrowRight,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const extractTags = (tags: string[] | string | null | undefined) => {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  return [];
};

type NewsletterRole = "Teacher" | "Admin" | "Parent" | "Student" | "Other";

type SavedPostSummary = {
  id: string;
  createdAt: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
};

type ActivitySummary = {
  id: string;
  action: string;
  createdAt: string;
  description: string;
};

type ResearchHighlight = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  publishedAt: string | null;
};

type BlogFilters = {
  filterType: string[];
  stage: string[];
  subject: string[];
  delivery: string[];
  payment: string[];
  platform: string[];
};

type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  subtitle?: string | null;
  tags?: string[] | string | null;
  category?: string | null;
  filter_type?: string | null;
  featured_image?: string | null;
  read_time?: number | string | null;
  time_required?: string | null;
  published_at?: string | null;
  author?: { name?: string | null } | string | null;
  author_image?: string | null;
  author_job_title?: string | null;
  stage?: string | null;
  subject?: string | null;
};

type SavedPostRow = {
  id: string | number | null;
  created_at: string | null;
  post: {
    id: string | number | null;
    title: string | null;
    slug: string | null;
    excerpt: string | null;
    published_at: string | null;
  } | null;
};

type ActivityLogRow = {
  id: string | number | null;
  action: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

type ResearchHighlightRow = {
  id: string | number | null;
  title: string | null;
  slug: string | null;
  summary: string | null;
  published_at: string | null;
};

const FALLBACK_SAVED_POSTS: SavedPostSummary[] = [
  {
    id: "demo-saved-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    title: "Designing exit tickets that inform tomorrow's lesson",
    slug: "designing-exit-tickets",
    excerpt: "Use quick pulse-checks to adjust instruction in the moment.",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "demo-saved-2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    title: "Co-creating classroom norms with students",
    slug: "co-creating-classroom-norms",
    excerpt: "Collaborative agreements that boost participation and voice.",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

const FALLBACK_ACTIVITY: ActivitySummary[] = [
  {
    id: "demo-activity-1",
    action: "lesson_created",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    description: "You drafted a new science lesson in the builder.",
  },
  {
    id: "demo-activity-2",
    action: "blog_saved",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    description: "Saved “Literacy routines that boost writing stamina”.",
  },
  {
    id: "demo-activity-3",
    action: "question_posted",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    description: "Asked the community for STEM project ideas.",
  },
];

const FALLBACK_RESEARCH: ResearchHighlight[] = [
  {
    id: "demo-research-1",
    title: "What classrooms gain from micro-reflections",
    slug: "micro-reflections",
    summary: "Quick journaling boosts retention and provides formative insight.",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: "demo-research-2",
    title: "A small-group approach to maths differentiation",
    slug: "small-group-maths",
    summary: "Targeted workshops helped learners close skill gaps within three weeks.",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: "demo-research-3",
    title: "Student-led inquiry in middle school science",
    slug: "student-led-inquiry",
    summary: "Students framed essential questions and presented findings to peers.",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
  },
];

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [blogPosts, setBlogPosts] = useState<BlogPostRecord[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPostRecord | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterJob, setNewsletterJob] = useState("");
  const [newsletterRole, setNewsletterRole] = useState<NewsletterRole>("Teacher");
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const accentCardClass =
    "border-2 border-primary/35 shadow-[0_0_20px_hsl(var(--glow-primary)/0.08)] transition-colors duration-300 hover:border-primary/75";
  
  const [filters, setFilters] = useState<BlogFilters>({
    filterType: searchParams.getAll("filterType") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || [],
    delivery: searchParams.getAll("delivery") || [],
    payment: searchParams.getAll("payment") || [],
    platform: searchParams.getAll("platform") || [],
  });

  useEffect(() => {
    // Sync search term from URL when it changes
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user ?? null);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const filterCategories = useMemo(
    () => [
      { value: "Edu Tech", label: t.blog.filters.categories.eduTech, icon: <BookOpen className="h-4 w-4" /> },
      { value: "Tutorials", label: t.blog.filters.categories.tutorials, icon: <GraduationCap className="h-4 w-4" /> },
      { value: "Teaching Techniques", label: t.blog.filters.categories.teachingTechniques, icon: <Lightbulb className="h-4 w-4" /> },
      { value: "Class Activity", label: t.blog.filters.categories.classActivity, icon: <GraduationCap className="h-4 w-4" /> },
      { value: "Teacher Reflection", label: t.blog.filters.categories.teacherReflection, icon: <MessageSquare className="h-4 w-4" /> },
      { value: "Tips", label: t.blog.filters.categories.tips, icon: <Lightbulb className="h-4 w-4" /> },
      { value: "Shop", label: t.blog.filters.categories.shop, icon: <ShoppingBag className="h-4 w-4" /> },
      { value: "Case Study", label: t.blog.filters.categories.caseStudy, icon: <BookOpen className="h-4 w-4" /> },
      { value: "Research", label: t.blog.filters.categories.research, icon: <Microscope className="h-4 w-4" /> },
      { value: "Teacher Debates", label: t.blog.filters.categories.teacherDebates, icon: <MessageSquare className="h-4 w-4" /> }
    ],
    [t]
  );

  const stageOptions = useMemo(
    () => [
      { value: "Early Childhood", label: t.blog.filters.stages.earlyChildhood },
      { value: "Pre-K", label: t.blog.filters.stages.preK },
      { value: "Kindergarten", label: t.blog.filters.stages.kindergarten },
      { value: "Primary", label: t.blog.filters.stages.primary },
      { value: "Secondary", label: t.blog.filters.stages.secondary },
      { value: "High School", label: t.blog.filters.stages.highSchool },
      { value: "K-12", label: t.blog.filters.stages.k12 },
      { value: "K-5", label: t.blog.filters.stages.k5 }
    ],
    [t]
  );

  const subjectOptions = useMemo(
    () => [
      { value: "Phonics", label: t.blog.filters.subjects.phonics },
      { value: "English", label: t.blog.filters.subjects.english },
      { value: "Math", label: t.blog.filters.subjects.math },
      { value: "Science", label: t.blog.filters.subjects.science },
      { value: "Biology", label: t.blog.filters.subjects.biology },
      { value: "Chemistry", label: t.blog.filters.subjects.chemistry },
      { value: "Physics", label: t.blog.filters.subjects.physics },
      { value: "Earth Science", label: t.blog.filters.subjects.earthScience },
      { value: "History", label: t.blog.filters.subjects.history },
      { value: "Geography", label: t.blog.filters.subjects.geography },
      { value: "Music", label: t.blog.filters.subjects.music },
      { value: "Arts", label: t.blog.filters.subjects.arts },
      { value: "ICT", label: t.blog.filters.subjects.ict },
      { value: "PE", label: t.blog.filters.subjects.pe },
      { value: "Global Perspective", label: t.blog.filters.subjects.globalPerspective },
      { value: "Circle Time", label: t.blog.filters.subjects.circleTime },
      { value: "Break Time", label: t.blog.filters.subjects.breakTime },
      { value: "STEAM", label: t.blog.filters.subjects.steam }
    ],
    [t]
  );

  const deliveryOptions = useMemo(
    () => [
      { value: "In-class", label: t.blog.filters.deliveries.inClass },
      { value: "Online", label: t.blog.filters.deliveries.online },
      { value: "Live", label: t.blog.filters.deliveries.live },
      { value: "Homework", label: t.blog.filters.deliveries.homework }
    ],
    [t]
  );

  const paymentOptions = useMemo(
    () => [
      { value: "Free", label: t.blog.filters.payments.free },
      { value: "Paid", label: t.blog.filters.payments.paid },
      { value: "Education Discount", label: t.blog.filters.payments.educationDiscount }
    ],
    [t]
  );

  const platformOptions = useMemo(
    () => [
      { value: "Mobile App", label: t.blog.filters.platforms.mobileApp },
      { value: "Webapp", label: t.blog.filters.platforms.webapp },
      { value: "Smartphone", label: t.blog.filters.platforms.smartphone },
      { value: "Smartboard", label: t.blog.filters.platforms.smartboard },
      { value: "Mac", label: t.blog.filters.platforms.mac },
      { value: "Windows", label: t.blog.filters.platforms.windows }
    ],
    [t]
  );

  const newsletterRoles = useMemo(
    () => [
      { value: "Teacher" as NewsletterRole, label: t.blog.newsletter.roles.teacher },
      { value: "Admin" as NewsletterRole, label: t.blog.newsletter.roles.admin },
      { value: "Parent" as NewsletterRole, label: t.blog.newsletter.roles.parent },
      { value: "Student" as NewsletterRole, label: t.blog.newsletter.roles.student },
      { value: "Other" as NewsletterRole, label: t.blog.newsletter.roles.other }
    ],
    [t]
  );

  const savedPostsQuery = useQuery({
    queryKey: ["blog-saved-posts", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => (user ? fetchSavedPosts(user.id) : Promise.resolve([])),
  });

  const activityQuery = useQuery({
    queryKey: ["blog-activity", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => (user ? fetchActivityLog(user.id) : Promise.resolve([])),
  });

  const researchHighlightsQuery = useQuery({
    queryKey: ["blog-research-highlights"],
    queryFn: fetchResearchHighlights,
  });

  const savedPosts = savedPostsQuery.data && savedPostsQuery.data.length > 0
    ? savedPostsQuery.data
    : user
    ? FALLBACK_SAVED_POSTS
    : [];

  const activityEntries = activityQuery.data && activityQuery.data.length > 0 ? activityQuery.data : FALLBACK_ACTIVITY;

  const researchHighlights = researchHighlightsQuery.data && researchHighlightsQuery.data.length > 0
    ? researchHighlightsQuery.data
    : FALLBACK_RESEARCH;

  const formatDisplayDate = (value: string | null | undefined) => {
    if (!value) {
      return "Today";
    }

    try {
      return format(parseISO(value), "PPP");
    } catch {
      return value;
    }
  };

  const filterOptions = useMemo(
    () => ({
      stage: stageOptions,
      subject: subjectOptions,
      delivery: deliveryOptions,
      payment: paymentOptions,
      platform: platformOptions,
    }),
    [stageOptions, subjectOptions, deliveryOptions, paymentOptions, platformOptions],
  );

  const fetchBlogPosts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      // For now, we'll filter by category which exists in the blogs table
      if (filters.filterType.length > 0) {
        query = query.in("category", filters.filterType);
      }

      const { data, error } = await query.order("published_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const [first, ...rest] = data as BlogPostRecord[];
        setFeaturedPost(first);
        setBlogPosts(rest);
      } else {
        setFeaturedPost(null);
        setBlogPosts([]);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    void fetchBlogPosts();
  }, [fetchBlogPosts]);

  const toggleFilter = (filterType: keyof BlogFilters, value: string) => {
    setFilters(prev => {
      const hasValue = prev[filterType].includes(value);
      const next: BlogFilters = {
        ...prev,
        [filterType]: hasValue ? prev[filterType].filter(v => v !== value) : [...prev[filterType], value],
      };

      const params = new URLSearchParams(searchParams);
      params.delete(filterType);
      next[filterType].forEach(v => params.append(filterType, v));
      setSearchParams(params, { replace: true });

      return next;
    });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: newsletterEmail,
        full_name: newsletterName,
        job_position: newsletterJob,
        role: newsletterRole,
        segments: ["teacher_updates"]
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: t.blog.newsletter.toast.duplicateTitle,
          description: t.blog.newsletter.toast.duplicateDescription,
          variant: "destructive"
        });
      } else {
        toast({
          title: t.blog.newsletter.toast.errorTitle,
          description: t.blog.newsletter.toast.errorDescription,
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: t.blog.newsletter.toast.successTitle,
        description: t.blog.newsletter.toast.successDescription
      });
      setNewsletterEmail("");
      setNewsletterName("");
      setNewsletterJob("");
    }
  };

  const getCategoryIcon = (filterType: string) => {
    const category = filterCategories.find(cat => cat.value === filterType);
    return category?.icon || <BookOpen className="h-4 w-4" />;
  };

  const getCategoryLabel = (filterType: string | null | undefined) => {
    if (!filterType) return null;
    return filterCategories.find(cat => cat.value === filterType)?.label || filterType;
  };

  const getOptionLabel = (options: { value: string; label: string }[], value?: string | null) => {
    if (!value) return null;
    return options.find(option => option.value === value)?.label || value;
  };

  const getReadTimeLabel = (
    readTime?: number | string | null,
    timeRequired?: string | null
  ) => {
    if (readTime !== null && readTime !== undefined && readTime !== "") {
      const parsed = typeof readTime === "number" ? readTime : parseInt(readTime, 10);

      if (!Number.isNaN(parsed) && parsed > 0) {
        return t.blog.readTime.minutes.replace("{minutes}", String(parsed));
      }
    }

    if (timeRequired) {
      const normalized = String(timeRequired).trim();

      if (normalized.length > 0) {
        return normalized;
      }
    }

    return null;
  };

  const featuredTags = extractTags(featuredPost?.tags);
  const featuredReadTime = getReadTimeLabel(featuredPost?.read_time, featuredPost?.time_required);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={t.blog.seo.title}
        description={t.blog.seo.description}
        canonicalUrl="https://schooltechhub.com/blog"
        type="website"
        lang={language}
      />
      
      <main className="flex-1">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t.blog.hero.title}</h1>
            <p className="text-white">{t.blog.hero.subtitle}</p>
          </div>

          {user ? (
            <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <Card className="border border-primary/30 bg-background/80 shadow-[0_0_20px_hsl(var(--glow-primary)/0.08)]">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Bookmark className="h-4 w-4 text-primary" />
                      {t.blog.savedPosts.title}
                    </CardTitle>
                    <CardDescription>{t.blog.savedPosts.subtitle}</CardDescription>
                  </div>
                  <Badge variant="secondary">{savedPosts.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {savedPosts.length ? (
                    savedPosts.slice(0, 3).map(post => (
                      <div key={post.id} className="space-y-1">
                        <Link
                          to={getLocalizedPath(`/blog/${post.slug}`, language)}
                          className="font-medium text-foreground hover:underline"
                        >
                          {post.title}
                        </Link>
                        {post.excerpt ? (
                          <p className="text-xs text-muted-foreground">{post.excerpt}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {t.blog.savedPosts.savedOn.replace("{date}", formatDisplayDate(post.createdAt))}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.blog.savedPosts.empty}</p>
                  )}
                  <div className="pt-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={getLocalizedPath("/account?tab=savedPosts", language)}>
                        {t.blog.savedPosts.manage}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-primary/30 bg-background/80 shadow-[0_0_20px_hsl(var(--glow-primary)/0.08)]">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-4 w-4 text-primary" />
                      {t.blog.communityActivity.title}
                    </CardTitle>
                    <CardDescription>{t.blog.communityActivity.subtitle}</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={getLocalizedPath("/forum/new", language)}>
                      <MessageSquare className="mr-2 h-4 w-4" /> {t.blog.communityActivity.askQuestion}
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {activityEntries.slice(0, 4).map(entry => (
                    <div key={entry.id} className="space-y-1">
                      <p className="font-medium text-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDisplayDate(entry.createdAt)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-primary/30 bg-background/80 shadow-[0_0_20px_hsl(var(--glow-primary)/0.08)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    {t.blog.researchHighlights.title}
                  </CardTitle>
                  <CardDescription>{t.blog.researchHighlights.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {researchHighlights.slice(0, 3).map(item => (
                    <div key={item.id} className="space-y-1">
                      <Link
                        to={item.slug ? getLocalizedPath(`/blog/${item.slug}`, language) : getLocalizedPath("/blog", language)}
                        className="font-medium text-foreground hover:underline"
                      >
                        {item.title}
                      </Link>
                      {item.summary ? (
                        <p className="text-xs text-muted-foreground">{item.summary}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">{formatDisplayDate(item.publishedAt)}</p>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={getLocalizedPath("/blog/new", language)}>
                        <ArrowRight className="mr-2 h-4 w-4" /> {t.blog.researchHighlights.share}
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={getLocalizedPath("/research", language)}>
                        {t.blog.researchHighlights.explore}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Filters */}
            <div className="lg:col-span-1">
              <Card className={accentCardClass}>
                <CardHeader>
                  <CardTitle>{t.blog.filters.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Filter */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">{t.blog.filters.category}</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterCategories.map((cat) => (
                        <label key={cat.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.filterType.includes(cat.value)}
                            onChange={() => toggleFilter("filterType", cat.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm flex items-center gap-1">
                            {cat.icon}
                            {cat.label}
                          </span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Stage Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">{t.blog.filters.stage}</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.stage.map((stage) => (
                        <label key={stage.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.stage.includes(stage.value)}
                            onChange={() => toggleFilter("stage", stage.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{stage.label}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Subject Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">{t.blog.filters.subject}</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.subject.map((subject) => (
                        <label key={subject.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.subject.includes(subject.value)}
                            onChange={() => toggleFilter("subject", subject.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{subject.label}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Delivery Type Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">{t.blog.filters.delivery}</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.delivery.map((type) => (
                        <label key={type.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.delivery.includes(type.value)}
                            onChange={() => toggleFilter("delivery", type.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{type.label}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Payment Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">{t.blog.filters.payment}</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.payment.map((type) => (
                        <label key={type.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.payment.includes(type.value)}
                            onChange={() => toggleFilter("payment", type.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{type.label}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Platform Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">{t.blog.filters.platform}</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.platform.map((platform) => (
                        <label key={platform.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.platform.includes(platform.value)}
                            onChange={() => toggleFilter("platform", platform.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{platform.label}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-3 space-y-8">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-white">{t.blog.states.loading}</p>
                </div>
              ) : (
                <>
                  {/* Featured Post */}
                  {featuredPost && (
                    <Card className={cn("overflow-hidden", accentCardClass)}>
                      <div className="relative h-64 bg-gradient-to-br from-primary/10 to-primary/5">
                        {featuredPost.featured_image && (
                          <img
                            src={featuredPost.featured_image}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                        <div className="absolute bottom-0 p-6">
                          <div className="flex flex-col gap-3 mb-3">
                            <div className="flex flex-wrap gap-2">
                              {featuredPost.filter_type && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  {getCategoryIcon(featuredPost.filter_type)}
                                  {getCategoryLabel(featuredPost.filter_type)}
                                </Badge>
                              )}
                              {!featuredPost.filter_type && (
                                <Badge variant="secondary">{t.blog.badges.featured}</Badge>
                              )}
                              {featuredTags.map(tag => (
                                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                              {featuredPost.published_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(new Date(featuredPost.published_at), "MMM d, yyyy")}</span>
                                </div>
                              )}
                              {featuredReadTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{featuredReadTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold mb-2">
                            <Link
                              to={getLocalizedPath(`/blog/${featuredPost.slug}`, language)}
                              className="hover:text-primary"
                            >
                              {featuredPost.title}
                            </Link>
                          </h2>
                          {featuredPost.subtitle && (
                            <p className="text-white">{featuredPost.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Blog Posts Grid */}
                  {blogPosts.length === 0 && !featuredPost ? (
                    <div className="text-center py-12">
                      <p className="text-white">{t.blog.states.empty}</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {blogPosts.map((post) => {
                        const tags = extractTags(post.tags);
                        const readTimeLabel = getReadTimeLabel(post.read_time, post.time_required);

                        return (
                          <Card key={post.id} className={cn("transition-shadow hover:shadow-lg", accentCardClass)}>
                            <CardContent className="p-6">
                              <div className="flex flex-col gap-3 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  {post.filter_type && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      {getCategoryIcon(post.filter_type)}
                                      {getCategoryLabel(post.filter_type)}
                                    </Badge>
                                  )}
                                </div>

                                {tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                                  {post.published_at && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>{format(new Date(post.published_at), "MMM d, yyyy")}</span>
                                    </div>
                                  )}
                                  {readTimeLabel && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{readTimeLabel}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <h3 className="text-xl font-semibold mb-2">
                                <Link to={getLocalizedPath(`/blog/${post.slug}`, language)} className="hover:text-primary">
                                  {post.title}
                                </Link>
                              </h3>

                              {post.excerpt && (
                                <p className="text-white mb-4">{post.excerpt}</p>
                              )}

                              {(post.author || post.author_image || post.author_job_title) && (
                                <div className="flex items-center gap-3 mb-3">
                                  {post.author_image ? (
                                    <img
                                      src={post.author_image}
                                      alt={typeof post.author === 'object' ? post.author.name : t.blog.author.default}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="h-5 w-5 text-primary" />
                                    </div>
                                  )}
                                  <div className="text-sm">
                                    <p className="font-medium">
                                      {typeof post.author === 'object' ? post.author.name : t.blog.author.default}
                                    </p>
                                    {post.author_job_title && (
                                      <p className="text-white">{post.author_job_title}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {getOptionLabel(filterOptions.stage, post.stage) && (
                                  <Badge variant="outline">{getOptionLabel(filterOptions.stage, post.stage)}</Badge>
                                )}
                                {getOptionLabel(filterOptions.subject, post.subject) && (
                                  <Badge variant="outline">{getOptionLabel(filterOptions.subject, post.subject)}</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Newsletter Signup */}
                  <Card className={accentCardClass}>
                    <CardHeader>
                      <CardTitle>{t.blog.newsletter.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {t.blog.newsletter.description && (
                        <p className="text-sm text-white mb-4">
                          {t.blog.newsletter.description}
                        </p>
                      )}
                      <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            type="email"
                            placeholder={t.blog.newsletter.emailPlaceholder}
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            required
                          />
                          <Input
                            type="text"
                            placeholder={t.blog.newsletter.namePlaceholder}
                            value={newsletterName}
                            onChange={(e) => setNewsletterName(e.target.value)}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            type="text"
                            placeholder={t.blog.newsletter.jobPlaceholder}
                            value={newsletterJob}
                            onChange={(e) => setNewsletterJob(e.target.value)}
                          />
                          <select
                            value={newsletterRole}
                            onChange={(e) => setNewsletterRole(e.target.value as NewsletterRole)}
                            aria-label={t.blog.newsletter.roleLabel}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {newsletterRoles.map(role => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="submit" className="w-full">
                          {t.blog.newsletter.submit}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {!user ? (
            <section className="mt-16">
              <Card className="border border-primary/30 bg-background/80 shadow-[0_0_20px_hsl(var(--glow-primary)/0.08)]">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t.blog.lockedFeatures.title}
                  </CardTitle>
                  <CardDescription>{t.blog.lockedFeatures.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      {
                        icon: <Bookmark className="h-4 w-4" />,
                        title: t.blog.lockedFeatures.savedPosts.title,
                        description: t.blog.lockedFeatures.savedPosts.description,
                      },
                      {
                        icon: <Activity className="h-4 w-4" />,
                        title: t.blog.lockedFeatures.communityActivity.title,
                        description: t.blog.lockedFeatures.communityActivity.description,
                      },
                      {
                        icon: <FlaskConical className="h-4 w-4" />,
                        title: t.blog.lockedFeatures.researchHighlights.title,
                        description: t.blog.lockedFeatures.researchHighlights.description,
                      },
                    ].map(feature => (
                      <Button
                        key={feature.title}
                        variant="outline"
                        className="h-full flex flex-col items-start gap-2 border-dashed"
                        asChild
                      >
                        <Link to={getLocalizedPath("/auth?intent=signup", language)}>
                          <span className="flex items-center gap-2 text-base font-semibold">
                            {feature.icon}
                            {feature.title}
                          </span>
                          <span className="text-sm text-muted-foreground text-left block">
                            {feature.description}
                          </span>
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}
        </div>
      </main>

      
    </div>
  );
};

export default Blog;

const randomId = () => Math.random().toString(36).slice(2);

const isTableMissing = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "42P01" || code === "42703";
};

async function fetchSavedPosts(userId: string): Promise<SavedPostSummary[]> {
  const { data, error } = await supabase
    .from("saved_posts")
    .select(
      `id, created_at, post:blogs!inner ( id, title, slug, excerpt, published_at )`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    if (isTableMissing(error)) {
      return FALLBACK_SAVED_POSTS;
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const records = (data ?? []) as SavedPostRow[];

  return records
    .map(record => {
      const post = record.post;
      if (!post) {
        return null;
      }

      return {
        id: String(record.id ?? randomId()),
        createdAt: record.created_at ?? new Date().toISOString(),
        title: typeof post.title === "string" && post.title.length > 0 ? post.title : "Untitled post",
        slug: typeof post.slug === "string" && post.slug.length > 0 ? post.slug : "blog",
        excerpt: post.excerpt ?? null,
        publishedAt: post.published_at ?? null,
      } satisfies SavedPostSummary;
    })
    .filter((item): item is SavedPostSummary => Boolean(item));
}

async function fetchActivityLog(userId: string): Promise<ActivitySummary[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, metadata, created_at")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    if (isTableMissing(error)) {
      return FALLBACK_ACTIVITY;
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const records = (data ?? []) as ActivityLogRow[];

  return records.map(record => {
    const metadata = record.metadata ?? {};
    const action = typeof record.action === "string" ? record.action : "activity";
    const description = buildActivityDescription(action, metadata);
    return {
      id: String(record.id ?? randomId()),
      action,
      createdAt: record.created_at ?? new Date().toISOString(),
      description,
    } satisfies ActivitySummary;
  });
}

async function fetchResearchHighlights(): Promise<ResearchHighlight[]> {
  const { data, error } = await supabase
    .from("research_blog")
    .select("id, title, slug, summary, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    if (isTableMissing(error)) {
      return FALLBACK_RESEARCH;
    }
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const records = (data ?? []) as ResearchHighlightRow[];

  return records.map(record => ({
    id: String(record.id ?? randomId()),
    title: typeof record.title === "string" && record.title.length > 0 ? record.title : "Research highlight",
    slug: typeof record.slug === "string" && record.slug.length > 0 ? record.slug : null,
    summary: record.summary ?? null,
    publishedAt: record.published_at ?? null,
  } satisfies ResearchHighlight));
}

function buildActivityDescription(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case "lesson_created": {
      const title = typeof metadata.title === "string" ? metadata.title : "a new lesson";
      return `Created ${title} in the lesson builder.`;
    }
    case "blog_saved": {
      const title = typeof metadata.title === "string" ? metadata.title : "a blog post";
      return `Saved “${title}” for later.`;
    }
    case "question_posted": {
      const title = typeof metadata.title === "string" ? metadata.title : "a community question";
      return `Started a discussion: ${title}.`;
    }
    default: {
      const label = action.replace(/_/g, " ");
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
  }
}