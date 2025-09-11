import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MessageSquare, Trophy } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { useContent } from "@/hooks/useContent";

const Community = () => {
  const { content, loading } = useContent({
    hub: 'community'
  });

  return (
    <>
      <SEO 
        title="Community - Connect & Collaborate"
        description="Join our education community for events, discussions, and student showcases."
      />
      <Navigation />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">Community Hub</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect with educators, share experiences, and showcase student work
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-primary/20">
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Research Questions</CardTitle>
                <CardDescription>
                  Discuss and debate educational research topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/community/discussions">Join Discussions</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Events & Webinars</CardTitle>
                <CardDescription>
                  Upcoming training sessions and recordings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/community/events">View Events</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Student Projects</CardTitle>
                <CardDescription>
                  Showcase of amazing student work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/community/projects">Browse Projects</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading community content...</div>
          ) : content.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.slice(0, 6).map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <Badge variant="secondary" className="mb-2">
                        {item.content_type.replace('_', ' ')}
                      </Badge>
                      <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="ghost" className="w-full">
                        <Link to={`/community/${item.content_type}/${item.slug}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Community;