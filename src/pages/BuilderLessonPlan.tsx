import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { createLessonBuilderDraft } from "@/lib/builder-api";

const BuilderLessonPlan = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const mutation = useMutation({
    mutationFn: createLessonBuilderDraft,
    onSuccess: (plan) => {
      const path = getLocalizedPath(`/lesson-builder?id=${encodeURIComponent(plan.id)}`, language);
      navigate(path, { replace: true });
    },
  });

  useEffect(() => {
    if (!mutation.isPending && !mutation.isSuccess) {
      mutation.mutate({});
    }
  }, [mutation]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="space-y-4 p-6 text-center">
          {mutation.isError ? (
            <>
              <div className="flex justify-center">
                <RefreshCw className="h-10 w-10 text-destructive" />
              </div>
              <p className="text-base font-medium text-foreground">{t.lessonBuilder.states.error}</p>
              <p className="text-sm text-muted-foreground">
                {t.lessonBuilder.states.errorDescription}
              </p>
              <Button onClick={() => mutation.mutate({})} variant="default">
                {t.lessonBuilder.states.retry}
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <p className="text-base font-medium text-foreground">
                {t.lessonBuilder.states.creating}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.lessonBuilder.states.creatingDescription}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuilderLessonPlan;
