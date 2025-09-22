import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ResourceCard, ResourceStatus, ResourceVisibility } from "../../../../types/resources";
import { searchResources, updateResource } from "@/lib/resources-api";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

interface AccountResourcesListProps {
  userId: string;
  onEdit?: (resource: ResourceCard) => void;
}

const STATUS_OPTIONS: ResourceStatus[] = ["draft", "published", "archived"];
const VISIBILITY_OPTIONS: ResourceVisibility[] = ["private", "unlisted", "public"];

export function AccountResourcesList({ userId, onEdit }: AccountResourcesListProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["account-resources", userId, page],
    queryFn: async () => {
      return await searchResources({ ownerId: userId, page, limit: 10 });
    },
    enabled: Boolean(userId),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, visibility }: { id: string; status?: ResourceStatus; visibility?: ResourceVisibility }) => {
      return await updateResource(id, {
        userId,
        status,
        visibility,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-resources", userId] });
      toast({ title: t.account.resources.toast.updated });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.account.resources.toast.updateError, variant: "destructive" });
    },
  });

  const resources = query.data?.items ?? [];
  const isLoading = query.isLoading;

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
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-lg border p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">{resource.domain}</p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
                      {resource.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                      {resource.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <div className="flex gap-3">
                      <Select
                        value={resource.status}
                        onValueChange={(value: ResourceStatus) =>
                          updateMutation.mutate({ id: resource.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder={t.account.resources.statusLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {t.account.resources.status[option] ?? option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={resource.visibility}
                        onValueChange={(value: ResourceVisibility) =>
                          updateMutation.mutate({ id: resource.id, visibility: value })
                        }
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder={t.account.resources.visibilityLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          {VISIBILITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {t.account.resources.visibility[option] ?? option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={resource.url} target="_blank" rel="noreferrer">
                          {t.account.resources.viewLink}
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => (onEdit ? onEdit(resource) : navigateToEdit(resource.id, language))}
                      >
                        {t.common.edit}
                      </Button>
                    </div>
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
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  {t.common.previous}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t.account.resources.pagination.replace("{current}", String(page)).replace(
                    "{total}",
                    Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.pageSize ?? 1))).toString()
                  )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!query.data?.hasMore}
                  onClick={() => setPage((prev) => prev + 1)}
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

function navigateToEdit(id: string, language: string) {
  const path = getLocalizedPath(`/account/resources/${id}`, language);
  window.location.href = path;
}
