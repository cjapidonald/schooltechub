import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Users, BookOpen, Target, Heart, Lightbulb } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const About = () => {
  const { language } = useLanguage();
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
    { number: "7+", label: "Years Experience" },
    { number: "100+", label: "Schools Helped" },
    { number: "1,000+", label: "Teachers Supported" },
    { number: "50+", label: "Tools Tested" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="About Us"
        description="Learn about SchoolTech Hub's mission to make educational technology accessible. 7+ years experience, 100+ schools helped, certified educators supporting your tech journey."
        keywords="about SchoolTech Hub, educational technology company, EdTech consultants, teacher training experts, classroom technology specialists"
        canonicalUrl="https://schooltechhub.com/about"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About SchoolTech Hub</h1>
            <p className="text-xl text-muted-foreground">
              Making educational technology accessible and practical for every teacher
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
                <p>SchoolTech Hub was founded by educators who saw the gap between amazing technology and overwhelmed teachers. We bridge that gap with practical, proven solutions.</p>
              </div>
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-bold mb-4">CEO Message</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <img 
                    src="/lovable-uploads/96483919-4154-4163-b949-8ebebd6fb820.png" 
                    alt="Donald Cjapi - CEO message" 
                    className="w-48 h-48 rounded-lg object-cover shadow-lg md:w-64 md:h-64"
                  />
                  <div className="flex-1">
                    <p className="text-muted-foreground leading-relaxed">Technology should empower teachers, not overwhelm them. Our mission is to make every educator confident with the tools that can transform their classrooms.</p>
                    <p className="font-semibold mt-4">- Donald Cjapi, CEO & Founder</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted-foreground">To democratize educational technology by providing accessible, affordable, and actionable support to educators worldwide.</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
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
                <Link to={getLocalizedPath("/services", language)}>
                  <Button size="lg">Book a Consultation</Button>
                </Link>
                <Link to={getLocalizedPath("/tools", language)}>
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

      {/* Certifications Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Certifications & Expertise</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Card className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-sm">ClassDojo Mentorship</h3>
            </Card>
            <Card className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-sm">Wordwall Certified</h3>
            </Card>
            <Card className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-sm">Canvas Certification</h3>
            </Card>
            <Card className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-sm">Microsoft Educator</h3>
            </Card>
            <Card className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-sm">AI Education</h3>
            </Card>
            <Card className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-sm">Leadership Management</h3>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Teachers Say</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-muted-foreground mb-4 italic">
                "The AI tools training transformed how I create lesson plans. I'm saving hours every week!"
              </p>
              <p className="font-semibold">Sarah M.</p>
              <p className="text-sm text-muted-foreground">5th Grade Teacher</p>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4 italic">
                "Finally, someone who understands classroom reality and doesn't just push the latest tech trends."
              </p>
              <p className="font-semibold">Mike T.</p>
              <p className="text-sm text-muted-foreground">High School Science</p>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4 italic">
                "The dashboard setup service revolutionized our school's data management. Highly recommend!"
              </p>
              <p className="font-semibold">Principal Johnson</p>
              <p className="text-sm text-muted-foreground">Elementary School</p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30" id="faq">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">How do you stay current with EdTech?</h3>
              <p className="text-muted-foreground">
                We continuously test new tools, attend conferences, and collaborate with teachers worldwide to ensure our recommendations are cutting-edge yet practical.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do you work with schools outside Vietnam?</h3>
              <p className="text-muted-foreground">
                Yes! While based in Vietnam, we offer online consulting and training services globally, with experience across multiple education systems.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What makes your approach different?</h3>
              <p className="text-muted-foreground">
                We focus on practical, immediately implementable solutions that work within real classroom constraints, not theoretical best practices.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;