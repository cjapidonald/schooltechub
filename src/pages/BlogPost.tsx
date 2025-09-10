import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RichContent from "@/components/RichContent";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import type { Json } from "@/integrations/supabase/types";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: Json;
  teaser: string;
  takeaway: string;
  published_at: string;
  grade_band: string;
  primary_keyword: string;
}

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    if (!slug) return;
    
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      setLoading(false);
      return;
    }

    setPost(data);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist.
            </p>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={post.title}
        description={post.teaser || `Read about ${post.title} on SchoolTech Hub`}
        keywords={post.primary_keyword || "educational technology, edtech"}
        canonicalUrl={`https://schooltechhub.com/blog/${post.slug}`}
      />
      <Navigation />

      <article className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Link to="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          {/* Article header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
              {post.grade_band && (
                <Badge variant="secondary">{post.grade_band}</Badge>
              )}
              {post.primary_keyword && (
                <Badge variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  {post.primary_keyword}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            
            {post.teaser && (
              <p className="text-xl text-muted-foreground">{post.teaser}</p>
            )}
          </header>

          {/* Key takeaway */}
          {post.takeaway && (
            <Card className="mb-8 p-6 bg-accent/10 border-l-4 border-accent">
              <p className="font-medium">
                💡 <strong>Key Takeaway:</strong> {post.takeaway}
              </p>
            </Card>
          )}

          {/* Article content */}
          <div className="prose prose-lg max-w-none">
            <RichContent content={post.content as any} className="text-base leading-relaxed" />
          </div>

          {/* Call to action */}
          <Card className="mt-12 p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
            <h3 className="text-2xl font-bold mb-4">Want to Learn More?</h3>
            <p className="text-muted-foreground mb-6">
              Get personalized guidance for implementing these strategies in your classroom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button size="lg">Book a Consultation</Button>
              </Link>
              <Link to="/tools">
                <Button size="lg" variant="outline">
                  Explore Tools
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;