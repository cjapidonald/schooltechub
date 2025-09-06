import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Users, BookOpen, Target, Heart, Lightbulb } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const About = () => {
  const mission = [
    {
      icon: Target,
      title: "Practical First",
      description: "Every strategy must work in real classrooms, not just in theory.",
    },
    {
      icon: Heart,
      title: "Teacher-Centered",
      description: "We understand the daily challenges and time constraints you face.",
    },
    {
      icon: Lightbulb,
      title: "Continuous Learning",
      description: "Technology evolves, and so do our methods and recommendations.",
    },
  ];

  const stats = [
    { number: "15+", label: "Years Teaching Experience" },
    { number: "500+", label: "Workshops Delivered" },
    { number: "10,000+", label: "Teachers Supported" },
    { number: "200+", label: "Schools Partnered" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About School Tech Hub</h1>
            <p className="text-xl text-muted-foreground">
              From classroom teacher to tech trainer, helping educators embrace technology with confidence
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-card to-primary/5">
              <h2 className="text-2xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  School Tech Hub was born from a simple observation: amazing teachers were struggling with technology 
                  not because they weren't capable, but because tech training wasn't designed for real classrooms.
                </p>
                <p>
                  After 15 years in the classroom, I watched countless professional development sessions promise 
                  revolutionary changes, only to see teachers return to their rooms overwhelmed and unsupported. 
                  The gap between what tech could do and what teachers could realistically implement was enormous.
                </p>
                <p>
                  That's when I made the shift from teaching to training, with one goal: bridge that gap. Every 
                  workshop, every consultation, every resource we create starts with one question: "Will this actually 
                  work when a teacher has 28 students, limited devices, and 5 minutes to set up?"
                </p>
                <p>
                  Today, School Tech Hub supports thousands of teachers across the country, providing practical, 
                  tested strategies that respect both the power of technology and the reality of teaching. We're 
                  not here to add to your plate – we're here to help you use tech to make your plate more manageable.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t">
                <p className="font-semibold">– Sarah Thompson, Founder & Lead Trainer</p>
                <p className="text-sm text-muted-foreground">Former 5th Grade Teacher, Google Certified Trainer</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Mission</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {mission.map((item, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">{stat.number}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Credentials & Partnerships</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Google Certified Educator Level 2</Badge>
                    <Badge variant="secondary">Microsoft Innovative Educator</Badge>
                    <Badge variant="secondary">Apple Teacher</Badge>
                    <Badge variant="secondary">ISTE Certified Educator</Badge>
                    <Badge variant="secondary">Common Sense Digital Citizenship</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Featured In</h3>
                  <div className="flex flex-wrap gap-4 opacity-60">
                    <div className="w-32 h-12 bg-muted rounded flex items-center justify-center text-xs">
                      EdTech Magazine
                    </div>
                    <div className="w-32 h-12 bg-muted rounded flex items-center justify-center text-xs">
                      Teaching Channel
                    </div>
                    <div className="w-32 h-12 bg-muted rounded flex items-center justify-center text-xs">
                      ASCD
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">School Partnerships</h3>
                  <p className="text-muted-foreground mb-4">
                    We're proud to work with schools nationwide to pilot new approaches and gather real-world feedback. 
                    Our partner schools help us ensure every strategy is classroom-tested and teacher-approved.
                  </p>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Partner With Us
                  </Button>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <Card className="mt-8 p-8 text-center bg-gradient-to-r from-primary/10 to-secondary/10">
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Teaching?</h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of teachers who've discovered that technology doesn't have to be overwhelming.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/services">
                  <Button size="lg">Book a Consultation</Button>
                </Link>
                <Link to="/tools">
                  <Button size="lg" variant="outline">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Browse Free Resources
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;