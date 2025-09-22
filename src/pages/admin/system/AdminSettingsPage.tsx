import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithAdminAuth } from "@/lib/admin-api";

interface TemplateEntry {
  type: string;
  subject: string;
  html: string;
  defaultSubject: string;
  defaultHtml: string;
  updatedAt: string | null;
  isCustom: boolean;
}

interface TemplatesResponse {
  templates: TemplateEntry[];
}

interface SiteSettingsResponse {
  settings: {
    allowUploads: boolean;
    maintenanceBanner: boolean;
  };
}

interface TemplateDraft {
  subject: string;
  html: string;
}

async function fetchTemplates(): Promise<TemplatesResponse> {
  const response = await fetchWithAdminAuth("/api/admin/system/settings/templates");

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to load templates");
  }

  return (await response.json()) as TemplatesResponse;
}

async function saveTemplate(payload: { type: string; subject: string; html: string }): Promise<void> {
  const response = await fetchWithAdminAuth("/api/admin/system/settings/templates", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to save template");
  }
}

async function resetTemplate(type: string): Promise<void> {
  const response = await fetchWithAdminAuth("/api/admin/system/settings/templates", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to reset template");
  }
}

async function fetchSiteSettings(): Promise<SiteSettingsResponse> {
  const response = await fetchWithAdminAuth("/api/admin/system/settings/site");

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to load site settings");
  }

  return (await response.json()) as SiteSettingsResponse;
}

async function updateSiteSettings(settings: SiteSettingsResponse["settings"]): Promise<void> {
  const response = await fetchWithAdminAuth("/api/admin/system/settings/site", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to update settings");
  }
}

export default function AdminSettingsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const templatesQuery = useQuery({
    queryKey: ["admin-notification-templates"],
    queryFn: fetchTemplates,
  });

  const siteSettingsQuery = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: fetchSiteSettings,
  });

  const [templateDrafts, setTemplateDrafts] = useState<Record<string, TemplateDraft>>({});
  const [siteSettingsDraft, setSiteSettingsDraft] = useState<SiteSettingsResponse["settings"]>({
    allowUploads: true,
    maintenanceBanner: false,
  });

  useEffect(() => {
    if (templatesQuery.data?.templates) {
      const draft: Record<string, TemplateDraft> = {};
      for (const template of templatesQuery.data.templates) {
        draft[template.type] = { subject: template.subject, html: template.html };
      }
      setTemplateDrafts(draft);
    }
  }, [templatesQuery.data?.templates]);

  useEffect(() => {
    if (siteSettingsQuery.data?.settings) {
      setSiteSettingsDraft(siteSettingsQuery.data.settings);
    }
  }, [siteSettingsQuery.data?.settings]);

  const saveTemplateMutation = useMutation({
    mutationFn: saveTemplate,
    onSuccess: async () => {
      toast({ title: "Template saved", description: "Notification template updated." });
      await queryClient.invalidateQueries({ queryKey: ["admin-notification-templates"] });
    },
    onError: error => {
      toast({
        title: "Unable to save template",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const resetTemplateMutation = useMutation({
    mutationFn: resetTemplate,
    onSuccess: async () => {
      toast({ title: "Template reset", description: "Reverted to default template content." });
      await queryClient.invalidateQueries({ queryKey: ["admin-notification-templates"] });
    },
    onError: error => {
      toast({
        title: "Unable to reset",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: async () => {
      toast({ title: "Settings saved", description: "Site settings updated." });
      await queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
    },
    onError: error => {
      toast({
        title: "Unable to save settings",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const templates = useMemo(() => templatesQuery.data?.templates ?? [], [templatesQuery.data?.templates]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site toggles</CardTitle>
          <CardDescription>Control feature flags and maintenance notices across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {siteSettingsQuery.isError ? (
            <p className="text-sm text-destructive">
              {siteSettingsQuery.error instanceof Error
                ? siteSettingsQuery.error.message
                : "Unable to load current site settings"}
            </p>
          ) : null}
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <h4 className="font-medium">Allow uploads</h4>
              <p className="text-sm text-muted-foreground">
                When disabled, educators will be prevented from uploading new files.
              </p>
            </div>
            <Switch
              checked={siteSettingsDraft.allowUploads}
              onCheckedChange={checked =>
                setSiteSettingsDraft(current => ({ ...current, allowUploads: checked }))
              }
              disabled={siteSettingsQuery.isLoading || updateSettingsMutation.isLoading}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <h4 className="font-medium">Show maintenance banner</h4>
              <p className="text-sm text-muted-foreground">
                Display a site-wide banner to inform users about maintenance windows.
              </p>
            </div>
            <Switch
              checked={siteSettingsDraft.maintenanceBanner}
              onCheckedChange={checked =>
                setSiteSettingsDraft(current => ({ ...current, maintenanceBanner: checked }))
              }
              disabled={siteSettingsQuery.isLoading || updateSettingsMutation.isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => siteSettingsQuery.refetch()}
              disabled={siteSettingsQuery.isFetching}
            >
              Reset
            </Button>
            <Button
              onClick={() => updateSettingsMutation.mutate(siteSettingsDraft)}
              disabled={updateSettingsMutation.isLoading}
            >
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email templates</CardTitle>
          <CardDescription>Customise approval emails and fall back to defaults when needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {templatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading templates…</p>
          ) : templatesQuery.isError ? (
            <p className="text-sm text-destructive">
              {templatesQuery.error instanceof Error
                ? templatesQuery.error.message
                : "Unable to load templates"}
            </p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates available.</p>
          ) : (
            templates.map(template => {
              const draft = templateDrafts[template.type] ?? {
                subject: template.subject,
                html: template.html,
              };

              return (
                <div key={template.type} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{humaniseType(template.type)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last updated {template.updatedAt ? new Date(template.updatedAt).toLocaleString() : "never"}.
                      </p>
                    </div>
                    {template.isCustom ? (
                      <Badge variant="secondary">Custom</Badge>
                    ) : (
                      <Badge variant="outline">Default</Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${template.type}-subject`}>Email subject</Label>
                      <Input
                        id={`${template.type}-subject`}
                        value={draft.subject}
                        onChange={event =>
                          setTemplateDrafts(current => ({
                            ...current,
                            [template.type]: { ...draft, subject: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${template.type}-html`}>Email body (HTML)</Label>
                      <Textarea
                        id={`${template.type}-html`}
                        value={draft.html}
                        onChange={event =>
                          setTemplateDrafts(current => ({
                            ...current,
                            [template.type]: { ...draft, html: event.target.value },
                          }))
                        }
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available variables include <code>{"{{userName}}"}</code>, <code>{"{{payload.resourceId}}"}</code>,
                        <code>{"{{dashboardUrl}}"}</code>, and other contextual values.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTemplateDrafts(current => ({
                          ...current,
                          [template.type]: {
                            subject: template.defaultSubject,
                            html: template.defaultHtml,
                          },
                        }));
                        resetTemplateMutation.mutate(template.type);
                      }}
                      disabled={resetTemplateMutation.isLoading}
                    >
                      Reset to default
                    </Button>
                    <Button
                      onClick={() =>
                        saveTemplateMutation.mutate({
                          type: template.type,
                          subject: draft.subject,
                          html: draft.html,
                        })
                      }
                      disabled={saveTemplateMutation.isLoading}
                    >
                      Save template
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function humaniseType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}
