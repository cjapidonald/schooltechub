import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Calendar,
  Clock,
  User,
  Tag,
  Laptop,
  GraduationCap,
  Lightbulb,
  Users,
  Edit3,
  Sparkles,
  ShoppingBag,
  FileText,
  FlaskConical,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

interface AuthorInfo {
  name?: string | null;
  job_title?: string | null;
}

type BlogPostRow = Database["public"]["Tables"]["blogs"]["Row"] & {
  subtitle?: string | null;
  author_name?: string | null;
  time_required?: string | null;
  language?: string | null;
  is_featured?: boolean | null;
};

type BlogPost = BlogPostRow & {
  author?: AuthorInfo | null;
};

const categoryIcons: Record<string, LucideIcon> = {
  eduTech: Laptop,
  tutorials: GraduationCap,
  teachingTechniques: Lightbulb,
  classActivity: Users,
  teacherReflection: Edit3,
  tips: Sparkles,
  shop: ShoppingBag,
  caseStudy: FileText,
  research: FlaskConical,
  researchQuestion: HelpCircle,
  teacherDebates: MessageSquare,
};

const BLOG_FILTER_KEYS = [
  "category",
  "stage",
  "subject",
  "delivery",
  "payment",
  "platform",
] as const;

type BlogFilterKey = (typeof BLOG_FILTER_KEYS)[number];

type BlogFilterState = Record<BlogFilterKey, string[]>;

const FILTER_SOURCE_KEYS: Record<BlogFilterKey, string[]> = {
  category: ["category", "categories", "filter_type", "filterType", "content_type", "contentType", "type", "types", "page"],
  stage: ["stage", "stages", "grade", "grades", "grade_level", "grade_levels", "gradeLevel", "gradeLevels"],
  subject: ["subject", "subjects"],
  delivery: ["delivery", "deliveries", "delivery_mode", "deliveryMode", "best_for"],
  payment: ["payment", "payments", "pricing", "price_type", "priceType"],
  platform: ["platform", "platforms", "device", "devices"],
};

const sanitizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const slugifyValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const formatFilterLabel = (value: string) =>
  value
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());

const createEmptyFilters = (): BlogFilterState => ({
  category: [],
  stage: [],
  subject: [],
  delivery: [],
  payment: [],
  platform: [],
});

const toValueArray = (input: unknown): string[] => {
  if (!input && input !== 0) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap(item => toValueArray(item));
  }

  if (typeof input === "number") {
    return [String(input)];
  }

  if (typeof input === "string") {
    return input
      .split(/[;,/]/)
      .map(value => value.trim())
      .filter(Boolean);
  }

  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    if ("value" in record) {
      return toValueArray(record.value);
    }
    if ("label" in record) {
      return toValueArray(record.label);
    }
  }

  return [];
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const collectSources = (post: BlogPost): Record<string, unknown>[] => {
  const sources: Record<string, unknown>[] = [];

  const pushRecord = (value: unknown) => {
    const record = asRecord(value);
    if (record) {
      sources.push(record);
    }
  };

  pushRecord(post);

  if (post.author) {
    pushRecord(post.author);
  }

  const contentRecord = asRecord(post.content);
  if (contentRecord) {
    pushRecord(contentRecord);

    Object.values(contentRecord).forEach(value => {
      pushRecord(value);
    });
  }

  return sources;
};

const getMatchingValues = (source: Record<string, unknown>, keys: string[]): unknown[] => {
  const targetKeys = new Set(keys.map(sanitizeKey));
  const matches: unknown[] = [];

  for (const [key, value] of Object.entries(source)) {
    if (targetKeys.has(sanitizeKey(key))) {
      matches.push(value);
    }
  }

  return matches;
};

const createNormalizer = (options: Record<string, string>) => {
  const map = new Map<string, string>();

  const register = (candidate: string, key: string) => {
    if (!candidate) {
      return;
    }
    map.set(candidate, key);
  };

  Object.entries(options).forEach(([key, label]) => {
    register(key, key);
    register(key.toLowerCase(), key);
    register(stripValue(key), key);
    register(slugifyValue(key), key);
    register(label.toLowerCase(), key);
    register(stripValue(label), key);
    register(slugifyValue(label), key);
  });

  return (rawValue: string | null | undefined): { value: string; label: string } | null => {
    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    const trimmed = String(rawValue).trim();
    if (!trimmed) {
      return null;
    }

    const direct = map.get(trimmed);
    const lower = map.get(trimmed.toLowerCase());
    const stripped = map.get(stripValue(trimmed));
    const slug = map.get(slugifyValue(trimmed));

    const matchKey = direct ?? lower ?? stripped ?? slug;
    if (matchKey) {
      return { value: matchKey, label: options[matchKey] };
    }

    const fallbackValue = slugifyValue(trimmed) || stripValue(trimmed) || trimmed.toLowerCase();
    return {
      value: fallbackValue,
      label: formatFilterLabel(trimmed),
    };
  };
};

const getAuthorName = (post: BlogPost): string => {
  const { author, author_name } = post;

  if (author && typeof author === "object" && "name" in author) {
    const name = author.name;
    if (typeof name === "string" && name.trim().length > 0) {
      return name.trim();
    }
  }

  if (typeof author_name === "string" && author_name.trim().length > 0) {
    return author_name.trim();
  }

  if (author && typeof author === "object") {
    const name = (author as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim().length > 0) {
      return name.trim();
    }
  }

  return "SchoolTech Hub";
};

const getReadTimeLabel = (post: BlogPost): string | null => {
  const { read_time, time_required } = post;

  if (typeof read_time === "number" && read_time > 0) {
    return `${read_time} min read`;
  }

  if (typeof read_time === "string" && read_time.trim().length > 0) {
    const parsed = parseInt(read_time, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return `${parsed} min read`;
    }
  }

  if (typeof time_required === "string") {
    const normalized = time_required.trim();
    if (normalized.length > 0) {
      return normalized.toLowerCase().includes("read") ? normalized : `${normalized} read`;
    }
  }

  return null;
};

const formatPublishedDate = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return format(date, "PPP");
};

const normalizeText = (input: string | string[] | null | undefined) => {
  if (!input) {
    return "";
  }

  if (Array.isArray(input)) {
    return input.join(" ").toLowerCase();
  }

  return input.toLowerCase();
};

const FEATURED_TAGS = new Set(["featured", "spotlight"]);

const Blog = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamValue = searchParams.get("search") ?? "";
  const [searchValue, setSearchValue] = useState(searchParamValue);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BlogFilterState>(() => createEmptyFilters());

  useEffect(() => {
    setSearchValue(searchParamValue);
  }, [searchParamValue]);

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("blogs")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(100);

        if (queryError) {
          throw queryError;
        }

        if (!isMounted) {
          return;
        }

        const filteredByLanguage = (data ?? []).filter(post => {
          const postLanguage = (post as BlogPostRow).language;
          return !postLanguage || postLanguage === language;
        }) as BlogPost[];

        setPosts(filteredByLanguage);
      } catch (err) {
        console.error("Failed to load blog posts", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load blog posts");
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [language]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    const params = new URLSearchParams(searchParams);
    if (value.trim().length > 0) {
      if (params.get("search") !== value) {
        params.set("search", value);
        setSearchParams(params, { replace: true });
      }
    } else if (params.has("search")) {
      params.delete("search");
      setSearchParams(params, { replace: true });
    }
  };

  const filterOptions = useMemo(() => {
    return {
      category: t.blog.filters.categories,
      stage: t.blog.filters.stages,
      subject: t.blog.filters.subjects,
      delivery: t.blog.filters.deliveries,
      payment: t.blog.filters.payments,
      platform: t.blog.filters.platforms,
    } as Record<BlogFilterKey, Record<string, string>>;
  }, [t]);

  const { postsWithMetadata, optionEntries } = useMemo(() => {
    const baseSets = BLOG_FILTER_KEYS.reduce(
      (acc, key) => {
        acc[key] = new Set(Object.keys(filterOptions[key] ?? {}));
        return acc;
      },
      {} as Record<BlogFilterKey, Set<string>>
    );

    const normalizers = BLOG_FILTER_KEYS.reduce(
      (acc, key) => {
        acc[key] = createNormalizer(filterOptions[key] ?? {});
        return acc;
      },
      {} as Record<BlogFilterKey, (value: string) => { value: string; label: string } | null>
    );

    const dynamicOptions = BLOG_FILTER_KEYS.reduce(
      (acc, key) => {
        acc[key] = new Map<string, string>();
        return acc;
      },
      {} as Record<BlogFilterKey, Map<string, string>>
    );

    const postsWithMetadata = posts.map(post => {
      const metadata: BlogFilterState = {
        category: [],
        stage: [],
        subject: [],
        delivery: [],
        payment: [],
        platform: [],
      };

      const sources = collectSources(post);
      const postRecord = asRecord(post);

      BLOG_FILTER_KEYS.forEach(key => {
        const values = new Set<string>();
        const baseSet = baseSets[key];
        const normalizer = normalizers[key];
        const addValue = (raw: unknown, allowDynamic = true) => {
          toValueArray(raw).forEach(value => {
            const normalized = normalizer(value);
            if (!normalized) {
              return;
            }

            const isBaseOption = baseSet.has(normalized.value);
            if (!isBaseOption && !allowDynamic) {
              return;
            }

            values.add(normalized.value);

            if (!isBaseOption) {
              dynamicOptions[key].set(normalized.value, normalized.label);
            }
          });
        };

        if (key === "category") {
          addValue(post.category);
          if (postRecord) {
            addValue(postRecord.filter_type);
            addValue(postRecord.content_type);
            addValue(postRecord.type);
          }
        }

        sources.forEach(source => {
          getMatchingValues(source, FILTER_SOURCE_KEYS[key]).forEach(value => {
            addValue(value);
          });
        });

        if (key === "subject") {
          addValue(post.tags, false);
          addValue(post.keywords, false);
        }

        if (key === "stage") {
          addValue(post.tags, false);
          addValue(post.keywords, false);
        }

        if (key === "delivery") {
          addValue(post.tags, false);
        }

        if (key === "platform") {
          addValue(post.tags, false);
        }

        metadata[key] = Array.from(values);
      });

      return { post, metadata };
    });

    const optionEntries = BLOG_FILTER_KEYS.reduce(
      (acc, key) => {
        const baseEntries = Object.entries(filterOptions[key] ?? {});
        const dynamicEntries = Array.from(dynamicOptions[key].entries()).filter(
          ([value]) => !baseSets[key].has(value)
        );

        acc[key] = [...baseEntries, ...dynamicEntries];
        return acc;
      },
      {} as Record<BlogFilterKey, Array<[string, string]>>
    );

    return { postsWithMetadata, optionEntries };
  }, [posts, filterOptions]);

  const categoryTabs = optionEntries.category ?? [];
  const activeCategory = filters.category[0] ?? "all";

  const filteredPosts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return postsWithMetadata
      .filter(({ post, metadata }) => {
        if (query) {
          const haystack = [
            post.title,
            post.subtitle,
            post.excerpt,
            normalizeText(post.category),
            normalizeText(post.tags),
            normalizeText(post.keywords),
          ]
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(query)) {
            return false;
          }
        }

        return BLOG_FILTER_KEYS.every(key => {
          const selected = filters[key];
          if (!selected.length) {
            return true;
          }

          const available = metadata[key];
          if (!available.length) {
            return false;
          }

          return selected.some(value => available.includes(value));
        });
      })
      .map(item => item.post);
  }, [filters, postsWithMetadata, searchValue]);

  const handleCategoryTabChange = useCallback(
    (value: string) => {
      setFilters(prev => ({
        ...prev,
        category: value === "all" ? [] : [value],
      }));
    },
    []
  );

  const featuredPosts = filteredPosts.filter(post => {
    if (post.is_featured) {
      return true;
    }

    if (Array.isArray(post.tags)) {
      return post.tags.some(tag => FEATURED_TAGS.has(tag.toLowerCase()));
    }

    return false;
  });

  const regularPosts = filteredPosts.filter(post => !featuredPosts.includes(post));

  const structuredData = useMemo(() => {
    if (filteredPosts.length === 0) {
      return null;
    }

    const items = filteredPosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        url: `https://schooltechub.com${getLocalizedPath(`/blog/${post.slug}`, language)}`,
        datePublished: post.published_at ?? post.created_at ?? undefined,
        dateModified: post.updated_at ?? undefined,
        description: post.excerpt ?? undefined,
        image: post.featured_image ?? undefined,
        author: {
          "@type": "Person",
          name: getAuthorName(post),
        },
      },
    }));

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: items,
    };
  }, [filteredPosts, language]);

  const getCategoryLabel = (value?: string | null) => {
    if (!value) {
      return null;
    }

    const mapping: Record<string, string | undefined> = {
      eduTech: t.blog.filters.categories.eduTech,
      tutorials: t.blog.filters.categories.tutorials,
      teachingTechniques: t.blog.filters.categories.teachingTechniques,
      classActivity: t.blog.filters.categories.classActivity,
      teacherReflection: t.blog.filters.categories.teacherReflection,
      tips: t.blog.filters.categories.tips,
      shop: t.blog.filters.categories.shop,
      caseStudy: t.blog.filters.categories.caseStudy,
      research: t.blog.filters.categories.research,
      teacherDebates: t.blog.filters.categories.teacherDebates,
      researchQuestion: t.blog.filters.categories.researchQuestion,
    };

    return (
      mapping[value] ??
      value
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase())
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={t.blog.seo.title}
        description={t.blog.seo.description}
        canonicalUrl={`https://schooltechub.com${getLocalizedPath("/blog", language)}`}
      />

      {structuredData ? <StructuredData data={structuredData} /> : null}

      <div className="flex-1">
        <section className="border-b border-border/50 bg-background/60 backdrop-blur">
          <div className="container py-8">
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder={t.blog.searchPlaceholder}
                  className="h-12 rounded-full border-muted-foreground/20 pl-11"
                  aria-label={t.blog.searchPlaceholder}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container space-y-10 py-12">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.blog.title}</h1>
            <p className="text-muted-foreground">{t.blog.subtitle}</p>
          </div>

          {categoryTabs.length > 0 ? (
            <Tabs value={activeCategory} onValueChange={handleCategoryTabChange} className="w-full">
              <TabsList className="flex w-full flex-wrap gap-2 overflow-x-auto border border-border/40 bg-background/80 py-1">
                <TabsTrigger value="all" className="rounded-full px-4 py-2">
                  {t.blog.filters.all ?? "All"}
                </TabsTrigger>
                {categoryTabs.map(([value, label]) => {
                  const Icon = categoryIcons[value] ?? Tag;
                  return (
                    <TabsTrigger key={value} value={value} className="gap-2 rounded-full px-4 py-2">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="whitespace-nowrap">{label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          ) : null}

          <div className="space-y-8">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="overflow-hidden border-border/40">
                      <Skeleton className="h-48 w-full" />
                      <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardHeader>
                      <CardFooter className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-28" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-background/40">
                  <CardContent className="py-16 text-center">
                    <h2 className="text-2xl font-semibold">{t.blog.states.empty}</h2>
                    <p className="mt-2 text-muted-foreground">
                      {t.blog.subtitle}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-12">
                  {featuredPosts.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-12 rounded-full bg-primary" />
                        <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                          {t.blog.badges.featured}
                        </span>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        {featuredPosts.map(post => (
                          <Card key={post.id} className="group overflow-hidden border-primary/30 bg-background/80 shadow-[0_10px_40px_rgba(33,150,243,0.08)]">
                            {post.featured_image ? (
                              <div className="relative h-56 overflow-hidden">
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                            <CardHeader className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {post.category ? (
                                  <Badge variant="outline" className="rounded-full border-primary/60 text-primary">
                                    {getCategoryLabel(post.category)}
                                  </Badge>
                                ) : null}
                                {Array.isArray(post.tags)
                                  ? post.tags.slice(0, 2).map(tag => (
                                      <Badge key={tag} variant="secondary" className="rounded-full bg-primary/10 text-primary">
                                        <Tag className="mr-1 h-3.5 w-3.5" />
                                        {tag}
                                      </Badge>
                                    ))
                                  : null}
                              </div>
                              <h2 className="text-2xl font-semibold leading-tight text-white transition-colors group-hover:text-primary">
                                {post.title}
                              </h2>
                              {post.subtitle ? (
                                <p className="text-base text-muted-foreground">{post.subtitle}</p>
                              ) : null}
                              <p className="text-sm text-muted-foreground/90">
                                {post.excerpt}
                              </p>
                            </CardHeader>
                            <CardFooter className="flex flex-col gap-4 border-t border-border/40 bg-background/60 p-6 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <User className="h-4 w-4 text-primary" />
                                  {t.blog.postedBy} {getAuthorName(post)}
                                </span>
                                {formatPublishedDate(post.published_at ?? post.created_at) ? (
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {formatPublishedDate(post.published_at ?? post.created_at)}
                                  </span>
                                ) : null}
                                {getReadTimeLabel(post) ? (
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-primary" />
                                    {getReadTimeLabel(post)}
                                  </span>
                                ) : null}
                              </div>
                              <Button asChild size="lg" className="rounded-full">
                                <Link to={getLocalizedPath(`/blog/${post.slug}`, language)}>
                                  {t.blog.readMore}
                                </Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {regularPosts.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">{t.blog.title}</h2>
                        <span className="text-sm text-muted-foreground">
                          {regularPosts.length} {regularPosts.length === 1 ? "post" : "posts"}
                        </span>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {regularPosts.map(post => (
                          <Card key={post.id} className="group flex h-full flex-col overflow-hidden border-border/40 bg-background/70">
                            {post.featured_image ? (
                              <div className="relative h-44 overflow-hidden">
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                            <CardHeader className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                {post.category ? (
                                  <Badge variant="outline" className="rounded-full border-muted-foreground/40 text-muted-foreground">
                                    {getCategoryLabel(post.category)}
                                  </Badge>
                                ) : null}
                                {getReadTimeLabel(post) ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {getReadTimeLabel(post)}
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="text-xl font-semibold leading-tight text-white transition-colors group-hover:text-primary">
                                {post.title}
                              </h3>
                              {post.subtitle ? (
                                <p className="text-sm text-muted-foreground">{post.subtitle}</p>
                              ) : null}
                              <p className="text-sm text-muted-foreground/90 line-clamp-3">
                                {post.excerpt}
                              </p>
                            </CardHeader>
                            <CardFooter className="mt-auto flex items-center justify-between border-t border-border/40 bg-background/50 p-6">
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5" />
                                  {getAuthorName(post)}
                                </span>
                                {formatPublishedDate(post.published_at ?? post.created_at) ? (
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatPublishedDate(post.published_at ?? post.created_at)}
                                  </span>
                                ) : null}
                              </div>
                              <Button asChild variant="secondary" size="sm" className="rounded-full">
                                <Link to={getLocalizedPath(`/blog/${post.slug}`, language)}>
                                  {t.blog.readMore}
                                </Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  </div>
                )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Blog;
