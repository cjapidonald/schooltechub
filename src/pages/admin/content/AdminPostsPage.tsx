import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type AdminPostStatus = "draft" | "pending" | "approved" | "published";

const POST_STATUS: Array<AdminPostStatus> = ["draft", "pending", "approved", "published"];
const POST_PAGES = [
  { value: "research_blog", label: "Research blog" },
  { value: "edutech", label: "Edutech" },
  { value: "teacher_diary", label: "Teacher diary" },
] as const;

const STATUS_LABELS: Record<AdminPostStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  published: "Published",
};

type ContentBlock = {
  type: string;
  data?: { text?: string };
};

type ContentDocument = {
  time?: number;
  version?: string;
  blocks?: ContentBlock[];
};

interface AdminPostRecord {
  id: string;
  title: string;
  slug: string;
  language: string | null;
  page: string;
  status: AdminPostStatus;
  updated_at: string | null;
  created_at: string | null;
  published_at: string | null;
  is_published: boolean | null;
  deleted_at: string | null;
  subtitle: string | null;
  excerpt: string | null;
  author: Record<string, unknown> | null;
  content: unknown;
  tags: string[] | null;
}

interface AdminPost extends Omit<AdminPostRecord, "author" | "content"> {
  authorName: string | null;
  contentBody: string;
}

interface PostFormValues {
  title: string;
  slug: string;
  language: string;
  page: string;
  status: AdminPostStatus;
  authorName: string;
  subtitle: string;
  excerpt: string;
  body: string;
  tags: string;
}

function extractAuthorName(author: Record<string, unknown> | null): string | null {
  if (!author || typeof author !== "object") {
    return null;
  }

  const value = "name" in author ? author.name : undefined;
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  const altValue = "full_name" in author ? author.full_name : undefined;
  if (typeof altValue === "string" && altValue.trim()) {
    return altValue.trim();
  }

  return null;
}

function extractBodyFromContent(content: unknown): string {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as ContentDocument;
      return extractBodyFromContent(parsed);
    } catch {
      return content;
    }
  }

  if (typeof content === "object" && content !== null) {
    const document = content as ContentDocument;
    if (Array.isArray(document.blocks)) {
      const parts = document.blocks
        .map(block => {
          if (!block || typeof block !== "object") {
            return null;
          }
          if (block.type !== "paragraph") {
            return null;
          }
          const text = block.data?.text;
          if (typeof text === "string" && text.trim()) {
            return text.replace(/<br\s*\/?\s*>/gi, "\n");
          }
          return null;
        })
        .filter((value): value is string => Boolean(value));
      if (parts.length > 0) {
        return parts.join("\n\n");
      }
    }

    return JSON.stringify(document, null, 2);
  }

  return "";
}

function buildContentPayload(body: string): ContentDocument | null {
  const trimmed = body.trim();
  if (!trimmed) {
    return null;
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return null;
  }

  return {
    time: Date.now(),
    version: "1.0",
    blocks: paragraphs.map(paragraph => ({
      type: "paragraph",
      data: {
        text: paragraph.replace(/\n/g, "<br>"),
      },
    })),
  };
}

function normaliseTags(tags: string): string[] {
  return tags
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean)
    .map(tag => tag.replace(/\s+/g, " "));
}

async function fetchAdminPosts(): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(record => ({
    id: record.id,
    title: record.title,
    slug: record.slug,
    language: null,
    page: record.category || "blog",
    status: "published" as AdminPostStatus,
    updated_at: record.updated_at,
    created_at: record.created_at,
    published_at: record.published_at,
    is_published: record.is_published,
    deleted_at: null,
    subtitle: null,
    excerpt: record.excerpt,
    tags: record.tags,
    authorName: extractAuthorName(record.author as any),
    contentBody: extractBodyFromContent(record.content),
  }));
}

async function savePost(values: PostFormValues, existing?: AdminPost): Promise<AdminPost> {
  const payload = {
    title: values.title.trim(),
    slug: values.slug.trim(),
    language: values.language.trim(),
    page: values.page,
    status: values.status,
    subtitle: values.subtitle.trim() || null,
    excerpt: values.excerpt.trim() || null,
    author: values.authorName.trim() ? { name: values.authorName.trim() } : null,
    tags: normaliseTags(values.tags),
    content: buildContentPayload(values.body),
    deleted_at: existing?.deleted_at ?? null,
    content_type: "blog",
  };

  const now = new Date().toISOString();
  const shouldPublish = values.status === "published";
  const publishPatch = shouldPublish
    ? { published_at: existing?.published_at ?? now }
    : { published_at: existing?.status === "published" ? existing.published_at : null };

  if (!existing) {
    const { data, error } = await supabase
      .from("blogs")
      .insert({
        title: payload.title,
        slug: payload.slug,
        category: payload.page,
        excerpt: payload.excerpt,
        author: payload.author,
        tags: payload.tags,
        content: payload.content,
        is_published: shouldPublish,
        ...publishPatch,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create post");
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      language: null,
      page: data.category || "blog",
      status: "published" as AdminPostStatus,
      updated_at: data.updated_at,
      created_at: data.created_at,
      published_at: data.published_at,
      is_published: data.is_published,
      deleted_at: null,
      subtitle: null,
      excerpt: data.excerpt,
      tags: data.tags,
      authorName: extractAuthorName(data.author as any),
      contentBody: extractBodyFromContent(data.content),
    };
  }

  const { data, error } = await supabase
    .from("blogs")
    .update({
      title: payload.title,
      slug: payload.slug,
      category: payload.page,
      excerpt: payload.excerpt,
      author: payload.author,
      tags: payload.tags,
      content: payload.content,
      is_published: shouldPublish,
      ...publishPatch,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update post");
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    language: null,
    page: data.category || "blog",
    status: "published" as AdminPostStatus,
    updated_at: data.updated_at,
    created_at: data.created_at,
    published_at: data.published_at,
    is_published: data.is_published,
    deleted_at: null,
    subtitle: null,
    excerpt: data.excerpt,
    tags: data.tags,
    authorName: extractAuthorName(data.author as any),
    contentBody: extractBodyFromContent(data.content),
  };
}

export function AdminPostsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: fetchAdminPosts,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [actionPostId, setActionPostId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ values, existing }: { values: PostFormValues; existing?: AdminPost }) =>
      savePost(values, existing),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      const existing = mutation.variables?.existing;
      toast({ title: existing ? "Post updated" : "Post created", variant: "default" });
      setDialogOpen(false);
      setEditingPost(null);
    },
    onError: mutationError => {
      const description =
        mutationError instanceof Error ? mutationError.message : "Something went wrong while saving the post.";
      toast({ title: "Unable to save post", description, variant: "destructive" });
    },
  });

  const defaultValues = useMemo<PostFormValues>(() => {
    if (!editingPost) {
      return {
        title: "",
        slug: "",
        language: "en",
        page: POST_PAGES[0]?.value ?? "research_blog",
        status: "draft",
        authorName: "",
        subtitle: "",
        excerpt: "",
        body: "",
        tags: "",
      };
    }

    return {
      title: editingPost.title ?? "",
      slug: editingPost.slug ?? "",
      language: editingPost.language ?? "en",
      page: editingPost.page ?? POST_PAGES[0]?.value ?? "research_blog",
      status: editingPost.status,
      authorName: editingPost.authorName ?? "",
      subtitle: editingPost.subtitle ?? "",
      excerpt: editingPost.excerpt ?? "",
      body: editingPost.contentBody ?? "",
      tags: (editingPost.tags ?? []).join(", "),
    };
  }, [editingPost]);

  const form = useForm<PostFormValues>({ defaultValues });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const resetForm = () => {
    form.reset(defaultValues);
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (post: AdminPost) => {
    setEditingPost(post);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPost(null);
      resetForm();
    }
  };

  const performUpdate = async (id: string, update: Record<string, unknown>, successMessage: string) => {
    setActionPostId(id);
    try {
      const { error: updateError } = await supabase.from("blogs").update(update).eq("id", id);
      if (updateError) {
        throw new Error(updateError.message);
      }
      toast({ title: successMessage });
      void queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    } catch (updateError) {
      const description = updateError instanceof Error ? updateError.message : "Unexpected error";
      toast({ title: "Update failed", description, variant: "destructive" });
    } finally {
      setActionPostId(null);
    }
  };

  const handlePublish = (post: AdminPost) =>
    performUpdate(post.id, { status: "published", deleted_at: null }, "Post published");

  const handleUnpublish = (post: AdminPost) =>
    performUpdate(post.id, { status: "draft" }, "Post moved back to draft");

  const handleSoftDelete = (post: AdminPost) =>
    performUpdate(post.id, { deleted_at: new Date().toISOString() }, "Post moved to recycle bin");

  const handleRestore = (post: AdminPost) =>
    performUpdate(post.id, { deleted_at: null }, "Post restored");

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ values, existing: editingPost ?? undefined });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and publish editorial content across research blog, Edutech, and diary sections.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <Button onClick={handleOpenCreate}>New post</Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit post" : "Create a new post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="post-title">Title</Label>
                  <Input id="post-title" {...form.register("title", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-slug">Slug</Label>
                  <Input id="post-slug" {...form.register("slug", { required: true })} placeholder="my-new-post" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="post-language">Language</Label>
                  <Input id="post-language" {...form.register("language", { required: true })} placeholder="en" />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={form.watch("page")}
                    onValueChange={value => {
                      form.setValue("page", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_PAGES.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={value => {
                      form.setValue("status", value as AdminPostStatus);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose status" />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_STATUS.map(status => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="post-author">Author name</Label>
                  <Input id="post-author" {...form.register("authorName")} placeholder="e.g. Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-tags">Tags</Label>
                  <Input
                    id="post-tags"
                    {...form.register("tags")}
                    placeholder="Comma separated e.g. AI, Math, Case Study"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-subtitle">Subtitle</Label>
                <Input id="post-subtitle" {...form.register("subtitle")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-excerpt">Excerpt</Label>
                <Textarea id="post-excerpt" rows={3} {...form.register("excerpt")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-body">Body</Label>
                <Textarea id="post-body" rows={10} {...form.register("body")} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving…" : editingPost ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Recent posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading posts…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Failed to load posts."}</p>
          ) : posts && posts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.id} className={post.deleted_at ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-xs text-muted-foreground">{post.authorName ?? "Unknown author"}</div>
                      {post.deleted_at ? (
                        <div className="text-xs text-muted-foreground">Deleted {format(new Date(post.deleted_at), "dd MMM yyyy")}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{POST_PAGES.find(option => option.value === post.page)?.label ?? post.page}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>{STATUS_LABELS[post.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {post.updated_at ? format(new Date(post.updated_at), "dd MMM yyyy") : post.created_at ? format(new Date(post.created_at), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(post)}>Edit</Button>
                      {post.status === "published" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionPostId === post.id}
                          onClick={() => handleUnpublish(post)}
                        >
                          {actionPostId === post.id ? "…" : "Unpublish"}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionPostId === post.id}
                          onClick={() => handlePublish(post)}
                        >
                          {actionPostId === post.id ? "…" : "Publish"}
                        </Button>
                      )}
                      {post.deleted_at ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionPostId === post.id}
                          onClick={() => handleRestore(post)}
                        >
                          {actionPostId === post.id ? "…" : "Restore"}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionPostId === post.id}
                          onClick={() => handleSoftDelete(post)}
                        >
                          {actionPostId === post.id ? "…" : "Delete"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No posts have been created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPostsPage;
