import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Sitemap = () => {
  // Fetch blog posts for sitemap
  const { data: blogPosts } = useQuery({
    queryKey: ["sitemap-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_master")
        .select("slug, title, updated_at")
        .eq("page", "research_blog")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const sitemapSections = [
    {
      title: "Main Pages",
      links: [
        { title: "Home", url: "/" },
        { title: "About", url: "/about" },
        { title: "Contact", url: "/contact" },
        { title: "FAQ", url: "/faq" },
      ]
    },
    {
      title: "Tools Hub",
      links: [
        { title: "Tools Directory", url: "/tools" },
        { title: "Templates", url: "/tools/templates" },
      ]
    },
    {
      title: "Learn Hub",
      links: [
        { title: "Learn Overview", url: "/learn" },
        { title: "Tutorials", url: "/learn/tutorials" },
        { title: "Teaching Techniques", url: "/learn/teaching-techniques" },
        { title: "Activities", url: "/learn/activities" },
        { title: "Lesson Plans", url: "/learn/lesson-plans" },
        { title: "Teacher Tips", url: "/learn/teacher-tips" },
      ]
    },
    {
      title: "Blog Hub",
      links: [
        { title: "Blog Posts", url: "/blog" },
        { title: "Case Studies", url: "/blog/case-studies" },
        { title: "Research", url: "/blog/research" },
        { title: "Research Questions", url: "/blog/research-questions" },
      ]
    },
    {
      title: "Events Hub",
      links: [
        { title: "All Events", url: "/events" },
        { title: "Workshops", url: "/events/workshops" },
        { title: "Webinars", url: "/events/webinars" },
        { title: "Meetups", url: "/events/meetups" },
      ]
    },
    {
      title: "Services",
      links: [
        { title: "All Services", url: "/services" },
        { title: "AI Tools Training", url: "/services/ai-tools-training" },
        { title: "Dashboard Setup", url: "/services/dashboard-setup" },
        { title: "Custom Workshops", url: "/services/custom-workshops" },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Sitemap - School Tech Hub"
        description="Navigate through all pages and resources available on School Tech Hub"
        keywords="sitemap, navigation, school tech hub pages"
      />
      <Navigation />
      
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-2">Sitemap</h1>
          <p className="text-muted-foreground mb-8">
            Find all pages and resources available on School Tech Hub
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sitemapSections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.url}>
                        <Link 
                          to={link.url}
                          className="text-primary hover:underline"
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>XML Sitemap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For search engines and automated tools, access our XML sitemap:
              </p>
              <a 
                href="/sitemap.xml" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://schooltechub.com/sitemap.xml
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sitemap;