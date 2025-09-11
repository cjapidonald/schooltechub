import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, BookOpen, Users, Target } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { useContent, ContentItem } from "@/hooks/useContent";

const Learn = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  const { content, loading } = useContent({
    hub: 'learn',
    contentTypes: selectedType === "all" ? undefined : [selectedType as any],
    searchTerm
  });

  const contentTypes = [
    { value: "all", label: "All Resources" },
    { value: "tutorial", label: "Tutorials" },
    { value: "teaching_technique", label: "Teaching Techniques" },
    { value: "activity", label: "Activities" },
    { value: "lesson_plan", label: "Lesson Plans" },
    { value: "teacher_tip", label: "Teacher Tips" }
  ];

  return (
    <>
      <SEO 
        title="Learn - Educational Resources & Guides"
        description="Access tutorials, teaching techniques, activities, lesson plans, and tips for effective education technology integration."
      />
      <Navigation />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">Learn Hub</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover tutorials, teaching techniques, activities, and resources to transform your classroom
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
            <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
              {contentTypes.map(type => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="text-center py-12">Loading resources...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{item.content_type.replace('_', ' ')}</Badge>
                      {item.duration_minutes && (
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {item.body?.description || item.body?.teaser || ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.stages?.map(stage => (
                        <Badge key={stage} variant="outline">{stage}</Badge>
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
      </main>
      
      <Footer />
    </>
  );
};

export default Learn;