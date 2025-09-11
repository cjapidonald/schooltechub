import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Clock, Users, Filter, BookOpen, Lightbulb, PlayCircle, FileText, ListChecks, HelpCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { useContent } from "@/hooks/useContent";

const Learn = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedFilters, setSelectedFilters] = useState({
    stages: [] as string[],
    subjects: [] as string[],
    groupSizes: [] as string[],
  });
  
  const { content, loading } = useContent({
    hub: 'learn',
    contentTypes: selectedType === "all" ? undefined : [selectedType as any],
    stages: selectedFilters.stages,
    subjects: selectedFilters.subjects,
    groupSizes: selectedFilters.groupSizes,
    searchTerm
  });

  const contentTypes = [
    { value: "all", label: "All Resources", icon: BookOpen },
    { value: "tutorial", label: "Tutorials", icon: PlayCircle },
    { value: "technique", label: "Teaching Techniques", icon: Lightbulb },
    { value: "activity", label: "Activities", icon: ListChecks },
    { value: "lesson_plan", label: "Lesson Plans", icon: FileText },
    { value: "tip", label: "Teacher Tips", icon: HelpCircle }
  ];

  const filters = {
    stages: ["Kindergarten", "Primary", "Middle", "High School"],
    subjects: ["Phonics", "Math", "Science", "CS/ICT", "Social Studies", "Arts", "Music", "PE/Health", "SEL", "Languages"],
    groupSizes: ["1:1", "Small Group", "Whole Class"],
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  return (
    <>
      <SEO 
        title="Learn - Educational Resources & Teaching Strategies"
        description="Access free tutorials, teaching techniques, activities, lesson plans, and tips to enhance your classroom with technology."
        keywords="teaching resources, lesson plans, educational activities, teaching techniques, classroom tutorials, teacher tips"
        canonicalUrl="https://schooltechhub.com/learn"
      />
      <Navigation />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">Learn Hub</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore tutorials, teaching strategies, and practical resources for your classroom
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search learning resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-6"
              />
            </div>
          </div>

          <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
              {contentTypes.map(type => (
                <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-1">
                  <type.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-64">
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" className="w-full mb-4">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Filter Resources</SheetTitle>
                  </SheetHeader>
                  <FilterContent
                    filters={filters}
                    selectedFilters={selectedFilters}
                    toggleFilter={toggleFilter}
                  />
                </SheetContent>
              </Sheet>

              <div className="hidden lg:block">
                <h3 className="font-semibold mb-4">Filters</h3>
                <FilterContent
                  filters={filters}
                  selectedFilters={selectedFilters}
                  toggleFilter={toggleFilter}
                />
              </div>
            </aside>

            {/* Results Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-12">Loading resources...</div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {content.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">
                            {contentTypes.find(t => t.value === item.content_type)?.label || item.content_type}
                          </Badge>
                          {item.duration_minutes && (
                            <span className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {item.duration_minutes} min
                            </span>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-3">
                          {item.body?.teaser || item.body?.description || ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.stages?.slice(0, 2).map((stage: string) => (
                            <Badge key={stage} variant="outline" className="text-xs">
                              {stage}
                            </Badge>
                          ))}
                        </div>
                        <Button asChild className="w-full">
                          <Link to={`/learn/${item.content_type}/${item.slug}`}>
                            View Resource
                          </Link>
                        </Button>
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
    </>
  );
};

const FilterContent = ({ filters, selectedFilters, toggleFilter }: any) => {
  return (
    <div className="space-y-6 mt-6">
      {Object.entries(filters).map(([category, values]) => (
        <div key={category}>
          <Label className="text-sm font-semibold mb-3 block">
            {category === "stages" ? "School Stages" : 
             category === "groupSizes" ? "Group Sizes" :
             category.charAt(0).toUpperCase() + category.slice(1)}
          </Label>
          <div className="space-y-2">
            {(values as string[]).map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${category}-${value}`}
                  checked={selectedFilters[category].includes(value)}
                  onCheckedChange={() => toggleFilter(category, value)}
                />
                <Label
                  htmlFor={`${category}-${value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {value}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Learn;