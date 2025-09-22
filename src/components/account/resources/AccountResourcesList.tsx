import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ResourceCard } from "../../../../types/resources";
import { deleteResource, searchResources } from "@/lib/resources-api";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AccountResourcesListProps {
  userId: string;
  onEdit?: (resource: ResourceCard) => void;
}

export function AccountResourcesList({ userId, onEdit }: AccountResourcesListProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["account-resources", userId, page],
    queryFn: async () => {
      return await searchResources({ creatorId: userId, page, limit: 10 });
    },
    enabled: Boolean(userId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteResource(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-resources", userId] });
      toast({ title: t.account.resources.toast.deleted });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.account.resources.toast.deleteError, variant: "destructive" });
    },
  });

  const resources = query.data?.items ?? [];
  const isLoading = query.isLoading;

  const handleEdit = (resource: ResourceCard) => {
    if (onEdit) {
      onEdit(resource);
    } else {
      window.location.href = getLocalizedPath(`/account/resources/${resource.id}`, language);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{t.account.resources.listTitle}</CardTitle>
          <CardDescription>{t.account.resources.listDescription}</CardDescription>
        </div>
        <Button asChild>
          <Link to={getLocalizedPath("/account/resources/new", language)}>{t.account.resources.newCta}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : resources.length === 0 ? (
          <div className="space-y-4 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <p>{t.account.resources.empty}</p>
            <Button asChild variant="secondary">
              <Link to={getLocalizedPath("/account/resources/new", language)}>{t.account.resources.emptyCta}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map(resource => (
              <div key={resource.id} className="rounded-lg border p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{resource.title}</h3>
                      {resource.resourceType ? <Badge variant="secondary">{resource.resourceType}</Badge> : null}
                      {resource.format ? <Badge variant="outline">{resource.format}</Badge> : null}
                    </div>
                    {resource.description ? (
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {resource.subject ? <Badge variant="outline">{resource.subject}</Badge> : null}
                      {resource.gradeLevel ? <Badge variant="outline">{resource.gradeLevel}</Badge> : null}
                      {resource.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    {resource.instructionalNotes ? (
                      <p className="text-xs text-muted-foreground">
                        {t.account.resources.instructionalNotesLabel}: {resource.instructionalNotes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-start gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={resource.url} target="_blank" rel="noreferrer">
                        {t.account.resources.viewLink}
                      </a>
                    </Button>
                    <Button size="sm" onClick={() => handleEdit(resource)}>
                      {t.common.edit}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.account.resources.deleteConfirmTitle}</AlertDialogTitle>
                          <AlertDialogDescription>{t.account.resources.deleteConfirmBody}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(resource.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t.common.delete}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
            {query.data && query.data.total > resources.length && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                >
                  {t.common.previous}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t.account.resources.pagination
                    .replace("{current}", String(page))
                    .replace(
                      "{total}",
                      Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.pageSize ?? 1))).toString(),
                    )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!query.data?.hasMore}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  {t.common.next}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
