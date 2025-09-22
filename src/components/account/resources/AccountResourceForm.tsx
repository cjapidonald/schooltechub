import { useEffect, useMemo, useState, type ReactNode, type KeyboardEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ResourceCard } from "../../../../types/resources";
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
  subject: string;
  gradeLevel: string;
  format: string;
  tags: string[];
  instructionalNotes: string;
}

const RESOURCE_TYPE_SUGGESTIONS = ["Worksheet", "Video", "Game", "Image", "Presentation", "Article", "Interactive"];
const SUBJECT_SUGGESTIONS = ["Math", "Science", "English", "ICT", "STEM", "Arts"];
const GRADE_LEVEL_SUGGESTIONS = ["K-2", "3-5", "6-8", "9-12"];
const FORMAT_SUGGESTIONS = ["PDF", "Slides", "Website", "Printable", "Interactive"];
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
    subject: resource?.subject ?? "",
    gradeLevel: resource?.gradeLevel ?? "",
    format: resource?.format ?? "",
    tags: resource?.tags ?? [],
    instructionalNotes: resource?.instructionalNotes ?? "",
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
        subject: values.subject || null,
        gradeLevel: values.gradeLevel || null,
        format: values.format || null,
        tags: values.tags,
        instructionalNotes: values.instructionalNotes || null,
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
    onSuccess: result => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["account-resources", userId] });
      toast({
        title: isEdit ? t.account.resources.toast.updated : t.account.resources.toast.created,
        variant: "default",
      });
      onSuccess?.(result);
    },
    onError: error => {
      const message = error instanceof ResourceApiError ? error.message : t.common.error;
      setFormError(message);
      toast({ title: t.common.error, description: message, variant: "destructive" });
    },
  });

  const handleSubmit = form.handleSubmit(values => {
    mutation.mutate(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{isEdit ? t.account.resources.form.editTitle : t.account.resources.form.title}</CardTitle>
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

          <div className="grid gap-4 md:grid-cols-2">
            <SuggestionInput
              label={t.account.resources.form.typeLabel}
              placeholder={t.account.resources.form.typePlaceholder}
              suggestions={RESOURCE_TYPE_SUGGESTIONS}
              value={form.watch("resourceType")}
              onSelect={value => form.setValue("resourceType", value)}
            >
              <Input {...form.register("resourceType")} placeholder={t.account.resources.form.typePlaceholder} />
            </SuggestionInput>
            <SuggestionInput
              label={t.account.resources.form.subjectsLabel}
              placeholder={t.account.resources.form.subjectsPlaceholder}
              suggestions={SUBJECT_SUGGESTIONS}
              value={form.watch("subject")}
              onSelect={value => form.setValue("subject", value)}
            >
              <Input {...form.register("subject")} placeholder={t.account.resources.form.subjectsPlaceholder} />
            </SuggestionInput>
            <SuggestionInput
              label={t.account.resources.form.gradeLabel}
              placeholder={t.account.resources.form.gradePlaceholder}
              suggestions={GRADE_LEVEL_SUGGESTIONS}
              value={form.watch("gradeLevel")}
              onSelect={value => form.setValue("gradeLevel", value)}
            >
              <Input {...form.register("gradeLevel")} placeholder={t.account.resources.form.gradePlaceholder} />
            </SuggestionInput>
            <SuggestionInput
              label={t.account.resources.form.formatLabel}
              placeholder={t.account.resources.form.formatPlaceholder}
              suggestions={FORMAT_SUGGESTIONS}
              value={form.watch("format")}
              onSelect={value => form.setValue("format", value)}
            >
              <Input {...form.register("format")} placeholder={t.account.resources.form.formatPlaceholder} />
            </SuggestionInput>
          </div>

          <TokenField
            label={t.account.resources.form.tagsLabel}
            placeholder={t.account.resources.form.tagsPlaceholder}
            value={form.watch("tags")}
            onChange={value => form.setValue("tags", value)}
            suggestions={TAG_SUGGESTIONS}
          />

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
        {value.map(item => (
          <Badge key={item} variant="secondary" className="flex items-center gap-1">
            {item}
            <button
              type="button"
              className="text-xs"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(value.filter(token => token !== item))}
            >
              ×
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={event => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => handleAdd(inputValue)}
          placeholder={placeholder}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {suggestions.map(suggestion => (
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

interface SuggestionInputProps {
  label: string;
  placeholder: string;
  suggestions: string[];
  value: string;
  onSelect: (value: string) => void;
  children: ReactNode;
}

function SuggestionInput({ label, placeholder, suggestions, value, onSelect, children }: SuggestionInputProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {suggestions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-full border border-dashed border-input px-3 py-1 hover:border-primary hover:text-primary ${
                option === value ? "border-primary text-primary" : ""
              }`}
            >
              {option}
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
