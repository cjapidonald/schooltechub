import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { BLOG_IMAGE_BUCKET, submitBlogDraft, uploadBlogImage, type BlogLinkInput } from "@/lib/blogs";

interface BlogBuilderFormValues {
  title: string;
  authorName: string;
  excerpt: string;
  body: string;
  links: BlogLinkInput[];
}

const MAX_LINKS = 5;

export default function BlogBuilderPage() {
  const { user, loading } = useRequireAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ title: string; slug: string } | null>(null);

  const defaultName = useMemo(() => {
    const fullName = typeof user?.user_metadata?.full_name === "string" ? user?.user_metadata?.full_name : "";
    const firstName = typeof user?.user_metadata?.first_name === "string" ? user?.user_metadata?.first_name : "";
    const lastName = typeof user?.user_metadata?.last_name === "string" ? user?.user_metadata?.last_name : "";
    if (fullName?.trim()) {
      return fullName.trim();
    }
    const composed = `${firstName} ${lastName}`.trim();
    if (composed) {
      return composed;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "";
  }, [user?.user_metadata, user?.email]);

  const form = useForm<BlogBuilderFormValues>({
    defaultValues: {
      title: "",
      authorName: defaultName,
      excerpt: "",
      body: "",
      links: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });

  useEffect(() => {
    if (defaultName && !form.getValues("authorName")) {
      form.setValue("authorName", defaultName);
    }
  }, [defaultName, form]);

  useEffect(() => {
    return () => {
      if (featuredPreview) {
        URL.revokeObjectURL(featuredPreview);
      }
    };
  }, [featuredPreview]);

  const mutation = useMutation({
    mutationFn: async (values: BlogBuilderFormValues) => {
      if (!user) {
        throw new Error("You must be signed in to submit a blog post");
      }

      let featuredImageUrl: string | null = null;

      if (featuredFile) {
        try {
          const { publicUrl } = await uploadBlogImage(user.id, featuredFile);
          featuredImageUrl = publicUrl;
        } catch (error) {
          console.error("Failed to upload blog image", error);
          throw new Error(
            t.blogBuilder.toast.imageError ?? "We couldn't upload the featured image"
          );
        }
      }

      const result = await submitBlogDraft({
        userId: user.id,
        title: values.title,
        authorName: values.authorName,
        body: values.body,
        excerpt: values.excerpt,
        links: values.links,
        featuredImageUrl,
      });

      return result;
    },
    onSuccess: result => {
      setSubmitSuccess({ title: result.title, slug: result.slug });
      toast({
        title: t.blogBuilder.toast.successTitle,
        description: t.blogBuilder.toast.successDescription,
      });
      form.reset({
        title: "",
        authorName: defaultName,
        excerpt: "",
        body: "",
        links: [],
      });
      if (featuredPreview) {
        URL.revokeObjectURL(featuredPreview);
      }
      setFeaturedFile(null);
      setFeaturedPreview(null);
    },
    onError: error => {
      const message = error instanceof Error ? error.message : t.blogBuilder.toast.errorDescription;
      toast({
        title: t.blogBuilder.toast.errorTitle,
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (featuredPreview) {
      URL.revokeObjectURL(featuredPreview);
    }
    setFeaturedFile(file);
    setFeaturedPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (featuredPreview) {
      URL.revokeObjectURL(featuredPreview);
    }
    setFeaturedFile(null);
    setFeaturedPreview(null);
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="space-y-4">
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="h-6 w-72 animate-pulse rounded bg-muted" />
          <div className="h-[480px] animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={getLocalizedPath("/auth", language)} replace />;
  }

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate(values);
  });

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO
        title={t.blogBuilder.seo.title}
        description={t.blogBuilder.seo.description}
        canonicalUrl={t.blogBuilder.seo.canonical}
      />
      <div className="container space-y-6 py-10">
        <div className="space-y-2">
          <Badge variant="outline">Beta</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{t.blogBuilder.heading}</h1>
          <p className="max-w-2xl text-muted-foreground">{t.blogBuilder.subheading}</p>
        </div>

        {submitSuccess && (
          <Alert>
            <AlertTitle>{t.blogBuilder.success.title}</AlertTitle>
            <AlertDescription>
              {t.blogBuilder.success.description}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="default" onClick={() => navigate(getLocalizedPath("/account", language))}>
                  {t.blogBuilder.success.accountCta}
                </Button>
                <Button variant="outline" onClick={() => setSubmitSuccess(null)}>
                  {t.blogBuilder.success.newCta}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.blogBuilder.sections.detailsTitle}</CardTitle>
              <CardDescription>{t.blogBuilder.sections.detailsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="blog-title">{t.blogBuilder.fields.title}</Label>
                  <Input
                    id="blog-title"
                    {...form.register("title", { required: true })}
                    placeholder={t.blogBuilder.fields.titlePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-author">{t.blogBuilder.fields.authorName}</Label>
                  <Input
                    id="blog-author"
                    {...form.register("authorName")}
                    placeholder={t.blogBuilder.fields.authorPlaceholder}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-excerpt">{t.blogBuilder.fields.excerpt}</Label>
                <Textarea
                  id="blog-excerpt"
                  {...form.register("excerpt")}
                  rows={3}
                  placeholder={t.blogBuilder.fields.excerptPlaceholder}
                />
                <p className="text-xs text-muted-foreground">{t.blogBuilder.fields.excerptHelper}</p>
              </div>

              <div className="space-y-2">
                <Label>{t.blogBuilder.fields.coverImage}</Label>
                {featuredPreview ? (
                  <div className="space-y-3">
                    <img
                      src={featuredPreview}
                      alt="Selected blog cover"
                      className="h-48 w-full rounded-md object-cover"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={removeImage}>
                        {t.blogBuilder.fields.removeImage}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input type="file" accept="image/*" onChange={handleImageChange} />
                )}
                <p className="text-xs text-muted-foreground">{t.blogBuilder.fields.imageHelper}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.blogBuilder.sections.contentTitle}</CardTitle>
              <CardDescription>{t.blogBuilder.sections.contentDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="blog-body">{t.blogBuilder.fields.body}</Label>
                <Textarea
                  id="blog-body"
                  {...form.register("body", { required: true })}
                  rows={12}
                  placeholder={t.blogBuilder.fields.bodyPlaceholder}
                />
                <p className="text-xs text-muted-foreground">{t.blogBuilder.fields.bodyHelper}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>{t.blogBuilder.links.title}</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => append({ label: "", url: "" })}
                    disabled={fields.length >= MAX_LINKS}
                  >
                    {t.blogBuilder.links.add}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t.blogBuilder.links.helper}</p>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_minmax(0,2fr)_auto] md:items-end">
                      <div className="space-y-2">
                        <Label htmlFor={`blog-link-label-${index}`} className="text-xs uppercase text-muted-foreground">
                          {t.blogBuilder.links.label}
                        </Label>
                        <Input
                          id={`blog-link-label-${index}`}
                          {...form.register(`links.${index}.label` as const)}
                          placeholder={t.blogBuilder.links.labelPlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`blog-link-url-${index}`} className="text-xs uppercase text-muted-foreground">
                          {t.blogBuilder.links.url}
                        </Label>
                        <Input
                          id={`blog-link-url-${index}`}
                          type="url"
                          {...form.register(`links.${index}.url` as const)}
                          placeholder={t.blogBuilder.links.urlPlaceholder}
                        />
                      </div>
                      <Button type="button" variant="ghost" onClick={() => remove(index)}>
                        {t.blogBuilder.links.remove}
                      </Button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t.blogBuilder.links.empty}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? t.blogBuilder.actions.submitting : t.blogBuilder.actions.submit}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t.blogBuilder.actions.helper.replace("{bucket}", BLOG_IMAGE_BUCKET)}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
