import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import RichContent from "@/components/RichContent";
import { ArrowLeft, Calendar, PenLine, HelpCircle, Lightbulb, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import type { Database } from "@/integrations/supabase/types";

type DiaryEntry = Database["public"]["Tables"]["content_master"]["Row"];

const diaryTypeIcons = {
  question: <HelpCircle className="h-4 w-4" />,
  challenge: <MessageSquare className="h-4 w-4" />,
  reflection: <Lightbulb className="h-4 w-4" />,
};

const diaryTypeLabels: Record<string, string> = {
  question: "Question",
  challenge: "Challenge",
  reflection: "Reflection",
};

const moodClasses: Record<string, string> = {
  optimistic: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-800",
  frustrated: "bg-red-100 text-red-800",
  excited: "bg-yellow-100 text-yellow-800",
  thoughtful: "bg-blue-100 text-blue-800",
};

const TeacherDiaryEntry = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const {
    data: entry,
    isLoading,
    error,
  } = useQuery<DiaryEntry | null>({
    queryKey: ["teacher-diary-entry", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_master")
        .select("*")
        .eq("slug", slug)
        .eq("page", "teacher_diary")
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data as DiaryEntry | null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-48 w-full bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardHeader className="space-y-4">
            <CardTitle className="text-2xl">Diary Entry Not Found</CardTitle>
            <p className="text-muted-foreground">
              The diary entry you're looking for couldn't be found.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(getLocalizedPath("/teacher-diary", language))}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teacher Diary
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={entry.meta_title || entry.title}
        description={entry.meta_description || entry.excerpt}
        image={entry.featured_image || undefined}
        keywords={entry.keywords?.join(", ")}
      />

      <article className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(getLocalizedPath("/teacher-diary", language))}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teacher Diary
          </Button>

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {entry.diary_type && (
                <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                  {diaryTypeIcons[entry.diary_type as keyof typeof diaryTypeIcons]}
                  {diaryTypeLabels[entry.diary_type] || entry.diary_type}
                </Badge>
              )}
              {entry.mood && (
                <Badge className={moodClasses[entry.mood] || "bg-gray-100 text-gray-800"}>
                  {entry.mood}
                </Badge>
              )}
              {entry.category && <Badge variant="outline">{entry.category}</Badge>}
              {entry.subcategory && <Badge variant="outline">{entry.subcategory}</Badge>}
            </div>

            <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
              <PenLine className="h-8 w-8 text-primary" />
              {entry.title}
            </h1>

            {entry.subtitle && (
              <p className="text-lg text-muted-foreground mb-4">{entry.subtitle}</p>
            )}

            {entry.published_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(entry.published_at), "MMM d, yyyy")}</span>
              </div>
            )}
          </header>

          {entry.featured_image && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <img
                src={entry.featured_image}
                alt={entry.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <RichContent content={entry.content} />

          {(entry.stage || entry.subject || (entry.tags && entry.tags.length > 0)) && (
            <Card className="mt-10">
              <CardHeader>
                <CardTitle>Classroom Context</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {entry.stage && <Badge variant="outline">{entry.stage}</Badge>}
                {entry.subject && <Badge variant="outline">{entry.subject}</Badge>}
                {entry.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </article>
    </>
  );
};

export default TeacherDiaryEntry;
