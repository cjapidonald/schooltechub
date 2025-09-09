import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, ArrowRight, Search, Tag } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { toast } = useToast();

  // Sample blog posts for demonstration
  const samplePosts = [
    {
      id: "1",
      title: "5 Quick Wins with AI for Busy Teachers",
      slug: "5-quick-wins-ai-teachers",
      teaser: "Transform your daily teaching routine with these simple AI tools that take less than 5 minutes to implement.",
      takeaway: "Start small with one AI tool this week",
      published_at: new Date().toISOString(),
      grade_band: "All Grades",
      primary_keyword: "AI tools for teachers",
    },
    {
      id: "2",
      title: "TPR + Tablets: Movement Meets Media",
      slug: "tpr-tablets-movement-media",
      teaser: "Combine Total Physical Response with digital tools to create dynamic, engaging lessons.",
      takeaway: "Movement + tech = engaged learners",
      published_at: new Date().toISOString(),
      grade_band: "K-5",
      primary_keyword: "TPR technology",
    },
    {
      id: "3",
      title: "Differentiation with Google Classroom Rubrics",
      slug: "differentiation-google-classroom",
      teaser: "Learn how to use Google Classroom's rubric feature to automatically differentiate assignments.",
      takeaway: "One rubric, multiple levels",
      published_at: new Date().toISOString(),
      grade_band: "6-12",
      primary_keyword: "Google Classroom differentiation",
    },
    {
      id: "4",
      title: "ClassDojo vs Classcraft: Engagement Compared",
      slug: "classdojo-vs-classcraft",
      teaser: "A detailed comparison of two popular classroom gamification platforms.",
      takeaway: "Choose based on your class culture",
      published_at: new Date().toISOString(),
      grade_band: "3-8",
      primary_keyword: "classroom gamification",
    },
    {
      id: "5",
      title: "iPad Centers for Phonics (K-2)",
      slug: "ipad-centers-phonics",
      teaser: "Set up engaging phonics centers using just 2-3 iPads in your classroom.",
      takeaway: "Rotate stations every 15 minutes",
      published_at: new Date().toISOString(),
      grade_band: "K-2",
      primary_keyword: "iPad phonics centers",
    },
    {
      id: "7",
      title: "isdfsdfsdfsdf(K-2)",
      slug: "ipad-centers-phonics",
      teaser: "Set up engaging phonics centers using just 2-3 iPads in your classroom.",
      takeaway: "Rotate stations every 15 minutes",
      published_at: new Date().toISOString(),
      grade_band: "K-2",
      primary_keyword: "iPad phonics centers",
    },
    {
  id: "7",
  title: "How AI Can Simplify Lesson Planning",
  slug: "ai-simplify-lesson-planning",
  teaser: `
    <p>Lesson planning can take hours each week. With AI tools like ChatGPT and Canva Magic Write, 
    teachers can save time by generating draft lesson plans, worksheets, and quizzes in minutes.</p>

    <p>AI doesn’t replace the teacher’s creativity or expertise—it supports it. 
    Teachers can focus on adapting the AI-generated content to their students’ needs.</p>

    <h3>Practical Tips</h3>
    <ul>
      <li>Use ChatGPT to generate differentiated reading passages.</li>
      <li>Create quizzes quickly with tools like Quizizz AI.</li>
      <li>Build worksheets in Canva using AI text-to-worksheet templates.</li>
    </ul>

    <figure>
      <img src="https://via.placeholder.com/800x400.png?text=AI+Lesson+Planning" alt="AI lesson planning demo" />
      <figcaption>Example of AI-assisted worksheet creation</figcaption>
    </figure>
  `,
  takeaway: "Start by using AI for one simple task, like quiz creation, to save hours each week.",
  published_at: new Date().toISOString(),
  grade_band: "All Grades",
  primary_keyword: "AI lesson planning",
}

  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) {
      // Use sample posts if no data in database
      setPosts(samplePosts);
    } else {
      setPosts(data?.length ? data : samplePosts);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.teaser?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Teacher Tech Blog"
        description="Practical EdTech strategies, tool reviews, and classroom success stories. Get weekly tech tips and learn how to integrate technology effectively in your classroom."
        keywords="teacher technology blog, EdTech strategies, classroom tech tips, educational technology articles, Google Classroom tips, AI in education blog"
        canonicalUrl="https://schooltechhub.com/blog"
      />
      <StructuredData 
        type="Article" 
        data={{
          headline: "Teacher Tech Blog - Practical EdTech Strategies",
          description: "Latest educational technology insights and classroom strategies",
          image: "https://schooltechhub.com/blog-hero.jpg",
          datePublished: new Date().toISOString(),
          url: "https://schooltechhub.com/blog"
        }} 
      />
      <Navigation />

      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Teacher Tech Blog</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Practical strategies, tool reviews, and classroom success stories
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-6"
            />
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 px-4 flex-1">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="space-y-8">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="p-6 hover:shadow-large transition-shadow">
                    <article>
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                        {post.grade_band && (
                          <Badge variant="secondary">{post.grade_band}</Badge>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold mb-3 hover:text-primary transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>

                      {post.teaser && (
                        <p className="text-muted-foreground mb-4">{post.teaser}</p>
                      )}

                      {post.takeaway && (
                        <div className="mb-4 p-3 bg-accent/10 rounded-lg border-l-4 border-accent">
                          <p className="text-sm font-medium">
                            💡 Key Takeaway: {post.takeaway}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {post.primary_keyword && (
                            <Badge variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {post.primary_keyword}
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/blog/${post.slug}`}>
                            Read More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  </Card>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No articles found. Try adjusting your search.
                  </p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Newsletter CTA */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
                <h3 className="font-semibold mb-3">Weekly Tech Tips</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get classroom-ready tech strategies delivered to your inbox every Monday.
                </p>
                <Button className="w-full">Subscribe Free</Button>
              </Card>

              {/* Popular Topics */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Popular Topics</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">AI Tools</Badge>
                  <Badge variant="secondary">Google Classroom</Badge>
                  <Badge variant="secondary">iPad Apps</Badge>
                  <Badge variant="secondary">Engagement</Badge>
                  <Badge variant="secondary">Assessment</Badge>
                  <Badge variant="secondary">Differentiation</Badge>
                </div>
              </Card>

              {/* Quick Resources */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/tools"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      → Browse Tool Directory
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/tutorials"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      → Video Tutorials
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/services"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      → Book 1:1 Coaching
                    </Link>
                  </li>
                </ul>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
