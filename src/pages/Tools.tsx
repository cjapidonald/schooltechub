import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Clock, Users, ExternalLink, BookOpen, Plus, Check, FileText, Layout, Package } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useContent, type ContentItem } from "@/hooks/useContent";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Tools = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tools");
  const [selectedFilters, setSelectedFilters] = useState({
    stages: [] as string[],
    subjects: [] as string[],
    cost: [] as string[],
    groupSizes: [] as string[],
  });
  const [compareList, setCompareList] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch tools and templates
  const { content: tools, loading: toolsLoading } = useContent({
    hub: 'tools',
    contentTypes: ['tool'],
    stages: selectedFilters.stages,
    subjects: selectedFilters.subjects,
    cost: selectedFilters.cost.map(c => c.toLowerCase() as 'free' | 'freemium' | 'paid'),
    groupSizes: selectedFilters.groupSizes,
    searchTerm: searchTerm,
  });

  const { content: templates, loading: templatesLoading } = useContent({
    hub: 'tools',
    contentTypes: ['template'],
    stages: selectedFilters.stages,
    subjects: selectedFilters.subjects,
    cost: selectedFilters.cost.map(c => c.toLowerCase() as 'free' | 'freemium' | 'paid'),
    searchTerm: searchTerm,
  });

  const filters = {
    stages: ["Kindergarten", "Primary", "Middle", "High School"],
    subjects: ["Phonics", "Math", "Science", "CS/ICT", "Social Studies", "Arts", "Music", "PE/Health", "SEL", "Languages"],
    cost: ["Free", "Freemium", "Paid"],
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

  const toggleCompare = (toolId: string) => {
    setCompareList((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : prev.length < 3
        ? [...prev, toolId]
        : prev
    );
  };

  const activeContent = activeTab === "tools" ? tools : templates;
  const loading = activeTab === "tools" ? toolsLoading : templatesLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Tools Hub - Educational Technology & Resources"
        description="Discover classroom-ready EdTech tools and templates. Browse our curated directory of educational technology solutions and resources for K-12 teachers."
        keywords="educational tools, classroom templates, K-12 technology, teaching resources, EdTech directory, free educational apps"
        canonicalUrl="https://schooltechhub.com/tools"
      />
      <Navigation />

      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4">Tools Hub</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover classroom-ready tech tools and templates that actually work
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search tools and templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-6 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Tabs and Content */}
      <section className="py-8 px-4 flex-1">
        <div className="container mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>

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
                      <SheetTitle>Filter {activeTab === "tools" ? "Tools" : "Templates"}</SheetTitle>
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
                    {loading ? "Loading..." : `Showing ${activeContent.length} ${activeTab}`}
                  </p>
                  {compareList.length > 0 && activeTab === "tools" && (
                    <Button variant="outline">
                      Compare ({compareList.length})
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {activeContent.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      isComparing={compareList.includes(item.id)}
                      onToggleCompare={() => toggleCompare(item.id)}
                      showCompare={activeTab === "tools"}
                    />
                  ))}
                </div>

                {!loading && activeContent.length === 0 && (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">
                      No {activeTab} found matching your criteria. Try adjusting your filters.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </Tabs>
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

const ContentCard = ({ item, isComparing, onToggleCompare, showCompare }: {
  item: ContentItem;
  isComparing: boolean;
  onToggleCompare: () => void;
  showCompare: boolean;
}) => {
  const toolMeta = item.tool_meta as any;
  const teaser = item.body?.teaser || "";
  
  return (
    <Card className="p-6 hover:shadow-large transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{item.title}</h3>
        {showCompare && (
          <Button
            variant={isComparing ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleCompare}
          >
            {isComparing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {teaser && (
        <p className="text-sm text-muted-foreground mb-4">{teaser}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {item.stages?.map((stage: string) => (
          <Badge key={stage} variant="secondary">
            {stage}
          </Badge>
        ))}
        {item.subjects?.slice(0, 3).map((subject: string) => (
          <Badge key={subject} variant="outline">
            {subject}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        {item.duration_minutes && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{item.duration_minutes} min</span>
          </div>
        )}
        {item.group_sizes && item.group_sizes.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{item.group_sizes[0]}</span>
          </div>
        )}
        {item.cost && (
          <Badge variant={item.cost === "free" ? "secondary" : "default"}>
            {item.cost.charAt(0).toUpperCase() + item.cost.slice(1)}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        {toolMeta?.website_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={toolMeta.website_url} target="_blank" rel="noopener noreferrer">
              Try it
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link to={`/tools/${item.slug}`}>
            <BookOpen className="mr-2 h-3 w-3" />
            View Details
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default Tools;