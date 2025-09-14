import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Clock, BookOpen, HelpCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    blogType: searchParams.getAll("blogType") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || [],
    activityType: searchParams.getAll("activityType") || [],
    instructionType: searchParams.getAll("instructionType") || [],
    tags: searchParams.getAll("tags") || []
  });

  const categories = [
    { value: "all", label: "All" },
    { value: "Lesson Planning", label: "Lesson Planning" },
    { value: "Engagement", label: "Engagement" },
    { value: "Assessment", label: "Assessment" }
  ];

  const filterOptions = {
    blogType: ["case_study", "research_question", "research"],
    stage: ["Early Childhood", "Pre-K", "Kindergarten", "Lower Primary", "Upper Primary", "Primary", "Secondary", "High School", "K-12", "K-5"],
    subject: ["Phonics", "Reading", "Writing", "Grammar", "Spelling", "Vocabulary", "English/ELA", "Math", "Science", "Biology", "Chemistry", "Physics", "Earth Science", "ICT", "STEM", "STEAM"],
    activityType: ["1:1", "Pairs", "Small Group", "Whole Class", "Stations", "Clubs"],
    instructionType: ["Direct Instruction", "Differentiated Instruction", "Inquiry-Based Learning", "Project-Based Learning", "Problem-Based Learning", "Play-Based Learning", "Game-Based Learning", "Gamification", "Cooperative Learning", "Experiential Learning", "Design Thinking", "Socratic Seminar", "Station Rotation", "Blended Learning"]
  };

  const blogTypeIcons = {
    case_study: <FileText className="h-4 w-4" />,
    research_question: <HelpCircle className="h-4 w-4" />,
    research: <BookOpen className="h-4 w-4" />
  };

  const blogTypeLabels = {
    case_study: "Case Study",
    research_question: "Research Question",
    research: "Research"
  };

  useEffect(() => {
    fetchBlogPosts();
  }, [searchTerm, selectedCategory, filters]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("content_master")
        .select("*")
        .eq("page", "research_blog")
        .eq("is_published", true);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      if (filters.blogType.length > 0) {
        query = query.in("content_type", filters.blogType as any);
      }

      if (filters.stage.length > 0) {
        query = query.in("stage", filters.stage as any);
      }

      if (filters.subject.length > 0) {
        query = query.in("subject", filters.subject as any);
      }

      if (filters.activityType.length > 0) {
        query = query.in("activity_type", filters.activityType as any);
      }

      if (filters.instructionType.length > 0) {
        query = query.in("instruction_type", filters.instructionType as any);
      }

      const { data, error } = await query.order("published_at", { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
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
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    newFilters[filterType].forEach(v => params.append(filterType, v));
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Blog & Research: Ideas, Case Studies & Questions"
        description="EdTech ideas, research notes, research questions, and case studies for K-12. Practical strategies to integrate technology, improve engagement, and save time."
        canonicalUrl="https://schooltechhub.com/blog"
        type="website"
      />
      <Navigation />
      
      <main className="flex-1">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Blog & Research Hub</h1>
            <p className="text-muted-foreground">
              Ideas, research notes, research questions, and case studies for K-12 EdTech.
            </p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search blog posts, research, case studies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Blog Type</h4>
                    {filterOptions.blogType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.blogType.includes(type)}
                          onChange={() => toggleFilter("blogType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm flex items-center gap-1">
                          {blogTypeIcons[type as keyof typeof blogTypeIcons]}
                          {blogTypeLabels[type as keyof typeof blogTypeLabels]}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Stage</h4>
                    {filterOptions.stage.map((stage) => (
                      <label key={stage} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.stage.includes(stage)}
                          onChange={() => toggleFilter("stage", stage)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{stage}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Subject</h4>
                    {filterOptions.subject.map((subject) => (
                      <label key={subject} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.subject.includes(subject)}
                          onChange={() => toggleFilter("subject", subject)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Activity Type</h4>
                    {filterOptions.activityType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.activityType.includes(type)}
                          onChange={() => toggleFilter("activityType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Instruction Type</h4>
                    {filterOptions.instructionType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.instructionType.includes(type)}
                          onChange={() => toggleFilter("instructionType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">Loading blog posts...</p>
                </div>
              ) : blogPosts.length === 0 ? (
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
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {blogTypeIcons[post.content_type as keyof typeof blogTypeIcons]}
                              {blogTypeLabels[post.content_type as keyof typeof blogTypeLabels]}
                            </Badge>
                            {post.category && (
                              <Badge variant="outline">{post.category}</Badge>
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
                        
                        {post.subtitle && (
                          <p className="text-sm text-muted-foreground mb-2">{post.subtitle}</p>
                        )}
                        
                        <p className="text-muted-foreground mb-4">
                          {post.excerpt || "Click to read more..."}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.stage && <Badge variant="outline">{post.stage}</Badge>}
                          {post.subject && <Badge variant="outline">{post.subject}</Badge>}
                          {post.time_required && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.time_required}
                            </Badge>
                          )}
                        </div>
                        
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
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