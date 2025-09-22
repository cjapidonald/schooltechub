import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import type { Database, Json } from "@/integrations/supabase/types";
import { EnrolledClasses } from "@/components/EnrolledClasses";
import {
  getMyNotifications,
  getPrefs,
  markAllRead,
  updatePrefs,
  type NotificationPrefsPatch,
} from "@/lib/notifications";
import type { Notification, NotificationPrefs } from "@/types/platform";
import { cn } from "@/lib/utils";

const userRoleOptions: Database["public"]["Enums"]["user_role_enum"][] = [
  "Teacher",
  "Admin",
  "Parent",
  "Student",
  "Other",
];

type AccountSettings = {
  timezone: string;
  language: string;
  theme: "system" | "light" | "dark";
};

const defaultAccountSettings: AccountSettings = {
  timezone: "",
  language: "en",
  theme: "system",
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

const Account = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [notificationPrefsDraft, setNotificationPrefsDraft] = useState<NotificationPrefs | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(defaultAccountSettings);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    role: userRoleOptions[0],
    bio: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate(getLocalizedPath("/auth", language));
      } else {
        setUser(user);
        const metadataSettings = (user.user_metadata?.account_settings ?? defaultAccountSettings) as AccountSettings;
        setAccountSettings({
          ...defaultAccountSettings,
          ...metadataSettings,
        });
        if (user.user_metadata?.avatar_url) {
          setAvatarPreview(user.user_metadata.avatar_url as string);
        }
        if (user.user_metadata?.bio) {
          setProfileForm(prev => ({ ...prev, bio: user.user_metadata.bio as string }));
        }
      }
      setCheckingSession(false);
    });
  }, [navigate, language]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate(getLocalizedPath("/auth", language));
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, language]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const nextValue = tabParam ?? "overview";
    setActiveTab(nextValue);
  }, [searchParams]);

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfileForm(prev => ({
        ...prev,
        fullName: profileQuery.data?.full_name ?? "",
        role: (profileQuery.data?.role as Database["public"]["Enums"]["user_role_enum"] | null) ?? prev.role,
      }));
    } else if (user?.user_metadata?.full_name) {
      setProfileForm(prev => ({
        ...prev,
        fullName: user.user_metadata.full_name as string,
      }));
    }
  }, [profileQuery.data, user?.user_metadata?.full_name]);

  const commentsQuery = useQuery({
    queryKey: ["my-comments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          content_master:content_id (
            id,
            title,
            slug,
            page
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return (data ?? []) as CommentWithContent[];
    },
  });

  const blogsQuery = useQuery({
    queryKey: ["my-blogs", user?.id, language],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("content_master")
        .select("id,title,slug,page,is_published,created_at,author,language")
        .in("page", ["research_blog", "edutech", "teacher_diary"])
        .eq("language", language)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const posts = (data ?? []) as BlogSummary[];
      const filtered = posts.filter((post) => {
        const authorPayload = post.author as Json | Json[] | null;

        const matchesAuthor = (entry: Json | null) => {
          if (!entry || typeof entry !== "object") return false;
          const record = entry as Record<string, Json>;
          const id = typeof record.id === "string" ? record.id : null;
          const email = typeof record.email === "string" ? record.email : null;
          return (id && id === user.id) || (email && email === user.email);
        };

        if (Array.isArray(authorPayload)) {
          return authorPayload.some(item => matchesAuthor(item));
        }

        return matchesAuthor(authorPayload as Json | null);
      });

      return filtered;
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    enabled: !checkingSession,
    queryFn: () => getMyNotifications(),
  });

  const notificationPrefsQuery = useQuery({
    queryKey: ["notification-prefs"],
    enabled: !checkingSession,
    queryFn: () => getPrefs(),
  });

  useEffect(() => {
    if (notificationPrefsQuery.data) {
      setNotificationPrefsDraft(notificationPrefsQuery.data);
    }
  }, [notificationPrefsQuery.data]);

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const getNotificationCopy = (notification: Notification): { title: string; body: string } => {
    const payload = notification.payload ?? {};

    if (notification.type === "resource_approved") {
      const title =
        typeof payload.title === "string" && payload.title.trim().length > 0
          ? payload.title
          : t.account.notifications.feed.resourceApproved.fallbackTitle;
      return {
        title: t.account.notifications.feed.resourceApproved.title,
        body: t.account.notifications.feed.resourceApproved.body.replace("{title}", title),
      };
    }

    if (notification.type === "blogpost_approved") {
      const title =
        typeof payload.title === "string" && payload.title.trim().length > 0
          ? payload.title
          : t.account.notifications.feed.blogpostApproved.fallbackTitle;
      return {
        title: t.account.notifications.feed.blogpostApproved.title,
        body: t.account.notifications.feed.blogpostApproved.body.replace("{title}", title),
      };
    }

    if (notification.type === "research_application_approved") {
      const title =
        typeof payload.projectTitle === "string" && payload.projectTitle.trim().length > 0
          ? payload.projectTitle
          : t.account.notifications.feed.researchApplicationApproved.fallbackTitle;
      return {
        title: t.account.notifications.feed.researchApplicationApproved.title,
        body: t.account.notifications.feed.researchApplicationApproved.body.replace("{title}", title),
      };
    }

    if (notification.type === "comment_reply") {
      return {
        title: t.account.notifications.feed.commentReply.title,
        body: t.account.notifications.feed.commentReply.body,
      };
    }

    return {
      title: t.account.notifications.feed.fallback.title,
      body: t.account.notifications.feed.fallback.body,
    };
  };

  const updatePrefDraft = (key: keyof NotificationPrefsPatch, value: boolean) => {
    setNotificationPrefsDraft(prev => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        [key]: value,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleSavePrefs = () => {
    if (!notificationPrefsDraft) {
      return;
    }

    const patch: NotificationPrefsPatch = {
      emailEnabled: notificationPrefsDraft.emailEnabled,
      resourceApproved: notificationPrefsDraft.resourceApproved,
      blogpostApproved: notificationPrefsDraft.blogpostApproved,
      researchApplicationApproved: notificationPrefsDraft.researchApplicationApproved,
      commentReply: notificationPrefsDraft.commentReply,
    };

    updateNotificationPrefsMutation.mutate(patch);
  };

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: unknown) => {
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: (patch: NotificationPrefsPatch) => updatePrefs(patch),
    onSuccess: (data) => {
      setNotificationPrefsDraft(data);
      queryClient.setQueryData(["notification-prefs"], data);
      toast({
        title: t.account.toast.notificationsUpdated,
        variant: "default",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: profileForm.fullName,
          role: profileForm.role,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.fullName,
          role: profileForm.role,
          bio: profileForm.bio,
        },
      });

      if (metadataError) {
        throw metadataError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: t.account.toast.profileUpdated,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t.common.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error(t.account.toast.passwordMismatch);
      }

      if (passwordForm.newPassword.length < 8) {
        throw new Error(t.account.toast.passwordLength);
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      toast({
        title: t.account.toast.passwordUpdated,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t.account.toast.passwordError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAccountSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.auth.updateUser({
        data: {
          account_settings: accountSettings,
        },
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: t.account.toast.settingsUpdated,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t.common.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activitySummary = useMemo(() => ({
    comments: commentsQuery.data?.length ?? 0,
    posts: blogsQuery.data?.length ?? 0,
    lastLogin: user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), "PPP p") : null,
  }), [commentsQuery.data?.length, blogsQuery.data?.length, user?.last_sign_in_at]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile || !user) return;
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, selectedFile, {
          upsert: true,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrlData.publicUrl,
        },
      });

      if (metadataError) {
        throw metadataError;
      }

      setSelectedFile(null);
      toast({
        title: t.account.toast.avatarUpdated,
        variant: "default",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : t.common.error;
      toast({
        title: t.account.toast.avatarError,
        description,
        variant: "destructive",
      });
    }
  };

  const avatarInitials = useMemo(() => {
    if (profileForm.fullName) {
      const parts = profileForm.fullName.trim().split(" ");
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  }, [profileForm.fullName, user?.email]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-muted/10 py-10">
        <div className="container space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO
        title={t.account.seo.title}
        description={t.account.seo.description}
        canonicalUrl={t.account.seo.canonical}
      />

      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_50%)]" />
        <div className="container relative z-10 space-y-8 py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-background shadow-lg">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={profileForm.fullName || t.account.heading.title} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {avatarInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.account.heading.title}</h1>
                <p className="text-muted-foreground">{t.account.heading.subtitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {profileForm.role}
                  </Badge>
                  {user?.email && (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {user.email}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="gap-2">
                <Link to={getLocalizedPath("/account/resources", language)}>
                  {t.account.resources.manageCta}
                </Link>
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4" />
                {t.account.image.changeButton}
              </Button>
              <Button
                onClick={() => navigate(getLocalizedPath("/", language))}
                variant="ghost"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t.account.actions.backToHome}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container space-y-8 pt-10">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleAvatarChange}
        />

        {selectedFile && (
          <Card className="border-dashed border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t.account.image.title}
              </CardTitle>
              <CardDescription>{t.account.image.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarPreview ?? undefined} alt="Preview" />
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setSelectedFile(null);
                  setAvatarPreview(user?.user_metadata?.avatar_url ?? null);
                }}>
                  {t.common.cancel}
                </Button>
                <Button onClick={handleAvatarUpload}>
                  {t.account.image.uploadButton}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t.account.tabs.overview}
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <BellRing className="h-4 w-4" />
              {t.account.tabs.notifications}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              {t.account.tabs.security}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              {t.account.tabs.activity}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {t.account.profile.title}
                    </CardTitle>
                    <CardDescription>{t.account.profile.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full-name">{t.account.profile.fullNameLabel}</Label>
                        <Input
                          id="full-name"
                          value={profileForm.fullName}
                          placeholder={t.account.profile.fullNamePlaceholder}
                          onChange={(event) => setProfileForm(prev => ({ ...prev, fullName: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.account.profile.roleLabel}</Label>
                        <Select
                          value={profileForm.role}
                          onValueChange={(value: Database["public"]["Enums"]["user_role_enum"]) =>
                            setProfileForm(prev => ({ ...prev, role: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.account.profile.rolePlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {userRoleOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                {t.account.profile.roles[option] ?? option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">{t.account.profile.bioLabel}</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(event) => setProfileForm(prev => ({ ...prev, bio: event.target.value }))}
                        placeholder={t.account.profile.bioPlaceholder}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (profileQuery.data) {
                          setProfileForm({
                            fullName: profileQuery.data.full_name ?? "",
                            role: (profileQuery.data.role as Database["public"]["Enums"]["user_role_enum"] | null) ?? userRoleOptions[0],
                            bio: (user?.user_metadata?.bio as string | undefined) ?? "",
                          });
                        }
                      }}
                    >
                      {t.common.cancel}
                    </Button>
                    <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? t.common.loading : t.common.save}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      {t.account.settings.title}
                    </CardTitle>
                    <CardDescription>{t.account.settings.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">{t.account.settings.timezone}</Label>
                      <Input
                        id="timezone"
                        value={accountSettings.timezone}
                        placeholder={t.account.settings.timezonePlaceholder}
                        onChange={(event) => setAccountSettings(prev => ({ ...prev, timezone: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">{t.account.settings.language}</Label>
                      <Select
                        value={accountSettings.language}
                        onValueChange={(value) => setAccountSettings(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder={t.account.settings.languagePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="sq">Shqip</SelectItem>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="theme">{t.account.settings.theme}</Label>
                      <Select
                        value={accountSettings.theme}
                        onValueChange={(value: AccountSettings["theme"]) => setAccountSettings(prev => ({ ...prev, theme: value }))}
                      >
                        <SelectTrigger id="theme">
                          <SelectValue placeholder={t.account.settings.themePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">{t.account.settings.themeOptions.system}</SelectItem>
                          <SelectItem value="light">{t.account.settings.themeOptions.light}</SelectItem>
                          <SelectItem value="dark">{t.account.settings.themeOptions.dark}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button onClick={() => updateAccountSettingsMutation.mutate()} disabled={updateAccountSettingsMutation.isPending}>
                      {updateAccountSettingsMutation.isPending ? t.common.loading : t.common.save}
                    </Button>
                  </CardFooter>
                </Card>

              </div>

              <div className="space-y-6">
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      {t.account.activity.title}
                    </CardTitle>
                    <CardDescription>{t.account.activity.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.account.activity.comments}</p>
                        <p className="text-2xl font-semibold">{activitySummary.comments}</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.account.activity.posts}</p>
                        <p className="text-2xl font-semibold">{activitySummary.posts}</p>
                      </div>
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">{t.account.activity.lastLogin}</p>
                      <p className="mt-1 font-medium">
                        {activitySummary.lastLogin ?? t.account.activity.neverLoggedIn}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t.account.support.title}</CardTitle>
                    <CardDescription>{t.account.support.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{t.account.support.contact}</p>
                    <p>{t.account.support.response}</p>
                    <Button
                      variant="outline"
                      onClick={() => navigate(getLocalizedPath("/contact", language))}
                      className="w-full"
                    >
                      {t.account.support.cta}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-primary" />
                      {t.account.notifications.tab.title}
                    </CardTitle>
                    <CardDescription>{t.account.notifications.tab.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={unreadCount === 0 || markAllReadMutation.isPending || notificationsQuery.isLoading}
                  >
                    {markAllReadMutation.isPending ? t.common.loading : t.account.notifications.tab.markAll}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationsQuery.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : notificationsQuery.isError ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                      {t.common.error}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {t.account.notifications.tab.empty}
                    </div>
                  ) : (
                    notifications.map(notification => {
                      const copy = getNotificationCopy(notification);
                      const createdAt = notification.createdAt ? new Date(notification.createdAt) : null;
                      const timeAgo = createdAt && !Number.isNaN(createdAt.getTime())
                        ? formatDistanceToNow(createdAt, { addSuffix: true })
                        : null;
                      const isUnread = !notification.isRead;

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "rounded-lg border p-4 transition",
                            isUnread ? "bg-primary/5" : "bg-background"
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{copy.title}</span>
                                {isUnread && <Badge variant="outline">{t.account.notifications.tab.unread}</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{copy.body}</p>
                            </div>
                            {timeAgo && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t.account.notifications.preferences.title}</CardTitle>
                  <CardDescription>{t.account.notifications.preferences.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationPrefsQuery.isLoading && !notificationPrefsDraft ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : notificationPrefsQuery.isError ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                      {t.common.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{t.account.notifications.preferences.emailEnabled.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.account.notifications.preferences.emailEnabled.description}
                          </p>
                        </div>
                        <Switch
                          checked={notificationPrefsDraft?.emailEnabled ?? true}
                          onCheckedChange={checked => updatePrefDraft("emailEnabled", checked)}
                          disabled={!notificationPrefsDraft}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{t.account.notifications.preferences.resourceApproved.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.account.notifications.preferences.resourceApproved.description}
                          </p>
                        </div>
                        <Switch
                          checked={notificationPrefsDraft?.resourceApproved ?? true}
                          onCheckedChange={checked => updatePrefDraft("resourceApproved", checked)}
                          disabled={!notificationPrefsDraft}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{t.account.notifications.preferences.blogpostApproved.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.account.notifications.preferences.blogpostApproved.description}
                          </p>
                        </div>
                        <Switch
                          checked={notificationPrefsDraft?.blogpostApproved ?? true}
                          onCheckedChange={checked => updatePrefDraft("blogpostApproved", checked)}
                          disabled={!notificationPrefsDraft}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{t.account.notifications.preferences.researchApplicationApproved.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.account.notifications.preferences.researchApplicationApproved.description}
                          </p>
                        </div>
                        <Switch
                          checked={notificationPrefsDraft?.researchApplicationApproved ?? true}
                          onCheckedChange={checked => updatePrefDraft("researchApplicationApproved", checked)}
                          disabled={!notificationPrefsDraft}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{t.account.notifications.preferences.commentReply.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.account.notifications.preferences.commentReply.description}
                          </p>
                        </div>
                        <Switch
                          checked={notificationPrefsDraft?.commentReply ?? true}
                          onCheckedChange={checked => updatePrefDraft("commentReply", checked)}
                          disabled={!notificationPrefsDraft}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    onClick={handleSavePrefs}
                    disabled={!notificationPrefsDraft || updateNotificationPrefsMutation.isPending}
                  >
                    {updateNotificationPrefsMutation.isPending ? t.common.loading : t.common.save}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes">
            <EnrolledClasses userId={user?.id} language={language} />
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    {t.account.password.title}
                  </CardTitle>
                  <CardDescription>{t.account.password.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t.account.password.newPassword}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      placeholder={t.account.password.newPasswordPlaceholder}
                      onChange={(event) => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t.account.password.confirmPassword}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      placeholder={t.account.password.confirmPasswordPlaceholder}
                      onChange={(event) => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button onClick={() => updatePasswordMutation.mutate()} disabled={updatePasswordMutation.isPending}>
                    {updatePasswordMutation.isPending ? t.common.loading : t.account.password.updateButton}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {t.account.securityTips.title}
                  </CardTitle>
                  <CardDescription>{t.account.securityTips.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {t.account.securityTips.tips.map((tip: string) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    {t.account.comments.title}
                  </CardTitle>
                  <CardDescription>{t.account.comments.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {commentsQuery.isLoading && (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  )}
                  {!commentsQuery.isLoading && commentsQuery.data?.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                      {t.account.comments.empty}
                    </div>
                  )}
                  {commentsQuery.data?.map(comment => (
                    <div key={comment.id} className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        {comment.created_at ? format(new Date(comment.created_at), "PPP p") : ""}
                      </p>
                      <p className="mt-2 text-sm">{comment.content}</p>
                      {comment.content_master && (
                        <Button
                          variant="link"
                          className="mt-2 h-auto px-0 text-primary"
                          onClick={() => navigate(getLocalizedPath(`/blog/${comment.content_master.slug}`, language))}
                        >
                          {t.account.comments.viewPost}
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {t.account.blogs.title}
                  </CardTitle>
                  <CardDescription>{t.account.blogs.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {blogsQuery.isLoading && (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  )}
                  {!blogsQuery.isLoading && blogsQuery.data?.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                      {t.account.blogs.empty}
                    </div>
                  )}
                  {blogsQuery.data?.map(post => (
                    <div key={post.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {post.created_at ? format(new Date(post.created_at), "PPP") : ""}
                          </p>
                        </div>
                        <Badge variant={post.is_published ? "default" : "secondary"}>
                          {post.is_published ? t.account.blogs.statusPublished : t.account.blogs.statusDraft}
                        </Badge>
                      </div>
                      <Button
                        variant="link"
                        className="mt-2 h-auto px-0 text-primary"
                        onClick={() => navigate(getLocalizedPath(`/blog/${post.slug}`, language))}
                      >
                        {t.account.blogs.readPost}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;
