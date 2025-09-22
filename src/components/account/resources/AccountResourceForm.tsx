import { useEffect, useMemo, useState, type ReactNode, type KeyboardEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ResourceCard, ResourceStatus, ResourceVisibility } from "../../../../types/resources";
import {
  ResourceApiError,
  createResource,
  updateResource,
  type ResourceCreateRequest,
  type ResourceUpdateRequest,
} from "@/lib/resources-api";

interface AccountResourceFormProps {
  userId: string;
  resource?: ResourceCard | null;
  onSuccess?: (resource: ResourceCard) => void;
}

interface FormValues {
  title: string;
  url: string;
  description: string;
  resourceType: string;
  subjects: string[];
  topics: string[];
  tags: string[];
  status: ResourceStatus;
  visibility: ResourceVisibility;
  instructionalNotes: string;
  thumbnailUrl: string;
}

const STATUS_OPTIONS: ResourceStatus[] = ["draft", "published", "archived"];
const VISIBILITY_OPTIONS: ResourceVisibility[] = ["private", "unlisted", "public"];
const SUBJECT_SUGGESTIONS = ["Math", "Science", "English", "ICT", "STEAM"];
const TOPIC_SUGGESTIONS = ["STEM", "Assessment", "Differentiation", "Project-Based Learning"];
const TAG_SUGGESTIONS = ["ai", "worksheet", "video", "interactive", "free"];

export function AccountResourceForm({ userId, resource, onSuccess }: AccountResourceFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<FormValues>(() => ({
    title: resource?.title ?? "",
    url: resource?.url ?? "",
    description: resource?.description ?? "",
    resourceType: resource?.resourceType ?? "",
    subjects: resource?.subjects ?? [],
    topics: resource?.topics ?? [],
    tags: resource?.tags ?? [],
    status: resource?.status ?? "draft",
    visibility: resource?.visibility ?? "private",
    instructionalNotes: resource?.instructionalNotes ?? "",
    thumbnailUrl: resource?.thumbnailUrl ?? "",
  }), [resource]);

  const form = useForm<FormValues>({
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const isEdit = Boolean(resource);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const basePayload = {
        userId,
        title: values.title,
        description: values.description || null,
        resourceType: values.resourceType || null,
        subjects: values.subjects,
        topics: values.topics,
        tags: values.tags,
        status: values.status,
        visibility: values.visibility,
        instructionalNotes: values.instructionalNotes || null,
        thumbnailUrl: values.thumbnailUrl || null,
      } satisfies Omit<ResourceCreateRequest, "url"> & ResourceUpdateRequest;

      if (isEdit && resource) {
        const updatePayload: ResourceUpdateRequest = {
          ...basePayload,
          url: values.url || resource.url,
        };
        return await updateResource(resource.id, updatePayload);
      }

      const createPayload: ResourceCreateRequest = {
        ...basePayload,
        url: values.url,
      };
      return await createResource(createPayload);
    },
    onSuccess: (result) => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["account-resources", userId] });
      toast({
        title: isEdit ? t.account.resources.toast.updated : t.account.resources.toast.created,
        variant: "default",
      });
      onSuccess?.(result);
    },
    onError: (error) => {
      const message = error instanceof ResourceApiError ? error.message : t.common.error;
      setFormError(message);
      toast({ title: t.common.error, description: message, variant: "destructive" });
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>
            {isEdit ? t.account.resources.form.editTitle : t.account.resources.form.title}
          </CardTitle>
          <CardDescription>
            {isEdit ? t.account.resources.form.editDescription : t.account.resources.form.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>{t.common.error}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t.account.resources.form.titleLabel}>
              <Input
                {...form.register("title", { required: true })}
                placeholder={t.account.resources.form.titlePlaceholder}
              />
            </FormField>
            <FormField label={t.account.resources.form.urlLabel}>
              <Input
                {...form.register("url", { required: !isEdit })}
                placeholder="https://"
                type="url"
              />
            </FormField>
          </div>

          <FormField label={t.account.resources.form.descriptionLabel}>
            <Textarea
              {...form.register("description")}
              rows={3}
              placeholder={t.account.resources.form.descriptionPlaceholder}
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField label={t.account.resources.form.typeLabel}>
              <Input {...form.register("resourceType")} placeholder={t.account.resources.form.typePlaceholder} />
            </FormField>
            <FormField label={t.account.resources.form.statusLabel}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.account.resources.form.statusPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t.account.resources.status[option] ?? option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label={t.account.resources.form.visibilityLabel}>
              <Controller
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.account.resources.form.visibilityPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t.account.resources.visibility[option] ?? option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <Controller
            control={form.control}
            name="subjects"
            render={({ field }) => (
              <TokenField
                label={t.account.resources.form.subjectsLabel}
                placeholder={t.account.resources.form.subjectsPlaceholder}
                value={field.value}
                onChange={field.onChange}
                suggestions={SUBJECT_SUGGESTIONS}
              />
            )}
          />

          <Controller
            control={form.control}
            name="topics"
            render={({ field }) => (
              <TokenField
                label={t.account.resources.form.topicsLabel}
                placeholder={t.account.resources.form.topicsPlaceholder}
                value={field.value}
                onChange={field.onChange}
                suggestions={TOPIC_SUGGESTIONS}
              />
            )}
          />

          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <TokenField
                label={t.account.resources.form.tagsLabel}
                placeholder={t.account.resources.form.tagsPlaceholder}
                value={field.value}
                onChange={field.onChange}
                suggestions={TAG_SUGGESTIONS}
              />
            )}
          />

          <FormField label={t.account.resources.form.thumbnailLabel}>
            <Input {...form.register("thumbnailUrl")} placeholder={t.account.resources.form.thumbnailPlaceholder} />
          </FormField>

          <FormField label={t.account.resources.form.notesLabel}>
            <Textarea
              {...form.register("instructionalNotes")}
              rows={4}
              placeholder={t.account.resources.form.notesPlaceholder}
            />
          </FormField>
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => form.reset(defaultValues)} disabled={mutation.isPending}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t.common.loading : isEdit ? t.common.save : t.account.resources.form.submit}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

interface TokenFieldProps {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
}

function TokenField({ label, placeholder, value, onChange, suggestions = [] }: TokenFieldProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (token: string) => {
    const trimmed = token.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAdd(inputValue);
    } else if (event.key === "Backspace" && inputValue.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 rounded-md border border-input p-2">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="flex items-center gap-1">
            {item}
            <button
              type="button"
              className="text-xs"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(value.filter((token) => token !== item))}
            >
              ×
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => handleAdd(inputValue)}
          placeholder={placeholder}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleAdd(suggestion)}
              className="rounded-full border border-dashed border-input px-3 py-1 hover:border-primary hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
