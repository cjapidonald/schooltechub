import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, Users, BookOpen, Search, Filter, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Tutorials = () => {
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");

  // Sample tutorials for demonstration
  const sampleTutorials = [
    {
      id: "1",
      title: "Getting Started with Google Classroom",
      slug: "google-classroom-basics",
      description: "Master the fundamentals of Google Classroom in 15 minutes",
      difficulty_level: "Beginner",
      estimated_time: "15 min",
      school_stages: ["K-2", "3-5", "6-8", "9-12"],
      subjects: ["All"],
      video_url: "#",
      learning_outcomes: [
        "Create and organize classes",
        "Post assignments and materials",
        "Grade and provide feedback",
      ],
    },
    {
      id: "2",
      title: "AI-Powered Lesson Planning",
      slug: "ai-lesson-planning",
      description: "Use ChatGPT and other AI tools to create differentiated lessons",
      difficulty_level: "Intermediate",
      estimated_time: "25 min",
      school_stages: ["3-5", "6-8", "9-12"],
      subjects: ["All"],
      video_url: "#",
      learning_outcomes: [
        "Write effective AI prompts",
        "Generate differentiated content",
        "Create assessment rubrics",
      ],
    },
    {
      id: "3",
      title: "Interactive Whiteboards with Jamboard",
      slug: "jamboard-collaboration",
      description: "Transform group work with digital collaboration tools",
      difficulty_level: "Beginner",
      estimated_time: "20 min",
      school_stages: ["3-5", "6-8", "9-12"],
      subjects: ["Math", "Science", "Social Studies"],
      video_url: "#",
      learning_outcomes: [
        "Set up collaborative boards",
        "Use sticky notes and drawings",
        "Share and present work",
      ],
    },
    {
      id: "4",
      title: "Formative Assessment with Kahoot",
      slug: "kahoot-assessment",
      description: "Create engaging quizzes that students love",
      difficulty_level: "Beginner",
      estimated_time: "18 min",
      school_stages: ["K-2", "3-5", "6-8"],
      subjects: ["All"],
      video_url: "#",
      learning_outcomes: [
        "Build interactive quizzes",
        "Analyze student responses",
        "Use data to guide instruction",
      ],
    },
    {
      id: "5",
      title: "Video Creation with Screencastify",
      slug: "screencastify-videos",
      description: "Record lessons and student presentations easily",
      difficulty_level: "Intermediate",
      estimated_time: "30 min",
      school_stages: ["6-8", "9-12"],
      subjects: ["All"],
      video_url: "#",
      learning_outcomes: [
        "Record screen and webcam",
        "Edit and enhance videos",
        "Share via Google Drive",
      ],
    },
  ];

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      // Use sample tutorials if no data in database
      setTutorials(sampleTutorials);
    } else {
      setTutorials(data?.length ? data : sampleTutorials);
    }
  };

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel =
      selectedLevel === "all" || tutorial.difficulty_level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "secondary";
      case "Intermediate":
        return "default";
      case "Advanced":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Video Tutorials</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Step-by-step guides to master classroom technology
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-6"
            />
          </div>
        </div>
      </section>

      {/* Tutorials Grid */}
      <section className="py-16 px-4 flex-1">
        <div className="container mx-auto">
          {/* Filters */}
          <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All Levels</TabsTrigger>
              <TabsTrigger value="Beginner">Beginner</TabsTrigger>
              <TabsTrigger value="Intermediate">Intermediate</TabsTrigger>
              <TabsTrigger value="Advanced">Advanced</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Results count */}
          <p className="text-muted-foreground mb-6">
            Showing {filteredTutorials.length} tutorials
          </p>

          {/* Tutorials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <Card
                key={tutorial.id}
                className="overflow-hidden hover:shadow-large transition-shadow"
              >
                {/* Video Thumbnail Placeholder */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-4 bg-white/90 dark:bg-black/90 rounded-full">
                      <Play className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <Badge
                    className="absolute top-2 right-2"
                    variant={getDifficultyColor(tutorial.difficulty_level)}
                  >
                    {tutorial.difficulty_level}
                  </Badge>
                </div>

                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{tutorial.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tutorial.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{tutorial.estimated_time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{tutorial.school_stages?.[0] || "All Grades"}</span>
                    </div>
                  </div>

                  {/* Learning Outcomes */}
                  {tutorial.learning_outcomes && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        You'll learn:
                      </p>
                      <ul className="space-y-1">
                        {tutorial.learning_outcomes.slice(0, 3).map((outcome: string, index: number) => (
                          <li key={index} className="text-xs flex items-start gap-1">
                            <Star className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Tutorial
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No tutorials found. Try adjusting your search or filters.
              </p>
            </Card>
          )}

          {/* CTA Section */}
          <Card className="mt-12 p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Need Personalized Help?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Get 1-on-1 support tailored to your specific classroom needs. 
              Book a consultation and solve your tech challenges today.
            </p>
            <Link to="/services">
              <Button size="lg">Book 1:1 Coaching Session</Button>
            </Link>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tutorials;