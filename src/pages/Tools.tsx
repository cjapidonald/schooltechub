import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Filter, Clock, Users, Zap, ExternalLink, BookOpen, Plus, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ToolActivity = Database["public"]["Tables"]["tools_activities"]["Row"];

const Tools = () => {
  const [tools, setTools] = useState<ToolActivity[]>([]);
  const [filteredTools, setFilteredTools] = useState<ToolActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    schoolStages: [] as string[],
    subjects: [] as string[],
    cost: [] as string[],
    groupSize: [] as string[],
  });
  const [compareList, setCompareList] = useState<string[]>([]);
  const { toast } = useToast();

  const filters = {
    schoolStages: ["Pre-K", "K-2", "3-5", "6-8", "9-12"],
    subjects: ["Phonics", "Math", "Science", "CS/ICT", "Social Studies", "Arts", "Music", "PE/Health", "SEL", "Languages"],
    cost: ["Free", "Paid"],
    groupSize: ["Solo", "Pairs", "Small Group", "Whole Class"],
  };

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [searchTerm, selectedFilters, tools]);

  const fetchTools = async () => {
    const { data, error } = await supabase
      .from("tools_activities")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error fetching tools",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTools(data || []);
      setFilteredTools(data || []);
    }
  };

  const filterTools = () => {
    let filtered = tools;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (selectedFilters.schoolStages.length > 0) {
      filtered = filtered.filter((tool) =>
        tool.school_stages?.some((stage: string) => selectedFilters.schoolStages.includes(stage))
      );
    }

    if (selectedFilters.subjects.length > 0) {
      filtered = filtered.filter((tool) =>
        tool.subjects?.some((subject: string) => selectedFilters.subjects.includes(subject))
      );
    }

    if (selectedFilters.cost.length > 0) {
      filtered = filtered.filter((tool) => selectedFilters.cost.includes(tool.cost));
    }

    if (selectedFilters.groupSize.length > 0) {
      filtered = filtered.filter((tool) =>
        selectedFilters.groupSize.includes(tool.group_size || "")
      );
    }

    setFilteredTools(filtered);
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  const toggleCompare = (toolId: string) => {
    setCompareList((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : prev.length < 3
        ? [...prev, toolId]
        : prev
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Tools & Activities"
        description="Discover classroom-ready EdTech tools and activities. Browse our curated directory of educational technology solutions for K-12 teachers. Free and paid options available."
        keywords="educational tools, classroom activities, K-12 technology, teaching resources, EdTech directory, free educational apps, classroom management tools"
        canonicalUrl="https://schooltechhub.com/tools"
      />
      <Navigation />

      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4">Tools & Activities Directory</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover classroom-ready tech tools and activities that actually work
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search tools and activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-6 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Filters and Results */}
      <section className="py-8 px-4 flex-1">
        <div className="container mx-auto">
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
                    <SheetTitle>Filter Tools</SheetTitle>
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
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">
                  Showing {filteredTools.length} of {tools.length} tools
                </p>
                {compareList.length > 0 && (
                  <Button variant="outline">
                    Compare ({compareList.length})
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isComparing={compareList.includes(tool.id)}
                    onToggleCompare={() => toggleCompare(tool.id)}
                  />
                ))}
              </div>

              {filteredTools.length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No tools found matching your criteria. Try adjusting your filters.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FilterContent = ({ filters, selectedFilters, toggleFilter }: any) => {
  return (
    <div className="space-y-6 mt-6">
      {Object.entries(filters).map(([category, values]) => (
        <div key={category}>
          <Label className="text-sm font-semibold mb-3 block">
            {category.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
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

const ToolCard = ({ tool, isComparing, onToggleCompare }: any) => {
  return (
    <Card className="p-6 hover:shadow-large transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{tool.name}</h3>
        <Button
          variant={isComparing ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleCompare}
        >
          {isComparing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {tool.best_for && (
        <p className="text-sm text-muted-foreground mb-4">Best for: {tool.best_for}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {tool.school_stages?.map((stage: string) => (
          <Badge key={stage} variant="secondary">
            {stage}
          </Badge>
        ))}
        {tool.subjects?.slice(0, 3).map((subject: string) => (
          <Badge key={subject} variant="outline">
            {subject}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        {tool.setup_time && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{tool.setup_time}</span>
          </div>
        )}
        {tool.group_size && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{tool.group_size}</span>
          </div>
        )}
        <Badge variant={tool.cost === "Free" ? "secondary" : "default"}>
          {tool.cost}
        </Badge>
      </div>

      <div className="flex gap-2">
        {tool.external_link && (
          <Button variant="outline" size="sm" asChild>
            <a href={tool.external_link} target="_blank" rel="noopener noreferrer">
              Try it
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm">
          <BookOpen className="mr-2 h-3 w-3" />
          Lesson idea
        </Button>
      </div>
    </Card>
  );
};

export default Tools;