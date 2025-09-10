import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Clock, Target, BookOpen } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RichContent from "@/components/RichContent";
import { SEO } from "@/components/SEO";
import { ShareButton } from "@/components/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface Tutorial {
  id: string;
  title: string;
  description: Json;
  difficulty_level: string;
  estimated_time: string;
  school_stages: string[];
  learning_outcomes: string[];
  video_url: string;
  is_published: boolean;
}

const TutorialDetail = () => {
  const { id } = useParams();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorial();
  }, [id]);

  const fetchTutorial = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tutorial:", error);
        setLoading(false);
        return;
      }

      setTutorial(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading tutorial:", err);
      setLoading(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (!tutorial) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Tutorial Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The tutorial you're looking for doesn't exist.
            </p>
            <Link to="/tutorials">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tutorials
              </Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(tutorial.video_url);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={`${tutorial.title} - Tutorial`}
        description={`Learn ${tutorial.title}. Difficulty: ${tutorial.difficulty_level}. Time: ${tutorial.estimated_time}.`}
        keywords={`${tutorial.title}, educational technology tutorial, teacher training, ${tutorial.school_stages?.join(', ')}`}
        canonicalUrl={`https://schooltechhub.com/tutorials/${id}`}
      />
      <Navigation />

      <article className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Link to="/tutorials">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tutorials
            </Button>
          </Link>

          {/* Tutorial header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge className={getDifficultyColor(tutorial.difficulty_level)}>
                {tutorial.difficulty_level}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{tutorial.estimated_time}</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{tutorial.title}</h1>
            
            {/* School stages */}
            {tutorial.school_stages && tutorial.school_stages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tutorial.school_stages.map((stage) => (
                  <Badge key={stage} variant="outline">{stage}</Badge>
                ))}
              </div>
            )}
          </header>

          {/* Video section */}
          {videoId && (
            <Card className="mb-8 overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={tutorial.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </Card>
          )}

          {/* Description */}
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">About This Tutorial</h2>
            <div className="prose prose-lg max-w-none">
              <RichContent content={tutorial.description as any} />
            </div>
          </Card>

          {/* Learning Outcomes */}
          {tutorial.learning_outcomes && tutorial.learning_outcomes.length > 0 && (
            <Card className="p-6 mb-8 bg-accent/5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-accent" />
                <h2 className="text-2xl font-bold">Learning Outcomes</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                By the end of this tutorial, you will be able to:
              </p>
              <ul className="space-y-2">
                {tutorial.learning_outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {tutorial.video_url && (
              <Button size="lg" asChild>
                <a href={tutorial.video_url} target="_blank" rel="noopener noreferrer">
                  <Play className="mr-2 h-4 w-4" />
                  Watch on YouTube
                </a>
              </Button>
            )}
            <Link to="/tools">
              <Button size="lg" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Explore Related Tools
              </Button>
            </Link>
          </div>

          {/* Share section */}
          <div className="mt-12 border-t pt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">Found this tutorial helpful?</h3>
            <ShareButton title="Share this tutorial" />
          </div>

          {/* Call to action */}
          <Card className="mt-12 p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
            <h3 className="text-2xl font-bold mb-4">Want Personalized Training?</h3>
            <p className="text-muted-foreground mb-6">
              Get hands-on support tailored to your classroom needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button size="lg">Book a Session</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Contact Us
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

export default TutorialDetail;