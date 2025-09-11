import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Video, MapPin, Hammer, Mic } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { useContent } from "@/hooks/useContent";

const Events = () => {
  const { content, loading } = useContent({
    hub: 'community'
  });

  const eventCategories = [
    {
      icon: Hammer,
      title: "Workshops",
      description: "Hands-on learning experiences",
      link: "/events/workshops",
      color: "text-yellow-500"
    },
    {
      icon: Video,
      title: "Webinars",
      description: "Online sessions on EdTech and teaching strategies",
      link: "/events/webinars",
      color: "text-purple-500"
    },
    {
      icon: Users,
      title: "Meetups",
      description: "Local and virtual networking opportunities",
      link: "/events/meetups",
      color: "text-green-500"
    }
  ];

  return (
    <>
      <SEO 
        title="Events - Professional Development & Networking"
        description="Join educational events, webinars, conferences, and teacher meetups. Stay updated with the latest in education technology."
        keywords="education events, teacher conferences, EdTech webinars, professional development, teacher networking"
        canonicalUrl="https://schooltechhub.com/events"
      />
      <Navigation />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Events Hub</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect, learn, and grow with our education community events
            </p>
          </div>

          {/* Event Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {eventCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className={`${category.color} mb-3`}>
                    <category.icon className="h-10 w-10" />
                  </div>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to={category.link}>View Events</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Upcoming Events */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Upcoming Events
            </h2>
            
            {loading ? (
              <div className="text-center py-12">Loading events...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sample upcoming events - replace with actual data */}
                <Card className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge className="mb-2">Webinar</Badge>
                      <Badge variant="secondary">Free</Badge>
                    </div>
                    <CardTitle>AI in the Classroom: Getting Started</CardTitle>
                    <CardDescription>
                      Learn practical ways to integrate AI tools into your daily teaching
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>March 15, 2024</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>3:00 PM - 4:30 PM EST</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Online via Zoom</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4">Register Now</Button>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-secondary">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge className="mb-2">Workshop</Badge>
                      <Badge variant="secondary">In-Person</Badge>
                    </div>
                    <CardTitle>Digital Citizenship Workshop</CardTitle>
                    <CardDescription>
                      Hands-on session on teaching online safety and digital responsibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>March 22, 2024</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>9:00 AM - 12:00 PM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Ho Chi Minh City</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4">Learn More</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Past Events / Recordings */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              Past Events & Recordings
            </h2>
            <Card className="p-6 bg-muted/50">
              <p className="text-center text-muted-foreground">
                Access recordings from our previous events and webinars
              </p>
              <Button variant="outline" className="w-full mt-4">
                Browse Archive
              </Button>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Events;