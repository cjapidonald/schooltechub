import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Calendar, Clock, GraduationCap, Lightbulb, MessageSquare, ChevronDown, BookOpen, Microscope, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [featuredPost, setFeaturedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterJob, setNewsletterJob] = useState("");
  const [newsletterRole, setNewsletterRole] = useState("Teacher");
  const { toast } = useToast();
  const langParam = searchParams.get("lang");
  const lang: "en" | "sq" | "vi" = langParam === "sq" || langParam === "vi" ? langParam : "en";
  
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

  const filterCategories = [
    { value: "Edu Tech", label: "Edu Tech", icon: <BookOpen className="h-4 w-4" /> },
    { value: "Tutorials", label: "Tutorials", icon: <GraduationCap className="h-4 w-4" /> },
    { value: "Teaching Techniques", label: "Teaching Techniques", icon: <Lightbulb className="h-4 w-4" /> },
    { value: "Class Activity", label: "Class Activity", icon: <GraduationCap className="h-4 w-4" /> },
    { value: "Teacher Reflection", label: "Teacher Reflection", icon: <MessageSquare className="h-4 w-4" /> },
    { value: "Tips", label: "Tips", icon: <Lightbulb className="h-4 w-4" /> },
    { value: "Shop", label: "Shop", icon: <ShoppingBag className="h-4 w-4" /> },
    { value: "Case Study", label: "Case Study", icon: <BookOpen className="h-4 w-4" /> },
    { value: "Research", label: "Research", icon: <Microscope className="h-4 w-4" /> },
    { value: "Teacher Debates", label: "Teacher Debates", icon: <MessageSquare className="h-4 w-4" /> }
  ];

  const filterOptions = {
    stage: ["Early Childhood", "Pre-K", "Kindergarten", "Primary", "Secondary", "High School", "K-12", "K-5"],
    subject: ["Phonics", "English", "Math", "Science", "Biology", "Chemistry", "Physics", "Earth Science", "History", "Geography", "Music", "Arts", "ICT", "PE", "Global Perspective", "Circle Time", "Break Time", "STEAM"],
    delivery: ["In-class", "Online", "Live", "Homework"],
    payment: ["Free", "Paid", "Education Discount"],
    platform: ["Mobile App", "Webapp", "Smartphone", "Smartboard", "Mac", "Windows"]
  };

  useEffect(() => {
    fetchBlogPosts();
  }, [searchTerm, filters, lang]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("content_master")
        .select("*")
        .in("page", ["research_blog", "edutech", "teacher_diary"]) 
        .eq("is_published", true)
        .eq("language", lang);

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
        role: newsletterRole as "Teacher" | "Admin" | "Parent" | "Student" | "Other" | undefined,
        segments: ["teacher_updates"]
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already subscribed",
          description: "This email is already subscribed to our newsletter.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to subscribe. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Success!",
        description: "You've been subscribed to our Teacher Updates newsletter.",
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

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Blog: EdTech Ideas, Research & Teaching Resources"
        description="Explore EdTech ideas, research notes, teaching techniques, and case studies for K-12. Find practical strategies to integrate technology and improve engagement."
        canonicalUrl="https://schooltechhub.com/blog"
        type="website"
        lang={lang}
      />
      <Navigation />
      
      <main className="flex-1">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Blog & Resources</h1>
            <p className="text-muted-foreground">
              Ideas, research, teaching techniques, and resources for K-12 educators.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Filters */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Filter */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">Category</h4>
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
                      <h4 className="font-medium">Stage</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.stage.map((stage) => (
                        <label key={stage} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.stage.includes(stage)}
                            onChange={() => toggleFilter("stage", stage)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{stage}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Subject Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">Subject</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.subject.map((subject) => (
                        <label key={subject} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.subject.includes(subject)}
                            onChange={() => toggleFilter("subject", subject)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{subject}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Delivery Type Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">Delivery Type</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.delivery.map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.delivery.includes(type)}
                            onChange={() => toggleFilter("delivery", type)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Payment Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">Payment</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.payment.map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.payment.includes(type)}
                            onChange={() => toggleFilter("payment", type)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Platform Filter */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-medium">Platform</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {filterOptions.platform.map((platform) => (
                        <label key={platform} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.platform.includes(platform)}
                            onChange={() => toggleFilter("platform", platform)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{platform}</span>
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
                  <p className="text-muted-foreground">Loading blog posts...</p>
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
                          <Badge className="mb-2">{featuredPost.filter_type || "Featured"}</Badge>
                          <h2 className="text-2xl font-bold mb-2">
                            <Link to={`/blog/${featuredPost.slug}`} className="hover:text-primary">
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
                      <p className="text-muted-foreground">No blog posts found matching your criteria.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {blogPosts.map((post) => (
                        <Card key={post.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-2">
                                {post.filter_type && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    {getCategoryIcon(post.filter_type)}
                                    {post.filter_type}
                                  </Badge>
                                )}
                              </div>
                              {post.published_at && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {format(new Date(post.published_at), "MMM d, yyyy")}
                                </div>
                              )}
                            </div>
                            
                            <h3 className="text-xl font-semibold mb-2">
                              <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                                {post.title}
                              </Link>
                            </h3>
                            
                            {post.excerpt && (
                              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                            )}
                            
                            {post.author && (
                              <p className="text-sm text-muted-foreground mb-3">
                                By {post.author.name || "SchoolTechHub Team"}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                              {post.stage && <Badge variant="outline">{post.stage}</Badge>}
                              {post.subject && <Badge variant="outline">{post.subject}</Badge>}
                              {post.time_required && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {post.time_required}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Newsletter Signup */}
                  <Card>
                    <CardHeader>
                      <CardTitle>📩 Join our Teacher Updates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            type="email"
                            placeholder="Email (required)"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            required
                          />
                          <Input
                            type="text"
                            placeholder="Full Name"
                            value={newsletterName}
                            onChange={(e) => setNewsletterName(e.target.value)}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            type="text"
                            placeholder="Job Position"
                            value={newsletterJob}
                            onChange={(e) => setNewsletterJob(e.target.value)}
                          />
                          <select
                            value={newsletterRole}
                            onChange={(e) => setNewsletterRole(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">Admin</option>
                            <option value="Parent">Parent</option>
                            <option value="Student">Student</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <Button type="submit" className="w-full">
                          Subscribe to Newsletter
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

      <Footer />
    </div>
  );
};

export default Blog;