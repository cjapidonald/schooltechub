import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Zap, Cpu, BookOpen, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const Edutech = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    contentType: searchParams.getAll("contentType") || [],
    deliveryType: searchParams.getAll("deliveryType") || [],
    payment: searchParams.getAll("payment") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || [],
    instructionType: searchParams.getAll("instructionType") || []
  });
  const { language } = useLanguage();

  const categories = [
    { value: "all", label: "All" },
    { value: "Lesson Planning", label: "Lesson Planning" },
    { value: "Lesson Delivery", label: "Lesson Delivery" },
    { value: "Engagement", label: "Engagement" },
    { value: "Evaluation", label: "Evaluation" }
  ];

  const filterOptions = {
    contentType: ["tutorial", "teaching_technique", "activity"],
    deliveryType: ["In-class", "Online", "Hybrid", "Self-paced", "Distance Learning", "Live"],
    payment: ["Free", "Freemium", "Paid", "Free Trial", "Education Discount"],
    stage: ["Early Childhood", "Pre-K", "Kindergarten", "Lower Primary", "Upper Primary", "Primary", "Secondary", "High School", "K-12", "K-5"],
    subject: ["Phonics", "Reading", "Writing", "Grammar", "Spelling", "Vocabulary", "English/ELA", "Math", "Science", "Biology", "Chemistry", "Physics", "Earth Science", "ICT", "STEM", "STEAM"],
    instructionType: ["Direct Instruction", "Differentiated Instruction", "Inquiry-Based Learning", "Project-Based Learning", "Problem-Based Learning", "Play-Based Learning", "Game-Based Learning", "Gamification", "Cooperative Learning", "Experiential Learning", "Design Thinking", "Socratic Seminar", "Station Rotation", "Blended Learning"]
  };

  const contentTypeIcons = {
    tutorial: <BookOpen className="h-4 w-4" />,
    teaching_technique: <Cpu className="h-4 w-4" />,
    activity: <Activity className="h-4 w-4" />
  };

  const contentTypeLabels = {
    tutorial: "Tutorial",
    teaching_technique: "Teaching Technique",
    activity: "Activity"
  };

  useEffect(() => {
    fetchContent();
  }, [searchTerm, selectedCategory, filters]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("content_master")
        .select("*")
        .eq("page", "edutech")
        .eq("is_published", true);

      if (selectedCategory !== "all") {
        query = query.or(`category.eq.${selectedCategory},subcategory.eq.${selectedCategory}`);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      if (filters.contentType.length > 0) {
        query = query.in("content_type", filters.contentType as any);
      }

      if (filters.deliveryType.length > 0) {
        query = query.in("delivery_type", filters.deliveryType as any);
      }

      if (filters.payment.length > 0) {
        query = query.in("payment", filters.payment as any);
      }

      if (filters.stage.length > 0) {
        query = query.in("stage", filters.stage as any);
      }

      if (filters.subject.length > 0) {
        query = query.in("subject", filters.subject as any);
      }

      if (filters.instructionType.length > 0) {
        query = query.in("delivery_type", filters.instructionType as any);
      }

      const { data, error } = await query.order("published_at", { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
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

  const getPrepLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "low prep": return "bg-green-100 text-green-800";
      case "medium prep": return "bg-yellow-100 text-yellow-800";
      case "high prep": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Edutech Hub: Tutorials, Techniques & Lesson Planning"
        description="Learn classroom technology the practical way: tutorials, teaching techniques, activities, and AI lesson planning. Filter by grade, subject, and time to implement."
        canonicalUrl="https://schooltechhub.com/edutech"
      />
      <main className="flex-1">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Edutech Hub</h1>
            <p className="text-muted-foreground">
              Learn new technologies, teaching techniques, activities, and AI lesson planning.
            </p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tutorials, techniques, activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="grid w-full grid-cols-5">
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
                    {filterOptions.contentType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.contentType.includes(type)}
                          onChange={() => toggleFilter("contentType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm flex items-center gap-1">
                          {contentTypeIcons[type as keyof typeof contentTypeIcons]}
                          {contentTypeLabels[type as keyof typeof contentTypeLabels]}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Delivery Type</h4>
                    {filterOptions.deliveryType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.deliveryType.includes(type)}
                          onChange={() => toggleFilter("deliveryType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Payment</h4>
                    {filterOptions.payment.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.payment.includes(type)}
                          onChange={() => toggleFilter("payment", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{type}</span>
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
                  <p className="text-muted-foreground">Loading content...</p>
                </div>
              ) : content.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No content found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {content.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {contentTypeIcons[item.content_type as keyof typeof contentTypeIcons]}
                              {contentTypeLabels[item.content_type as keyof typeof contentTypeLabels]}
                            </Badge>
                            {item.prep_level && (
                              <Badge className={getPrepLevelColor(item.prep_level)}>
                                {item.prep_level}
                              </Badge>
                            )}
                          </div>
                          {item.delivery_type && (
                            <Badge variant="outline">{item.delivery_type}</Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">
                          <Link
                            to={getLocalizedPath(`/edutech/${item.slug}`, language)}
                            className="hover:text-primary"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        
                        {item.subtitle && (
                          <p className="text-sm text-muted-foreground mb-2">{item.subtitle}</p>
                        )}
                        
                        <p className="text-sm text-muted-foreground mb-4">
                          {item.excerpt || "Click to learn more..."}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.stage && <Badge variant="outline">{item.stage}</Badge>}
                          {item.subject && <Badge variant="outline">{item.subject}</Badge>}
                          {item.payment && <Badge variant="outline">{item.payment}</Badge>}
                          {item.time_required && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.time_required}
                            </Badge>
                          )}
                        </div>
                        
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
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

    </div>
  );
};

export default Edutech;