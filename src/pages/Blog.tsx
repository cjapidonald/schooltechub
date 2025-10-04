import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Clock,
  Loader2,
  Search,
  Tag,
} from "lucide-react";

import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface BlogListRow
  extends Database["public"]["Tables"]["blogs"]["Row"] {
  language?: string | null;
  time_required?: string | null;
}

const getReadTimeLabel = (
  readTime?: number | string | null,
  timeRequired?: string | null,
) => {
  if (readTime !== null && readTime !== undefined && readTime !== "") {
    const parsed = typeof readTime === "number" ? readTime : parseInt(readTime, 10);

    if (!Number.isNaN(parsed) && parsed > 0) {
      return `${parsed} min read`;
    }
  }

  if (timeRequired) {
    const normalized = String(timeRequired).trim();

    if (normalized.length > 0) {
      return normalized.toLowerCase().includes("read") ? normalized : `${normalized} read`;
    }
  }

  return null;
};

const getAuthorName = (author: BlogListRow["author"]) => {
  if (typeof author === "string" && author.trim()) {
    return author;
  }

  if (author && typeof author === "object") {
    const maybeName = (author as Record<string, unknown>).name;
    if (typeof maybeName === "string" && maybeName.trim()) {
      return maybeName;
    }
  }

  return "SchoolTech Hub";
};

export default function Blog() {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["blog-list", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(60);

      if (error) {
        throw error;
      }

      return (data ?? []) as BlogListRow[];
    },
  });

  const posts = useMemo(() => data ?? [], [data]);

  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return posts.filter(post => {
      if (post.language && post.language !== language) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [
        post.title,
        post.excerpt ?? "",
        post.meta_description ?? "",
        Array.isArray(post.tags) ? post.tags.join(" ") : "",
        getAuthorName(post.author),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [language, posts, searchTerm]);

  const collectionStructuredData = useMemo(() => {
    const baseUrl = "https://schooltechhub.com";
    const collectionPath = getLocalizedPath("/blog", language);

    return {
      name: t.blog.seo.title,
      description: t.blog.seo.description,
      url: `${baseUrl}${collectionPath}`,
      items: filteredPosts.slice(0, 20).map(post => ({
        name: post.title,
        url: `${baseUrl}${getLocalizedPath(`/blog/${post.slug}`, language)}`,
        image: post.featured_image ?? undefined,
        datePublished: post.published_at ?? undefined,
        author: getAuthorName(post.author),
      })),
    };
  }, [filteredPosts, language, t.blog.seo.description, t.blog.seo.title]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t.blog.seo.title}
        description={t.blog.seo.description}
        canonicalUrl={`https://schooltechhub.com${getLocalizedPath("/blog", language)}`}
      />
      <StructuredData type="CollectionPage" data={collectionStructuredData} />

      <section className="border-b bg-gradient-to-br from-background via-background to-primary/10">
        <div className="container space-y-6 py-20">
          <div>
            <Badge className="bg-primary/15 text-primary">{t.blog.hero.title}</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t.blog.title}
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            {t.blog.subtitle}
          </p>
          <div className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t.blog.searchPlaceholder}
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                className="h-12 rounded-full pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="sr-only">{t.blog.states.loading}</span>
          </div>
        ) : null}

        {isError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>We couldn't load blog posts</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : t.blog.states.loading}
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !isError && filteredPosts.length === 0 ? (
          <Card className="p-10 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                {t.blog.states.empty}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.blog.states.empty}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => {
            const readTimeLabel = getReadTimeLabel(post.read_time, post.time_required ?? null);
            const publishedLabel = post.published_at
              ? format(new Date(post.published_at), "MMM d, yyyy")
              : null;
            const author = getAuthorName(post.author);
            const tags = Array.isArray(post.tags) ? post.tags : [];
            const isFeatured = tags.some(tag => tag.toLowerCase() === "featured");

            return (
              <Card key={post.id} className="flex h-full flex-col overflow-hidden border-primary/20 bg-card/80 backdrop-blur">
                {post.featured_image ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ) : null}
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {isFeatured ? (
                      <Badge className="bg-primary/15 text-primary">
                        {t.blog.badges.featured}
                      </Badge>
                    ) : null}
                    {publishedLabel ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {publishedLabel}
                      </span>
                    ) : null}
                    {readTimeLabel ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {readTimeLabel}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-2xl font-semibold leading-tight">
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p className="text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {t.blog.postedBy} {author}
                  </div>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
                <CardFooter className="border-t border-dashed border-primary/20 bg-muted/10">
                  <Button asChild variant="ghost" className="w-full justify-between">
                    <Link to={getLocalizedPath(`/blog/${post.slug}`, language)}>
                      <span>{t.blog.readMore}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
