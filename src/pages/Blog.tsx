import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
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
  Filter,
  BookOpen,
  Layers,
  MonitorSmartphone,
  CreditCard,
  Globe,
  X,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { SAMPLE_BLOG_POSTS, type SampleBlogPost } from "@/data/sampleBlogPosts";
import { cn } from "@/lib/utils";

const FALLBACK_BLOG_IMAGE = "/placeholder.svg";

interface AuthorInfo {
  name?: string | null;
  job_title?: string | null;
}

type BlogPostRow = Database["public"]["Tables"]["blogs"]["Row"] & {
  subtitle?: string | null;
  author_name?: string | null;
  author_job_title?: string | null;
  time_required?: string | null;
  language?: string | null;
  is_pinned?: boolean | null;
  featured_image_caption?: string | null;
};

type BlogPost = BlogPostRow & {
  author?: AuthorInfo | null;
  content?: SampleBlogPost["content"];
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

const EXCLUDED_CATEGORY_LABELS = new Set([
  "teacher debates",
  "teaching practice",
]);

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

const filterSectionIcons: Record<Exclude<BlogFilterKey, "category">, LucideIcon> = {
  stage: Layers,
  subject: BookOpen,
  delivery: MonitorSmartphone,
  payment: CreditCard,
  platform: Globe,
};

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

  return "Ms. Taylor Rivera";
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

const SAMPLE_POSTS: BlogPost[] = SAMPLE_BLOG_POSTS;

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

        setPosts([...filteredByLanguage, ...SAMPLE_POSTS]);
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

  const categoryTabs = (optionEntries.category ?? []).filter(([, label]) => {
    const normalizedLabel = label.trim().toLowerCase();
    return !EXCLUDED_CATEGORY_LABELS.has(normalizedLabel);
  });
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

  const handleCategoryButtonClick = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      category: value === "all" ? [] : [value],
    }));
  }, []);

  const handleFilterToggle = useCallback((key: BlogFilterKey, value: string) => {
    setFilters(prev => {
      const current = prev[key];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter(item => item !== value) : [...current, value],
      };
    });
  }, []);

  const pinnedPosts = filteredPosts.filter(post => post.is_pinned);

  const regularPosts = filteredPosts.filter(post => !pinnedPosts.includes(post));

  const buildPostUrl = useCallback(
    (post: BlogPost) => {
      const slug = post.slug?.trim();
      const identifier = slug && slug.length > 0 ? slug : post.id;
      return getLocalizedPath(`/blog/${identifier}`, language);
    },
    [language],
  );

  const clearAllFilters = useCallback(() => {
    setFilters(createEmptyFilters());
  }, []);

  const removeFilterValue = useCallback((key: BlogFilterKey, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== value),
    }));
  }, []);

  const getFilterLabel = useCallback(
    (key: BlogFilterKey, value: string) => {
      const entries = optionEntries[key] ?? [];
      const match = entries.find(([entryValue]) => entryValue === value);
      if (match) {
        return match[1];
      }

      return formatFilterLabel(value);
    },
    [optionEntries]
  );

  const selectedFilters = useMemo(
    () =>
      BLOG_FILTER_KEYS.flatMap(key =>
        filters[key].map(value => ({ key, value, label: getFilterLabel(key, value) }))
      ),
    [filters, getFilterLabel]
  );

  const isAnyFilterActive = selectedFilters.length > 0;

  const structuredData = useMemo(() => {
    if (filteredPosts.length === 0) {
      return null;
    }

    const baseBlogUrl = `https://schooltechub.com${getLocalizedPath("/blog", language)}`;

    const items = filteredPosts.map((post, index) => {
      const anchorId = post.slug ? `post-${post.slug}` : `post-${post.id}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "BlogPosting",
          headline: post.title,
          url: `${baseBlogUrl}#${anchorId}`,
          datePublished: post.published_at ?? post.created_at ?? undefined,
          dateModified: post.updated_at ?? undefined,
          description: post.excerpt ?? undefined,
          image: post.featured_image ?? undefined,
          author: {
            "@type": "Person",
            name: getAuthorName(post),
          },
        },
      };
    });

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO
        title={t.blog.seo.title}
        description={t.blog.seo.description}
        canonicalUrl={`https://schooltechub.com${getLocalizedPath("/blog", language)}`}
      />

      {structuredData ? <StructuredData data={structuredData} /> : null}

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-[-10rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-24 pt-[14px] md:px-8 md:pt-[14px]">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-6 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl transition-colors duration-500 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="absolute inset-y-0 right-[-20%] hidden w-[50%] rounded-full bg-gradient-to-br from-cyan-400/30 via-transparent to-transparent blur-3xl md:block" />

          <div className="relative z-10 space-y-4">
            <div className="space-y-3">
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t.blog.title}</h1>
                <p className="text-lg text-white/70 md:max-w-2xl">{t.blog.subtitle}</p>
              </div>
              <Card className="border-white/20 bg-white/10 text-white shadow-[0_10px_40px_-20px_rgba(15,23,42,0.7)] backdrop-blur-xl">
                <CardContent className="flex flex-col gap-0 p-1">
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                    <Input
                      id="blog-search"
                      value={searchValue}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      placeholder={t.blog.searchPlaceholder}
                      className="h-12 rounded-2xl border-white/20 bg-white/10 pl-11 text-base text-white placeholder:text-white/50 focus-visible:ring-white/40"
                      aria-label={t.blog.searchPlaceholder}
                    />
                  </div>
                </CardContent>
              </Card>
              {categoryTabs.length > 0 ? (
                <div className="flex w-full flex-wrap items-center gap-3 overflow-x-auto pb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeCategory === "all" ? "default" : "outline"}
                    className={cn(
                      "flex-shrink-0 rounded-full border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.9)] transition hover:text-white",
                      activeCategory === "all"
                        ? "border-transparent bg-white/90 text-slate-900 hover:bg-white"
                        : "hover:bg-white/20"
                    )}
                    onClick={() => handleCategoryButtonClick("all")}
                  >
                    {t.blog.filters.all ?? "All"}
                  </Button>
                  {categoryTabs.map(([value, label]) => {
                    const Icon = categoryIcons[value] ?? Tag;
                    const isActive = activeCategory === value;
                    return (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        className={cn(
                          "flex-shrink-0 gap-2 rounded-full border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.9)] transition hover:text-white",
                          isActive
                            ? "border-transparent bg-white/90 text-slate-900 hover:bg-white"
                            : "hover:bg-white/20"
                        )}
                        onClick={() => handleCategoryButtonClick(value)}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "text-slate-900" : "text-white"}`} aria-hidden="true" />
                        <span className="whitespace-nowrap">{label}</span>
                      </Button>
                    );
                  })}
                </div>
              ) : null}
            </div>

          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[240px,1fr]">
          <aside className="space-y-6">
            <Card className="border-white/15 bg-white/10 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/70">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  {t.blog.filters.title}
                </div>
                <p className="text-sm text-white/60">{t.blog.filters.helper}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {isAnyFilterActive ? (
                    <>
                      {selectedFilters.map(item => (
                        <Badge
                          key={`${item.key}-${item.value}`}
                          variant="secondary"
                          className="flex items-center gap-1 rounded-full border-white/20 bg-white/10 text-xs text-white/80 backdrop-blur"
                        >
                          <span>{item.label}</span>
                          <button
                            type="button"
                            onClick={() => removeFilterValue(item.key, item.value)}
                            className="rounded-full p-0.5 text-white/60 transition hover:text-white"
                            aria-label={`Remove ${item.label}`}
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </Badge>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-full px-3 py-1 text-xs text-white/70 hover:text-white"
                        onClick={clearAllFilters}
                      >
                        {t.blog.filters.clear}
                      </Button>
                    </>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full border-dashed border-white/30 bg-white/5 px-3 py-1 text-xs text-white/60"
                    >
                      No filters applied
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {(["stage", "subject", "delivery", "payment", "platform"] as Array<Exclude<BlogFilterKey, "category">>)
                  .map(key => {
                    const options = optionEntries[key] ?? [];
                    if (!options.length) {
                      return null;
                    }

                    const Icon = filterSectionIcons[key];
                    return (
                      <div key={key} className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/70">
                          <Icon className="h-4 w-4 text-white/80" aria-hidden="true" />
                          <span>{t.blog.filters[key]}</span>
                        </div>
                        <div className="space-y-2 text-sm text-white/70">
                          {options.map(([value, label]) => {
                            const isActive = filters[key].includes(value);
                            return (
                              <label key={value} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => handleFilterToggle(key, value)}
                                  className="h-4 w-4 rounded border-white/30 bg-white/10 text-sky-300 focus:ring-white/50"
                                />
                                <span>{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-8">
            {error ? (
              <Alert variant="destructive" className="border-red-400/60 bg-red-500/10 text-white">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden border-white/10 bg-white/5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)] backdrop-blur"
                  >
                    <Skeleton className="h-40 w-full" />
                    <CardHeader className="space-y-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="border-dashed border-white/30 bg-white/5 text-white">
                <CardContent className="py-16 text-center">
                  <h2 className="text-2xl font-semibold">{t.blog.states.empty}</h2>
                  <p className="mt-2 text-white/70">{t.blog.subtitle}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-10">
                {pinnedPosts.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-1 w-12 rounded-full bg-white/70" />
                      <span className="text-sm font-semibold uppercase tracking-widest text-white/80">
                        {t.blog.badges.pinned}
                      </span>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      {pinnedPosts.map(post => {
                        const imageSrc = post.featured_image?.trim() ? post.featured_image : FALLBACK_BLOG_IMAGE;
                        const anchorId = post.slug ? `post-${post.slug}` : `post-${post.id}`;
                        const authorLabel = getAuthorName(post);

                        return (
                          <article key={post.id} id={anchorId}>
                            <Link
                              to={buildPostUrl(post)}
                              className="group block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                              aria-label={post.title}
                            >
                              <Card className="overflow-hidden border-white/20 bg-white/10 text-white shadow-[0_25px_80px_-30px_rgba(15,23,42,1)] transition-transform hover:-translate-y-1 hover:border-white/40">
                                <figure className="flex flex-col items-center gap-4 p-6">
                                  <div className="relative aspect-[4/3] w-full max-w-[18rem] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-1.5 shadow-[0_30px_90px_-40px_rgba(15,23,42,1)] backdrop-blur-2xl">
                                    <div className="relative h-full w-full overflow-hidden rounded-[1.6rem]">
                                      <img
                                        src={imageSrc}
                                        alt={post.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                      />
                                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05))] opacity-60" />
                                    </div>
                                  </div>
                                  {post.featured_image_caption ? (
                                    <figcaption className="text-xs uppercase tracking-wide text-white/70">
                                      {post.featured_image_caption}
                                    </figcaption>
                                  ) : null}
                                </figure>
                                <CardHeader className="space-y-3 text-center">
                                  <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                                    <User className="h-4 w-4" aria-hidden="true" />
                                    <span className="font-medium">{authorLabel}</span>
                                  </div>
                                  <h2 className="text-2xl font-semibold leading-tight text-white transition-colors group-hover:text-white">
                                    {post.title}
                                  </h2>
                                  {post.subtitle ? (
                                    <p className="text-base text-white/70">{post.subtitle}</p>
                                  ) : null}
                                </CardHeader>
                              </Card>
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {regularPosts.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-white">{t.blog.title}</h2>
                      <span className="text-sm text-white/60">
                        {regularPosts.length} {regularPosts.length === 1 ? "post" : "posts"}
                      </span>
                    </div>
                    <div className="columns-1 md:columns-2 xl:columns-3 [column-gap:1.25rem]">
                      {regularPosts.map(post => {
                        const imageSrc = post.featured_image?.trim() ? post.featured_image : FALLBACK_BLOG_IMAGE;
                        const anchorId = post.slug ? `post-${post.slug}` : `post-${post.id}`;
                        const authorLabel = getAuthorName(post);

                        return (
                          <article key={post.id} id={anchorId} className="mb-5 break-inside-avoid">
                            <Link
                              to={buildPostUrl(post)}
                              className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                              aria-label={post.title}
                            >
                              <Card className="flex h-full flex-col items-center overflow-hidden border-white/15 bg-white/5 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,1)] transition-transform hover:-translate-y-1 hover:border-white/30">
                                <figure className="flex w-full flex-col items-center gap-4 p-5">
                                  <div className="relative aspect-[4/3] w-full max-w-[16rem] overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 p-1.5 shadow-[0_25px_80px_-40px_rgba(15,23,42,1)] backdrop-blur-2xl">
                                    <div className="relative h-full w-full overflow-hidden rounded-[1.4rem]">
                                      <img
                                        src={imageSrc}
                                        alt={post.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                      />
                                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05))] opacity-50" />
                                    </div>
                                  </div>
                                  {post.featured_image_caption ? (
                                    <figcaption className="text-xs text-white/70">
                                      {post.featured_image_caption}
                                    </figcaption>
                                  ) : null}
                                </figure>
                                <CardHeader className="space-y-2 text-center">
                                  <div className="flex items-center justify-center gap-2 text-xs text-white/60">
                                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span className="font-medium tracking-wide">{authorLabel}</span>
                                  </div>
                                  <h3 className="text-xl font-semibold leading-tight text-white transition-colors group-hover:text-white">
                                    {post.title}
                                  </h3>
                                  {post.subtitle ? (
                                    <p className="text-sm text-white/70">{post.subtitle}</p>
                                  ) : null}
                                </CardHeader>
                              </Card>
                            </Link>
                          </article>
                        );
                      })}
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
