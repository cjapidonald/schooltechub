import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { ResearchParticipant, ResearchProject } from "@/types/platform";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchResearchProjects, PROJECT_QUERY_KEY } from "./queries";
import { fetchProfilesByIds } from "./profileHelpers";

const PARTICIPANTS_QUERY_KEY = ["admin", "research", "participants"] as const;

interface ParticipantRecord {
  id?: string;
  project_id?: string;
  projectId?: string;
  user_id?: string;
  userId?: string;
  joined_at?: string;
}

function mapParticipant(record: ParticipantRecord): ResearchParticipant {
  return {
    id: String(record.id ?? ""),
    projectId: record.project_id ?? record.projectId ?? "",
    userId: record.user_id ?? record.userId ?? "",
    joinedAt: record.joined_at ?? new Date().toISOString(),
  } satisfies ResearchParticipant;
}

async function fetchParticipants(projectId: string): Promise<ResearchParticipant[]> {
  const { data, error } = await supabase
    .from("research_participants")
    .select("id,project_id,user_id,joined_at")
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true, nullsLast: false });

  if (error) {
    throw new Error(error.message || "Failed to load participants");
  }

  return (data ?? []).map(mapParticipant);
}

async function removeParticipant(participant: ResearchParticipant): Promise<void> {
  const { error } = await supabase.from("research_participants").delete().eq("id", participant.id);

  if (error) {
    throw new Error(error.message || "Failed to remove participant");
  }
}

export default function AdminResearchParticipantsPage(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | "">("");
  const [confirming, setConfirming] = useState<ResearchParticipant | null>(null);

  const {
    data: projects = [],
    isLoading: loadingProjects,
  } = useQuery<ResearchProject[], Error>({
    queryKey: PROJECT_QUERY_KEY,
    queryFn: fetchResearchProjects,
  });

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const {
    data: participants = [],
    isLoading: loadingParticipants,
    error: participantsError,
  } = useQuery<ResearchParticipant[], Error>({
    queryKey: [...PARTICIPANTS_QUERY_KEY, selectedProjectId],
    queryFn: () => fetchParticipants(selectedProjectId),
    enabled: Boolean(selectedProjectId),
  });

  const profileQuery = useQuery({
    queryKey: [...PARTICIPANTS_QUERY_KEY, "profiles", selectedProjectId, participants.map(p => p.userId).join("-")],
    queryFn: () => fetchProfilesByIds(participants.map(p => p.userId)),
    enabled: Boolean(selectedProjectId) && participants.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: () => (confirming ? removeParticipant(confirming) : Promise.resolve()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...PARTICIPANTS_QUERY_KEY, selectedProjectId] });
      setConfirming(null);
      toast({ title: "Participant removed", description: "Access has been revoked." });
    },
    onError: err => {
      toast({
        title: "Unable to remove participant",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const participantRows = useMemo(() => {
    if (!selectedProjectId) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
            Select a project to view participants.
          </TableCell>
        </TableRow>
      );
    }

    if (loadingParticipants) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
            Loading participants…
          </TableCell>
        </TableRow>
      );
    }

    if (participantsError) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-sm text-destructive">
            Failed to load participants.
          </TableCell>
        </TableRow>
      );
    }

    if (participants.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
            No participants enrolled in this project yet.
          </TableCell>
        </TableRow>
      );
    }

    const profiles = profileQuery.data ?? new Map();

    return participants.map(participant => {
      const profile = profiles.get(participant.userId);
      return (
        <TableRow key={participant.id}>
          <TableCell>
            <div className="font-medium">{profile?.fullName ?? "Unknown educator"}</div>
            <div className="text-xs text-muted-foreground">{profile?.email ?? participant.userId}</div>
          </TableCell>
          <TableCell>
            <Badge variant="outline">{participant.userId}</Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {new Date(participant.joinedAt).toLocaleString()}
          </TableCell>
          <TableCell className="flex justify-end">
            <Button variant="destructive" size="sm" onClick={() => setConfirming(participant)}>
              Remove
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  }, [selectedProjectId, loadingParticipants, participantsError, participants, profileQuery.data]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Research participants</CardTitle>
            <CardDescription>Review who has access to each project and revoke participation when needed.</CardDescription>
          </div>
          <div className="w-full max-w-xs">
            <Select value={selectedProjectId} onValueChange={value => setSelectedProjectId(value)} disabled={loadingProjects || projects.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{participantRows}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(confirming)} onOpenChange={open => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove participant?</AlertDialogTitle>
            <AlertDialogDescription>
              This educator will lose access to project documents and submission tools.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!confirming) return;
                  deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Removing…" : "Remove"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
