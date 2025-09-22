import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  CheckCircle2,
  FileText,
  Lock,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  BellRing,
  Globe,
  GraduationCap,
  Activity,
  Paperclip,
  FlaskConical,
  Bookmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ACTIVITY_TYPE_LABELS,
  getRecentActivity,
  subscribeToActivityLog,
  type ActivityEntry,
  type ActivityType,
} from "@/lib/activity-log";
import type { Database, Json } from "@/integrations/supabase/types";
import { ClassManager } from "@/components/classes/ClassManager";

const userRoleOptions: Database["public"]["Enums"]["user_role_enum"][] = [
  "Teacher",
  "Admin",
  "Parent",
  "Student",
  "Other",
];

type NotificationPreferences = {
  updates: boolean;
  commentReplies: boolean;
  productAnnouncements: boolean;
  blogMentions: boolean;
};

type AccountSettings = {
  timezone: string;
  language: string;
  theme: "system" | "light" | "dark";
};

const defaultNotificationPreferences: NotificationPreferences = {
  updates: true,
  commentReplies: true,
  productAnnouncements: false,
  blogMentions: true,
};

const defaultAccountSettings: AccountSettings = {
  timezone: "",
  language: "en",
  theme: "system",
};

const activityTypeIcons: Record<ActivityType, LucideIcon> = {
  "class-created": GraduationCap,
  "plan-saved": FileText,
  "resource-attached": Paperclip,
  "research-submitted": FlaskConical,
};

type CommentWithContent = Database["public"]["Tables"]["comments"]["Row"] & {
  content_master: Pick<
    Database["public"]["Tables"]["content_master"]["Row"],
    "id" | "title" | "slug" | "page"
  > | null;
};

type BlogSummary = Pick<
  Database["public"]["Tables"]["content_master"]["Row"],
  "id" | "title" | "slug" | "page" | "is_published" | "created_at" | "author" | "language"
>;

type SavedPostWithContent = Database["public"]["Tables"]["saved_posts"]["Row"] & {
  content?: Pick<
    Database["public"]["Tables"]["content_master"]["Row"],
    "id" | "title" | "slug" | "language" | "page" | "published_at"
  > | null;
};

const Account = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(defaultAccountSettings);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    role: userRoleOptions[0],
    bio: "",
  });
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([]);
  const [removingPostId, setRemovingPostId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // … rest of the component stays the same …
};

export default Account;
