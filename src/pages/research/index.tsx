import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Microscope } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { supabase } from "@/integrations/supabase/client";
import type { ResearchProject } from "@/types/platform";

const statusVariant: Record<ResearchProject["status"], "default" | "secondary"> = {
  draft: "secondary",
  open: "default",
  closed: "secondary",
};

const statusLabel: Record<ResearchProject["status"], string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

export default function ResearchIndexPage() {
  const { language } = useLanguage();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("research_projects")
        .select("id, title, slug, summary, status, visibility, created_by, created_at")
        .eq("visibility", "list_public")
        .in("status", ["open", "closed"])
        .order("created_at", { ascending: false, nullsLast: true });

      if (cancelled) {
        return;
      }

      if (queryError) {
        setError("We couldn't load the current research projects. Please try again later.");
        setLoading(false);
        return;
      }

      const mapped: ResearchProject[] = Array.isArray(data)
        ? (data.map(record => ({
            id: String(record.id ?? ""),
            title: record.title ?? "Untitled project",
            slug: record.slug ?? null,
            summary: record.summary ?? null,
            status: (record.status as ResearchProject["status"] | undefined) ?? "draft",
            visibility: (record.visibility as ResearchProject["visibility"] | undefined) ?? "list_public",
            createdBy: record.created_by ?? null,
            createdAt: record.created_at ?? new Date().toISOString(),
          })) as ResearchProject[])
        : [];

      setProjects(mapped.filter(project => project.slug));
      setLoading(false);
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const canonical = `https://schooltechhub.com${getLocalizedPath("/research", language)}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Research projects"
        description="Explore SchoolTech Hub's active and archived research collaborations with educators."
        canonicalUrl={canonical}
      />
      <section className="relative py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" aria-hidden="true" />
        <div className="container relative z-10 space-y-10">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Microscope className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Research Collaborations</h1>
            <p className="text-muted-foreground">
              We partner with educators on evidence-based research exploring technology's impact in classrooms. Browse open and
              archived collaborations and request access to participate.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading research projects" />
            </div>
          ) : error ? (
            <Card className="mx-auto max-w-2xl border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Unable to load research projects</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          ) : projects.length === 0 ? (
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle>No public research projects</CardTitle>
                <CardDescription>
                  We update this space whenever new collaborations become available. Check back soon for upcoming opportunities.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map(project => (
                <Card key={project.id} className="flex h-full flex-col border-border/60 bg-card/60 shadow-lg shadow-primary/5">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-xl font-semibold text-foreground">{project.title}</CardTitle>
                      <Badge variant={statusVariant[project.status] ?? "secondary"}>{statusLabel[project.status]}</Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {project.summary ?? "A SchoolTech Hub research collaboration."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1" />
                  <CardFooter className="pt-0">
                    <Button asChild className="w-full">
                      <Link to={getLocalizedPath(`/research/${project.slug}`, language)}>View details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
