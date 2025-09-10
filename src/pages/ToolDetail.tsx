import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Clock, Users, DollarSign, Monitor, Accessibility } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RichContent from "@/components/RichContent";
import { SEO } from "@/components/SEO";
import { ShareButton } from "@/components/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface Tool {
  id: string;
  name: string;
  description: Json;
  quick_start: Json;
  best_for: string;
  cost: string;
  setup_time: string;
  group_size: string;
  devices: string[];
  subjects: string[];
  grade_bands: string[];
  school_stages: string[];
  activity_types: string[];
  accessibility: string;
  website_url: string;
  tutorial_url: string;
}

const ToolDetail = () => {
  const { id } = useParams();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTool();
  }, [id]);

  const fetchTool = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("tools_activities")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tool:", error);
        setLoading(false);
        return;
      }

      setTool(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading tool:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Tool Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The tool you're looking for doesn't exist.
            </p>
            <Link to="/tools">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tools
              </Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={`${tool.name} - EdTech Tool`}
        description={`Learn how to use ${tool.name} in your classroom. ${tool.best_for}`}
        keywords={`${tool.name}, educational technology, classroom tools, ${tool.subjects?.join(', ')}`}
        canonicalUrl={`https://schooltechhub.com/tools/${id}`}
      />
      <Navigation />

      <article className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Link to="/tools">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Button>
          </Link>

          {/* Tool header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{tool.name}</h1>
            
            {/* Tool metadata */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tool.grade_bands?.map((band) => (
                <Badge key={band} variant="secondary">{band}</Badge>
              ))}
              {tool.subjects?.map((subject) => (
                <Badge key={subject} variant="outline">{subject}</Badge>
              ))}
            </div>

            <p className="text-xl text-muted-foreground mb-4">
              {tool.best_for}
            </p>
          </header>

          {/* Quick info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Cost
              </div>
              <p className="font-semibold">{tool.cost}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Setup Time
              </div>
              <p className="font-semibold">{tool.setup_time}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                Group Size
              </div>
              <p className="font-semibold">{tool.group_size}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Monitor className="h-4 w-4" />
                Devices
              </div>
              <p className="font-semibold">{tool.devices?.join(", ")}</p>
            </Card>
          </div>

          {/* Description section */}
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">About This Tool</h2>
            <div className="prose prose-lg max-w-none">
              <RichContent content={tool.description as any} />
            </div>
          </Card>

          {/* Quick Start Guide */}
          {tool.quick_start && (
            <Card className="p-6 mb-8 bg-accent/5">
              <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>
              <div className="prose prose-lg max-w-none">
                <RichContent content={tool.quick_start as any} />
              </div>
            </Card>
          )}

          {/* Activity Types */}
          {tool.activity_types && tool.activity_types.length > 0 && (
            <Card className="p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Activity Types</h3>
              <div className="flex flex-wrap gap-2">
                {tool.activity_types.map((type) => (
                  <Badge key={type} variant="secondary">{type}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Accessibility */}
          {tool.accessibility && (
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Accessibility className="h-5 w-5" />
                <h3 className="text-xl font-semibold">Accessibility Features</h3>
              </div>
              <p className="text-muted-foreground">{tool.accessibility}</p>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {tool.website_url && (
              <Button size="lg" asChild>
                <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Tool Website
                </a>
              </Button>
            )}
            {tool.tutorial_url && (
              <Button size="lg" variant="outline" asChild>
                <a href={tool.tutorial_url} target="_blank" rel="noopener noreferrer">
                  Watch Tutorial
                </a>
              </Button>
            )}
          </div>

          {/* Share section */}
          <div className="mt-12 border-t pt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">Share this tool with colleagues</h3>
            <ShareButton title="Share this tool" />
          </div>

          {/* Call to action */}
          <Card className="mt-12 p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
            <h3 className="text-2xl font-bold mb-4">Need Help Implementing This Tool?</h3>
            <p className="text-muted-foreground mb-6">
              Get personalized training and support for your school.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button size="lg">Book Training Session</Button>
              </Link>
              <Link to="/tutorials">
                <Button size="lg" variant="outline">
                  Browse Tutorials
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default ToolDetail;