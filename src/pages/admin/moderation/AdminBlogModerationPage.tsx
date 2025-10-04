import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import type { AdminOutletContext } from "../AdminLayout";

interface PendingBlog extends Pick<Database["public"]["Tables"]["blogs"]["Row"], "id" | "title" | "created_at" | "author" | "excerpt" | "featured_image" | "slug"> {}

function extractAuthorName(author: PendingBlog["author"]): string {
  if (!author || typeof author !== "object") {
    return "Unknown";
  }
  const value = "name" in author ? author.name : undefined;
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  const fallback = "full_name" in author ? author.full_name : undefined;
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }
  return "Unknown";
}

async function fetchPendingBlogPosts(): Promise<PendingBlog[]> {
  const { data, error } = await supabase
    .from("blogs")
    .select("id,title,created_at,author,excerpt,featured_image,slug")
    .eq("is_published", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load pending blog posts");
  }

  return (data ?? []) as PendingBlog[];
}

async function approveBlogPost(id: string): Promise<void> {
  const { error } = await supabase
    .from("blogs")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Failed to approve blog post");
  }
}

async function rejectBlogPost(id: string): Promise<void> {
  const { error } = await supabase.from("blogs").delete().eq("id", id);

  if (error) {
    throw new Error(error.message || "Failed to reject blog post");
  }
}

export default function AdminBlogModerationPage() {
  const { meta } = useOutletContext<AdminOutletContext>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ["admin", "moderation", "blogposts"],
    queryFn: fetchPendingBlogPosts,
  });

  const approveMutation = useMutation({
    mutationFn: approveBlogPost,
    onSuccess: () => {
      toast({ title: "Post approved", description: "The blog post is now live." });
      queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "blogposts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "summary"] });
    },
    onError: error => {
      const message = error instanceof Error ? error.message : "Unable to approve the post.";
      toast({ title: "Approval failed", description: message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectBlogPost,
    onSuccess: () => {
      toast({ title: "Post rejected", description: "The submission has been removed." });
      queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "blogposts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "summary"] });
    },
    onError: error => {
      const message = error instanceof Error ? error.message : "Unable to reject the post.";
      toast({ title: "Rejection failed", description: message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
        {meta.description && <p className="text-muted-foreground">{meta.description}</p>}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Pending submissions</CardTitle>
          <CardDescription>Review educator drafts before they appear on the public blog.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading submissions…</p>
          ) : pendingQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load submissions</AlertTitle>
              <AlertDescription>
                {pendingQuery.error instanceof Error ? pendingQuery.error.message : "Please try again in a moment."}
              </AlertDescription>
            </Alert>
          ) : pendingQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blog posts are waiting for review right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Excerpt</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingQuery.data.map(post => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium leading-tight">{post.title}</p>
                          {post.slug && (
                            <p className="text-xs text-muted-foreground">Slug: {post.slug}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{extractAuthorName(post.author)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground">
                        {post.excerpt ?? "—"}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {post.created_at ? format(new Date(post.created_at), "dd MMM yyyy") : "—"}
                        </p>
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate(post.id)}
                          disabled={rejectMutation.isLoading || approveMutation.isLoading}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(post.id)}
                          disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        >
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
