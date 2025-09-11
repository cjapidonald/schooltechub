import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { useContent } from "@/hooks/useContent";

const Evidence = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  const { content, loading } = useContent({
    hub: 'evidence',
    contentTypes: selectedType === "all" ? undefined : [selectedType as any],
    searchTerm
  });

  const contentTypes = [
    { value: "all", label: "All Evidence" },
    { value: "blog", label: "Blogs" },
    { value: "case_study", label: "Case Studies" },
    { value: "research", label: "Research" },
    { value: "news", label: "News & Trends" }
  ];

  return (
    <>
      <SEO 
        title="Evidence - Research, Case Studies & Insights"
        description="Explore educational research, case studies, success stories, and evidence-based practices in education technology."
      />
      <Navigation />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">Evidence Hub</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Research, case studies, and insights to inform your teaching practice
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search evidence and research..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-6"
              />
            </div>
          </div>

          <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
              {contentTypes.map(type => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="text-center py-12">Loading content...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{item.content_type.replace('_', ' ')}</Badge>
                      {item.published_at && (
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {item.body?.teaser || item.body?.description || ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link to={`/evidence/${item.content_type}/${item.slug}`}>
                        Read More
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

export default Evidence;