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

  return "SchoolTech Hub";
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

const SAMPLE_BLOG_POSTS: BlogPost[] = [
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
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
    content: {
      publisher: "SchoolTechHub Editorial",
      heroImageCaption: "Ms. Saunders guiding students during a project-based science workshop.",
      readingHighlight: "See the weekly planning template that keeps AI feedback aligned with state standards.",
      stages: ["secondary"],
      subjects: ["science"],
      deliveryMode: ["inClass"],
      pricing: ["free"],
      platforms: ["webapp", "smartboard"],
    },
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
    content: {
      publisher: "Future of Learning Lab",
      heroImageCaption: "Students explore coral reefs through a classroom VR station.",
      readingHighlight: "Includes a printable VR reflection journal and parent communication template.",
      stages: ["primary"],
      subjects: ["steam", "science"],
      delivery: ["inClass", "live"],
      pricing: ["educationDiscount"],
      platforms: ["mobileApp", "smartboard"],
    },
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
    content: {
      publisher: "SchoolTechHub Research",
      heroImageCaption: "Families reviewing student showcases during an exhibition night.",
      readingHighlight: "Templates for progress snapshots, privacy agreements, and student-led conference scripts.",
      stages: ["secondary"],
      subjects: ["english", "history"],
      delivery: ["online", "homework"],
      pricing: ["paid"],
      platforms: ["webapp", "mobileApp"],
    },
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

        setPosts([...filteredByLanguage, ...SAMPLE_BLOG_POSTS]);
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
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                size="sm"
                variant={activeCategory === "all" ? "default" : "outline"}
                className="rounded-full"
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
                    className="gap-2 rounded-full"
                    onClick={() => handleCategoryButtonClick(value)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="whitespace-nowrap">{label}</span>
                  </Button>
                );
              })}
            </div>
          ) : null}

          <div className="flex flex-col gap-10 lg:flex-row">
            <aside className="order-2 lg:order-1 lg:w-72 lg:flex-shrink-0">
              <Card className="border-border/40 bg-background/80">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    <Filter className="h-4 w-4" aria-hidden="true" />
                    {t.blog.filters.title}
                  </div>
                  <p className="text-sm text-muted-foreground/80">{t.blog.filters.helper}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {isAnyFilterActive ? (
                      <>
                        {selectedFilters.map(item => (
                          <Badge key={`${item.key}-${item.value}`} variant="secondary" className="flex items-center gap-1 rounded-full">
                            <span>{item.label}</span>
                            <button
                              type="button"
                              onClick={() => removeFilterValue(item.key, item.value)}
                              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
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
                          className="rounded-full px-3 py-1 text-xs"
                          onClick={clearAllFilters}
                        >
                          {t.blog.filters.clear}
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-dashed border-border/60 text-xs text-muted-foreground">
                        No filters applied
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(["stage", "subject", "delivery", "payment", "platform"] as Array<Exclude<BlogFilterKey, "category">>)
                    .map(key => {
                      const options = optionEntries[key] ?? [];
                      if (!options.length) {
                        return null;
                      }

                      const Icon = filterSectionIcons[key];
                      return (
                        <div key={key} className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                            <span>{t.blog.filters[key]}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {options.map(([value, label]) => {
                              const isActive = filters[key].includes(value);
                              return (
                                <Button
                                  key={value}
                                  type="button"
                                  size="sm"
                                  variant={isActive ? "default" : "outline"}
                                  className="rounded-full"
                                  onClick={() => handleFilterToggle(key, value)}
                                >
                                  {label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            </aside>

            <div className="order-1 flex-1 space-y-8 lg:order-2">
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
                          <Link
                            key={post.id}
                            to={getLocalizedPath(`/blog/${post.slug}`, language)}
                            className="group block"
                          >
                            <Card className="overflow-hidden border-primary/30 bg-background/80 transition-transform hover:-translate-y-1 hover:border-primary/60">
                              {post.featured_image ? (
                                <figure className="relative h-56 overflow-hidden">
                                  <img
                                    src={post.featured_image}
                                    alt={post.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                </figure>
                              ) : null}
                              <CardHeader className="space-y-3">
                                <h2 className="text-2xl font-semibold leading-tight text-white transition-colors group-hover:text-primary">
                                  {post.title}
                                </h2>
                                {post.subtitle ? (
                                  <p className="text-base text-muted-foreground">{post.subtitle}</p>
                                ) : null}
                              </CardHeader>
                            </Card>
                          </Link>
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
                          <Link
                            key={post.id}
                            to={getLocalizedPath(`/blog/${post.slug}`, language)}
                            className="group block h-full"
                          >
                            <Card className="flex h-full flex-col overflow-hidden border-border/40 bg-background/70 transition-transform hover:-translate-y-1 hover:border-primary/50">
                              {post.featured_image ? (
                                <figure className="relative h-44 overflow-hidden">
                                  <img
                                    src={post.featured_image}
                                    alt={post.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                </figure>
                              ) : null}
                              <CardHeader className="space-y-2">
                                <h3 className="text-xl font-semibold leading-tight text-white transition-colors group-hover:text-primary">
                                  {post.title}
                                </h3>
                                {post.subtitle ? (
                                  <p className="text-sm text-muted-foreground">{post.subtitle}</p>
                                ) : null}
                              </CardHeader>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  </div>
                )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Blog;
