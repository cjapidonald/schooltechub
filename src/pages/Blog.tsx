import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Clock, GraduationCap, Lightbulb, MessageSquare, ChevronDown, BookOpen, Microscope, ShoppingBag, Tag, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

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

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [featuredPost, setFeaturedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterJob, setNewsletterJob] = useState("");
  const [newsletterRole, setNewsletterRole] = useState<NewsletterRole>("Teacher");
  const { toast } = useToast();
  const { language, t } = useLanguage();
  
  const [filters, setFilters] = useState({
    filterType: searchParams.getAll("filterType") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || [],
    delivery: searchParams.getAll("delivery") || [],
    payment: searchParams.getAll("payment") || [],
    platform: searchParams.getAll("platform") || []
  });

  useEffect(() => {
    // Sync search term from URL when it changes
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

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

  const filterOptions = useMemo(
    () => ({
      stage: stageOptions,
      subject: subjectOptions,
      delivery: deliveryOptions,
      payment: paymentOptions,
      platform: platformOptions
    }),
    [stageOptions, subjectOptions, deliveryOptions, paymentOptions, platformOptions]
  );

  useEffect(() => {
    fetchBlogPosts();
  }, [searchTerm, filters, language]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("content_master")
        .select("*")
        .in("page", ["research_blog", "edutech", "teacher_diary"]) 
        .eq("is_published", true)
        .eq("language", language);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,subtitle.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      if (filters.filterType.length > 0) {
        query = query.in("filter_type", filters.filterType as any);
      }

      if (filters.stage.length > 0) {
        query = query.in("stage", filters.stage as any);
      }

      if (filters.subject.length > 0) {
        query = query.in("subject", filters.subject as any);
      }

      if (filters.delivery.length > 0) {
        query = query.in("delivery_type", filters.delivery as any);
      }

      if (filters.payment.length > 0) {
        query = query.in("payment", filters.payment as any);
      }

      if (filters.platform.length > 0) {
        query = query.in("platform", filters.platform as any);
      }

      const { data, error } = await query.order("published_at", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setFeaturedPost(data[0]);
        setBlogPosts(data.slice(1));
      } else {
        setFeaturedPost(null);
        setBlogPosts([]);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType].includes(value)
        ? filters[filterType].filter(v => v !== value)
        : [...filters[filterType], value]
    };
    setFilters(newFilters);
    
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    newFilters[filterType].forEach(v => params.append(filterType, v));
    setSearchParams(params);
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
            <p className="text-muted-foreground">{t.blog.hero.subtitle}</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Filters */}
            <div className="lg:col-span-1">
              <Card>
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
                  <p className="text-muted-foreground">{t.blog.states.loading}</p>
                </div>
              ) : (
                <>
                  {/* Featured Post */}
                  {featuredPost && (
                    <Card className="overflow-hidden">
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
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                            <p className="text-muted-foreground">{featuredPost.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Blog Posts Grid */}
                  {blogPosts.length === 0 && !featuredPost ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">{t.blog.states.empty}</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {blogPosts.map((post) => {
                        const tags = extractTags(post.tags);
                        const readTimeLabel = getReadTimeLabel(post.read_time, post.time_required);

                        return (
                          <Card key={post.id} className="hover:shadow-lg transition-shadow">
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

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                                <p className="text-muted-foreground mb-4">{post.excerpt}</p>
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
                                      <p className="text-muted-foreground">{post.author_job_title}</p>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.blog.newsletter.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {t.blog.newsletter.description && (
                        <p className="text-sm text-muted-foreground mb-4">
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
        </div>
      </main>

      
    </div>
  );
};

export default Blog;