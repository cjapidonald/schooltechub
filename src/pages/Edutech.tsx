import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Users, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

const Edutech = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    grades: [] as string[],
    subjects: [] as string[],
    activityTypes: [] as string[],
  });

  const categories = [
    { value: "all", label: "All" },
    { value: "tutorial", label: "Tutorials" },
    { value: "technique", label: "Techniques" },
    { value: "activity", label: "Activities" },
    { value: "lesson-plan", label: "Lesson Plans" },
  ];

  const filterOptions = {
    grades: ["Pre-K", "K-2", "3-5", "6-8", "9-12"],
    subjects: ["Math", "Science", "Language Arts", "Social Studies", "Arts", "PE", "Technology"],
    activityTypes: ["video", "worksheet", "image", "app", "tpr-game", "simulation", "interactive", "presentation"],
  };

  useEffect(() => {
    fetchContent();
  }, [searchTerm, selectedCategory, selectedFilters]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("edtech")
        .select("*")
        .eq("is_published", true);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedFilters.grades.length > 0) {
        query = query.contains("grade_levels", selectedFilters.grades);
      }

      if (selectedFilters.subjects.length > 0) {
        query = query.contains("subjects", selectedFilters.subjects);
      }

      if (selectedFilters.activityTypes.length > 0) {
        query = query.contains("activity_type", selectedFilters.activityTypes);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Edutech Hub: Tutorials, Techniques & Lesson Planning"
        description="Learn classroom technology the practical way: tutorials, teaching techniques, activities, and AI lesson planning. Filter by grade, subject, and time to implement."
        canonicalUrl="https://schooltechhub.com/edutech"
      />
      <Navigation />
      
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
                    <h4 className="font-medium mb-3">Grade Levels</h4>
                    {filterOptions.grades.map((grade) => (
                      <label key={grade} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedFilters.grades.includes(grade)}
                          onChange={() => toggleFilter("grades", grade)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{grade}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Subjects</h4>
                    {filterOptions.subjects.map((subject) => (
                      <label key={subject} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedFilters.subjects.includes(subject)}
                          onChange={() => toggleFilter("subjects", subject)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Activity Types</h4>
                    {filterOptions.activityTypes.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedFilters.activityTypes.includes(type)}
                          onChange={() => toggleFilter("activityTypes", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm capitalize">{type.replace("-", " ")}</span>
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
                <div className="grid gap-6">
                  {content.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="secondary" className="capitalize">
                            {item.category.replace("-", " ")}
                          </Badge>
                          {item.duration && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {item.duration} min
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          <Link to={`/edutech/${item.slug}`} className="hover:text-primary">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="text-muted-foreground mb-4">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.grade_levels?.map((grade: string) => (
                            <Badge key={grade} variant="outline">
                              {grade}
                            </Badge>
                          ))}
                          {item.subjects?.map((subject: string) => (
                            <Badge key={subject} variant="outline">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                        {item.activity_type && item.activity_type.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.activity_type.map((type: string) => (
                              <Badge key={type} variant="secondary" className="capitalize">
                                {type.replace("-", " ")}
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

export default Edutech;