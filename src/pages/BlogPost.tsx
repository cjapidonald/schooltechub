import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShareButton } from "@/components/ShareButton";
import RichContent from "@/components/RichContent";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { ArrowLeft, Calendar, User, Clock, Tag, MessageCircle, ThumbsUp, Flag, Bookmark, BookmarkCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { SAMPLE_BLOG_POSTS } from "@/data/sampleBlogPosts";

type RichContentTextChild = {
  text: string;
  bold?: boolean;
};

type RichContentBlock = {
  type: "paragraph" | "heading";
  level?: number;
  children?: RichContentTextChild[];
};

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

const getReadTimeLabel = (
  readTime?: number | string | null,
  timeRequired?: string | null
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

const convertMarkdownToRichContent = (markdown: string): RichContentBlock[] => {
  if (!markdown) {
    return [];
  }

  const blocks: RichContentBlock[] = [];
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    const text = paragraphLines.join(" ").replace(/\s+/g, " ").trim();
    if (text) {
      blocks.push({
        type: "paragraph",
        children: [{ text }],
      });
    }
    paragraphLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const [, hashes, headingText] = headingMatch;
      const level = Math.min(Math.max(hashes.length, 2), 4);
      const text = headingText.trim();
      if (text) {
        blocks.push({
          type: "heading",
          level,
          children: [{ text }],
        });
      }
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      flushParagraph();
      const bulletText = trimmed.replace(/^[-*+]\s+/, "").trim();
      if (bulletText) {
        blocks.push({
          type: "paragraph",
          children: [{ text: `• ${bulletText}` }],
        });
      }
      continue;
    }

    paragraphLines.push(trimmed);
  }

  flushParagraph();

  return blocks;
};

type SavedPostRow = Database["public"]["Tables"]["saved_posts"]["Row"];
type BlogPostRow = Database["public"]["Tables"]["blogs"]["Row"] & {
  subtitle?: string | null;
  author_job_title?: string | null;
  time_required?: string | null;
  language?: string | null;
  featured_image_caption?: string | null;
};

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Check authentication status
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch blog post
  const { data: fetchedPost, isLoading } = useQuery<BlogPostRow | null>({
    queryKey: ["blog-post", slug, language],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      const post = data?.[0] ?? null;

      if (post && "language" in post && post.language && post.language !== language) {
        return null;
      }

      return (post as BlogPostRow) ?? null;
    }
  });

  const samplePost = useMemo(() => {
    if (!slug) {
      return null;
    }

    return SAMPLE_BLOG_POSTS.find(item => item.slug === slug) ?? null;
  }, [slug]);

  const post = (fetchedPost ?? samplePost) as (BlogPostRow & { content?: unknown }) | null;
  const isLoadingPost = isLoading && !samplePost;
  const resolvedContent = useMemo(() => {
    if (!post) {
      return null;
    }

    if ((post as any).content) {
      return (post as any).content;
    }

    const markdown = (post as any).content_md as string | null | undefined;
    if (typeof markdown === "string" && markdown.trim().length > 0) {
      return convertMarkdownToRichContent(markdown);
    }

    return null;
  }, [post]);

  const savedPostQuery = useQuery({
    queryKey: ["saved-post", user?.id, fetchedPost?.id],
    enabled: !!user?.id && !!fetchedPost?.id,
    queryFn: async () => {
      if (!user?.id || !fetchedPost?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from("saved_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("post_id", fetchedPost.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data ?? null) as SavedPostRow | null;
    }
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (action: "save" | "remove") => {
      if (!user?.id || !fetchedPost?.id) {
        throw new Error("Missing user or post");
      }

      if (action === "save") {
        const { error } = await supabase
          .from("saved_posts")
          .upsert(
            { user_id: user.id, post_id: fetchedPost.id },
            { onConflict: "user_id,post_id" }
          );

        if (error) {
          throw error;
        }

        return action;
      }

      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", fetchedPost.id);

      if (error) {
        throw error;
      }

      return action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["saved-post", user?.id, fetchedPost?.id] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts", user?.id] });
      toast({
        title: t.blogPost.toast.successTitle,
        description: action === "save" ? t.blogPost.toast.saveSuccess : t.blogPost.toast.removeSuccess
      });
    },
    onError: (_error, action) => {
      toast({
        title: t.blogPost.toast.errorTitle,
        description: action === "save" ? t.blogPost.toast.saveError : t.blogPost.toast.removeError,
        variant: "destructive"
      });
    }
  });

  const handleToggleSave = () => {
    if (!user) {
      toast({
        title: t.blogPost.toast.authRequiredTitle,
        description: t.blogPost.toast.authRequiredSave,
        variant: "destructive"
      });
      navigate(getLocalizedPath("/auth", language));
      return;
    }

    if (!fetchedPost?.id || savedPostQuery.isLoading || toggleSaveMutation.isPending) {
      return;
    }

    const action: "save" | "remove" = savedPostQuery.data ? "remove" : "save";
    toggleSaveMutation.mutate(action);
  };

  const isPostSaved = !!savedPostQuery.data;
  const canInteractWithPost = !!fetchedPost?.id;

  // Fetch comments
  useEffect(() => {
    if (!fetchedPost?.id) {
      setComments([]);
      return;
    }

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("blog_id", fetchedPost.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Fetch profiles separately
        const profileIds = [...new Set(data.map(c => c.user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", profileIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const commentsWithProfiles = data.map(c => ({
          ...c,
          profiles: c.user_id ? profileMap.get(c.user_id) : null
        }));
        setComments(commentsWithProfiles);
      }
    };

    fetchComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments-${fetchedPost.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `content_id=eq.${fetchedPost.id}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchedPost?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t.blogPost.toast.authRequiredTitle,
        description: t.blogPost.toast.authRequiredComment,
        variant: "destructive"
      });
      navigate(getLocalizedPath("/auth", language));
      return;
    }

    if (!comment.trim() || !fetchedPost?.id) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        content: comment,
        blog_id: fetchedPost.id,
        user_id: user.id,
        parent_id: null
      });

    if (error) {
      toast({
        title: t.blogPost.toast.errorTitle,
        description: t.blogPost.toast.commentError,
        variant: "destructive"
      });
    } else {
      setComment("");
      toast({
        title: t.blogPost.toast.successTitle,
        description: t.blogPost.toast.commentSuccess
      });
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user) {
      toast({
        title: t.blogPost.toast.authRequiredTitle,
        description: t.blogPost.toast.authRequiredReply,
        variant: "destructive"
      });
      navigate(getLocalizedPath("/auth", language));
      return;
    }

    if (!replyText.trim() || !fetchedPost?.id) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        content: replyText,
        blog_id: fetchedPost.id,
        user_id: user.id,
        parent_id: parentId
      });

    if (error) {
      toast({
        title: t.blogPost.toast.errorTitle,
        description: t.blogPost.toast.replyError,
        variant: "destructive"
      });
    } else {
      setReplyText("");
      setReplyTo(null);
      toast({
        title: t.blogPost.toast.successTitle,
        description: t.blogPost.toast.replySuccess
      });
    }
  };

  if (isLoadingPost) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t.blogPost.notFound.title}</h1>
          <p className="text-white mb-6">{t.blogPost.notFound.description}</p>
          <Button onClick={() => navigate(getLocalizedPath("/blog", language))}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.blogPost.backToBlog}
          </Button>
        </Card>
      </div>
    );
  }

  const tags = extractTags(post.tags);
  const readTimeLabel = getReadTimeLabel(post.read_time, post.time_required);
  const siteUrl = "https://schooltechhub.com";
  const languagePrefix = language === "en" ? "" : `/${language}`;
  const sanitizedSlug = (post.slug || slug || "").toString();
  const articlePath = sanitizedSlug ? `/blog/${sanitizedSlug}` : "/blog";
  const canonicalUrl = `${siteUrl}${languagePrefix}${articlePath}`;
  const authorName =
    typeof post.author === "object" && post.author !== null
      ? (post.author as any).name || "Ms. Taylor Rivera"
      : post.author || "Ms. Taylor Rivera";
  const publishedAtISO = post.published_at ? new Date(post.published_at).toISOString() : undefined;
  const modifiedAtISO = post.updated_at ? new Date(post.updated_at).toISOString() : publishedAtISO;
  const description = post.meta_description || post.excerpt || "";
  const keywords = (post as any).keywords;
  const keywordList = Array.isArray(keywords)
    ? keywords
    : typeof keywords === "string"
      ? keywords.split(",").map((keyword: string) => keyword.trim()).filter(Boolean)
      : [];

  const renderComment = (comment: any, depth = 0) => {
    const replies = comments.filter(c => c.parent_id === comment.id);
    
    return (
      <div key={comment.id} className={`${depth > 0 ? "ml-8 mt-4" : "mb-4"}`}>
        <Card className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {comment.profiles?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-white">
                  {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {t.blogPost.reply}
              </Button>
            </div>
          </div>
          <p className="text-sm mt-2">{comment.content}</p>

          {replyTo === comment.id && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder={t.blogPost.replyPlaceholder}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                >
                  {t.blogPost.postReply}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText("");
                  }}
                >
                  {t.blogPost.cancel}
                </Button>
              </div>
            </div>
          )}
        </Card>
        
        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <SEO
        title={post.meta_title || post.title}
        description={description}
        keywords={keywordList.length > 0 ? keywordList.join(", ") : undefined}
        image={post.featured_image}
        type="article"
        author={authorName}
        publishedTime={publishedAtISO}
        modifiedTime={modifiedAtISO}
        section={post.category || undefined}
        tags={tags}
        canonicalUrl={canonicalUrl}
        lang={language}
      />

      <StructuredData
        type="Article"
        data={{
          headline: post.meta_title || post.title,
          description,
          image: post.featured_image ? [post.featured_image] : undefined,
          datePublished: publishedAtISO,
          dateModified: modifiedAtISO,
          url: canonicalUrl,
        }}
      />

      <article className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(getLocalizedPath("/blog", language))}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.blogPost.backToBlog}
          </Button>

          {/* Featured Image */}
          {post.featured_image && (
            <figure className="mb-8">
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
              {post.featured_image_caption ? (
                <figcaption className="mt-3 text-sm text-white/70">
                  {post.featured_image_caption}
                </figcaption>
              ) : null}
            </figure>
          )}

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.category && (
                <Badge variant="default">
                  {post.category.replace("_", " ").charAt(0).toUpperCase() +
                   post.category.slice(1).replace("_", " ")}
                </Badge>
              )}
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            
            {post.subtitle && (
              <p className="text-xl text-white mb-4">{post.subtitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-white">
              {(post.author || post.author_image || post.author_job_title) && (
                <div className="flex items-center gap-2">
                  {post.author_image ? (
                    <img 
                      src={post.author_image} 
                      alt={typeof post.author === 'object' ? (post.author as any).name : "Author"} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <span className="font-medium">
                      {typeof post.author === 'object' ? (post.author as any).name ?? "Ms. Taylor Rivera" : post.author ?? "Ms. Taylor Rivera"}
                    </span>
                    {post.author_job_title && (
                      <span className="text-xs text-white ml-2">• {post.author_job_title}</span>
                    )}
                  </div>
                </div>
              )}
              {post.published_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(post.published_at), "MMMM d, yyyy")}</span>
                </div>
              )}
              {readTimeLabel && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{readTimeLabel}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={isPostSaved ? "secondary" : "outline"}
                onClick={handleToggleSave}
                disabled={!canInteractWithPost || savedPostQuery.isLoading || toggleSaveMutation.isPending}
                aria-pressed={isPostSaved}
                className="gap-2"
              >
                {isPostSaved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {isPostSaved ? t.blogPost.saved : t.blogPost.save}
              </Button>
              <ShareButton
                url={canonicalUrl}
                title={post.title}
                buttonLabel={t.blogPost.share}
              />
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            {resolvedContent && <RichContent content={resolvedContent as any} />}
          </div>

          {/* Comments Section */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              {t.blogPost.comments} ({comments.filter(c => !c.parent_id).length})
            </h2>

            {canInteractWithPost ? (
              <>
                {user ? (
                  <Card className="p-4 mb-6">
                    <form onSubmit={handleCommentSubmit}>
                      <Textarea
                        placeholder={t.blogPost.commentPlaceholder}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px] mb-4"
                      />
                      <Button type="submit">{t.blogPost.postComment}</Button>
                    </form>
                  </Card>
                ) : (
                  <Card className="p-4 mb-6 text-center">
                    <p className="text-white mb-4">
                      {t.blogPost.loginPrompt}
                    </p>
                    <Button onClick={() => navigate(getLocalizedPath("/auth", language))}>
                      {t.blogPost.loginCta}
                    </Button>
                  </Card>
                )}

                <div className="space-y-4">
                  {comments
                    .filter(c => !c.parent_id)
                    .map(comment => renderComment(comment))}

                  {comments.length === 0 && (
                    <Card className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-white" />
                      <p className="text-white">
                        {t.blogPost.emptyState}
                      </p>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-white">
                  Preview articles are available to read, but saving and comments are reserved for published posts.
                </p>
              </Card>
            )}
          </section>
        </div>
      </article>
    </>
  );
}