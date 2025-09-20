import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShareButton } from "@/components/ShareButton";
import RichContent from "@/components/RichContent";
import { SEO } from "@/components/SEO";
import { ArrowLeft, Calendar, User, Clock, Tag, MessageCircle, ThumbsUp, Flag } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug, language],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("content_master")
        .select("*")
        .eq("slug", slug)
        .in("page", ["research_blog", "edutech", "teacher_diary"])
        .eq("language", language)
        .eq("is_published", true);

      if (error) {
        throw error;
      }

      return data?.[0] ?? null;
    }
  });

  // Fetch comments
  useEffect(() => {
    if (!post?.id) return;

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq("content_id", post.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setComments(data);
      }
    };

    fetchComments();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`comments-${post.id}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "comments",
        filter: `content_id=eq.${post.id}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [post?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive"
      });
      navigate(getLocalizedPath("/auth", language));
      return;
    }

    if (!comment.trim()) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        content: comment,
        content_id: post?.id,
        user_id: user.id,
        parent_id: null
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } else {
      setComment("");
      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply",
        variant: "destructive"
      });
      navigate(getLocalizedPath("/auth", language));
      return;
    }

    if (!replyText.trim()) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        content: replyText,
        content_id: post?.id,
        user_id: user.id,
        parent_id: parentId
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      });
    } else {
      setReplyText("");
      setReplyTo(null);
      toast({
        title: "Success",
        description: "Reply posted successfully"
      });
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(getLocalizedPath("/blog", language))}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Card>
      </div>
    );
  }

  const tags = extractTags(post.tags);
  const readTimeLabel = getReadTimeLabel(post.read_time, post.time_required);

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
                <p className="text-xs text-muted-foreground">
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
                Reply
              </Button>
            </div>
          </div>
          <p className="text-sm mt-2">{comment.content}</p>
          
          {replyTo === comment.id && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                >
                  Post Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText("");
                  }}
                >
                  Cancel
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
        description={post.meta_description || post.excerpt}
        keywords={post.keywords?.join(", ")}
        image={post.featured_image}
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
            Back to Blog
          </Button>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
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
              <p className="text-xl text-muted-foreground mb-4">{post.subtitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                      {typeof post.author === 'object' ? (post.author as any).name : "SchoolTechHub Team"}
                    </span>
                    {post.author_job_title && (
                      <span className="text-xs text-muted-foreground ml-2">• {post.author_job_title}</span>
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

            <div className="mt-4">
              <ShareButton 
                url={window.location.href} 
                title={post.title}
              />
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            {post.content && <RichContent content={post.content as any} />}
          </div>

          {/* Comments Section */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Comments ({comments.filter(c => !c.parent_id).length})
            </h2>

            {/* Comment Form */}
            {user ? (
              <Card className="p-4 mb-6">
                <form onSubmit={handleCommentSubmit}>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] mb-4"
                  />
                  <Button type="submit">Post Comment</Button>
                </form>
              </Card>
            ) : (
              <Card className="p-4 mb-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Please log in to leave a comment
                </p>
                <Button onClick={() => navigate(getLocalizedPath("/auth", language))}>
                  Log In to Comment
                </Button>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments
                .filter(c => !c.parent_id)
                .map(comment => renderComment(comment))}
              
              {comments.length === 0 && (
                <Card className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </Card>
              )}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}