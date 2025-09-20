import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, PenLine, HelpCircle, Lightbulb, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const TeacherDiary = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    diaryType: searchParams.getAll("diaryType") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || []
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
    diaryType: ["question", "challenge", "reflection"],
    stage: ["Early Childhood", "Pre-K", "Kindergarten", "Lower Primary", "Upper Primary", "Primary", "Secondary", "High School", "K-12", "K-5"],
    subject: ["Phonics", "Reading", "Writing", "Grammar", "Spelling", "Vocabulary", "English/ELA", "Math", "Science", "Biology", "Chemistry", "Physics", "Earth Science", "ICT", "STEM", "STEAM"]
  };

  const diaryTypeIcons = {
    question: <HelpCircle className="h-4 w-4" />,
    challenge: <MessageSquare className="h-4 w-4" />,
    reflection: <Lightbulb className="h-4 w-4" />
  };

  const diaryTypeLabels = {
    question: "Question",
    challenge: "Challenge",
    reflection: "Reflection"
  };

  const moodColors = {
    optimistic: "bg-green-100 text-green-800",
    neutral: "bg-gray-100 text-gray-800",
    frustrated: "bg-red-100 text-red-800",
    excited: "bg-yellow-100 text-yellow-800",
    thoughtful: "bg-blue-100 text-blue-800"
  };

  useEffect(() => {
    fetchEntries();
  }, [searchTerm, selectedCategory, filters]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("content_master")
        .select("*")
        .eq("page", "teacher_diary")
        .eq("is_published", true);

      if (selectedCategory !== "all") {
        query = query.or(`category.eq.${selectedCategory},subcategory.eq.${selectedCategory}`);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      if (filters.diaryType.length > 0) {
        query = query.in("diary_type", filters.diaryType);
      }

      if (filters.stage.length > 0) {
        query = query.in("stage", filters.stage as any);
      }

      if (filters.subject.length > 0) {
        query = query.in("subject", filters.subject as any);
      }

      const { data, error } = await query.order("published_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
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
        title="Teacher Diary: Reflections & Classroom Insights"
        description="Real teacher reflections, challenges, and insights from the classroom. Learn what works, what doesn't, and practical tips for your teaching journey."
        canonicalUrl="https://schooltechhub.com/teacher-diary"
      />
      <Navigation />
      
      <main className="flex-1">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <PenLine className="h-10 w-10" />
              Teacher Diary
            </h1>
            <p className="text-muted-foreground">
              Reflections, what worked/what to change. Questions, Challenges, Reflections.
            </p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search diary entries..."
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
                    <h4 className="font-medium mb-3">Type</h4>
                    {filterOptions.diaryType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.diaryType.includes(type)}
                          onChange={() => toggleFilter("diaryType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm flex items-center gap-1 capitalize">
                          {diaryTypeIcons[type as keyof typeof diaryTypeIcons]}
                          {diaryTypeLabels[type as keyof typeof diaryTypeLabels]}
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
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">Loading diary entries...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No diary entries found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-2">
                            {entry.diary_type && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                {diaryTypeIcons[entry.diary_type as keyof typeof diaryTypeIcons]}
                                {diaryTypeLabels[entry.diary_type as keyof typeof diaryTypeLabels]}
                              </Badge>
                            )}
                            {entry.mood && (
                              <Badge className={moodColors[entry.mood as keyof typeof moodColors] || "bg-gray-100 text-gray-800"}>
                                {entry.mood}
                              </Badge>
                            )}
                          </div>
                          {entry.published_at && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(entry.published_at), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-2">
                          <Link
                            to={getLocalizedPath(`/teacher-diary/${entry.slug}`, language)}
                            className="hover:text-primary"
                          >
                            {entry.title}
                          </Link>
                        </h3>
                        
                        {entry.subtitle && (
                          <p className="text-sm text-muted-foreground mb-2">{entry.subtitle}</p>
                        )}
                        
                        <p className="text-muted-foreground mb-4">
                          {entry.excerpt || "Click to read more..."}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {entry.category && <Badge variant="outline">{entry.category}</Badge>}
                          {entry.subcategory && <Badge variant="outline">{entry.subcategory}</Badge>}
                          {entry.stage && <Badge variant="outline">{entry.stage}</Badge>}
                          {entry.subject && <Badge variant="outline">{entry.subject}</Badge>}
                        </div>
                        
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map((tag: string) => (
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

export default TeacherDiary;