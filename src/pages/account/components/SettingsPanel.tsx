import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

type ThemePreference = "system" | "light" | "dark";
type LanguageOption = "en" | "sq" | "vi";

type SettingsPanelProps = {
  user: User;
};

const createFileIdentifier = () => {
  const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoRef && "randomUUID" in cryptoRef) {
    return cryptoRef.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getAvatarUrlFromMetadata = (metadata: Record<string, unknown> | null | undefined): string | null => {
  if (!metadata) {
    return null;
  }

  const valueCandidates = [
    metadata.avatar_url,
    metadata.avatarUrl,
    metadata.avatar,
    metadata.picture,
  ];

  for (const candidate of valueCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
};

const isLanguageOption = (value: unknown): value is LanguageOption =>
  value === "en" || value === "sq" || value === "vi";

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

export const SettingsPanel = ({ user }: SettingsPanelProps) => {
  const { toast } = useToast();
  const { t, language: activeLanguage, setLanguage } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(() =>
    getAvatarUrlFromMetadata(user.user_metadata as Record<string, unknown> | undefined)
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [timezone, setTimezone] = useState<string>(() => {
    const stored = (user.user_metadata as Record<string, unknown> | undefined)?.timezone;
    return typeof stored === "string" ? stored : "";
  });
  const [languagePreference, setLanguagePreference] = useState<LanguageOption>(() => {
    const stored = (user.user_metadata as Record<string, unknown> | undefined)?.language;
    if (isLanguageOption(stored)) {
      return stored;
    }
    return activeLanguage;
  });
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const stored = (user.user_metadata as Record<string, unknown> | undefined)?.theme;
    if (isThemePreference(stored)) {
      return stored;
    }
    return "system";
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    setCurrentAvatarUrl(
      getAvatarUrlFromMetadata(user.user_metadata as Record<string, unknown> | undefined)
    );
    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const storedTimezone = metadata?.timezone;
    const storedLanguage = metadata?.language;
    const storedTheme = metadata?.theme;

    if (typeof storedTimezone === "string") {
      setTimezone(storedTimezone);
    }

    if (isLanguageOption(storedLanguage)) {
      setLanguagePreference(storedLanguage);
    }

    if (isThemePreference(storedTheme)) {
      setThemePreference(storedTheme);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const displayedAvatarUrl = avatarPreviewUrl ?? currentAvatarUrl ?? undefined;
  const avatarFallback = useMemo(() => {
    const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    const email = user.email ?? "";
    const source = fullName.trim() || email.trim();
    return source ? source.charAt(0).toUpperCase() : "?";
  }, [user]);

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExtension = avatarFile.name.split(".").pop();
      const safeExtension = fileExtension ? fileExtension.toLowerCase() : "png";
      const filePath = `${user.id}/${createFileIdentifier()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setCurrentAvatarUrl(publicUrl);
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: t.account.toast.avatarUpdated,
      });
    } catch (error) {
      console.error("Failed to upload avatar", error);
      toast({
        variant: "destructive",
        title: t.account.toast.avatarError,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: t.account.toast.passwordMismatch,
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: t.account.toast.passwordLength,
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordForm({ newPassword: "", confirmPassword: "" });
      toast({
        title: t.account.toast.passwordUpdated,
      });
    } catch (error) {
      console.error("Failed to update password", error);
      toast({
        variant: "destructive",
        title: t.account.toast.passwordError,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePreferencesSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingPreferences(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          timezone: timezone.trim() || null,
          language: languagePreference,
          theme: themePreference,
        },
      });

      if (error) {
        throw error;
      }

      setLanguage(languagePreference);

      toast({
        title: t.account.toast.settingsUpdated,
      });
    } catch (error) {
      console.error("Failed to update account settings", error);
      toast({
        variant: "destructive",
        title: t.common.error,
        description: t.common.tryAgain,
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const languageOptions = useMemo(
    () => [
      { value: "en" as LanguageOption, label: t.sitemap.languages.en },
      { value: "sq" as LanguageOption, label: t.sitemap.languages.sq },
      { value: "vi" as LanguageOption, label: t.sitemap.languages.vi },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.account.image.title}</CardTitle>
          <CardDescription>{t.account.image.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {displayedAvatarUrl ? <AvatarImage src={displayedAvatarUrl} alt="" /> : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                {user.email ? (
                  <p className="text-sm font-medium">{user.email}</p>
                ) : null}
                {currentAvatarUrl ? (
                  <p className="text-xs text-muted-foreground">
                    {t.account.image.description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {t.account.image.changeButton}
              </Button>
              <Button
                type="button"
                onClick={handleAvatarUpload}
                disabled={!avatarFile || isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.common.loading}
                  </>
                ) : (
                  t.account.image.uploadButton
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <form onSubmit={handlePasswordSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>{t.account.security.title}</CardTitle>
            <CardDescription>{t.account.security.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">{t.account.security.newPasswordLabel}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={event =>
                  setPasswordForm(previous => ({ ...previous, newPassword: event.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">{t.account.security.confirmPasswordLabel}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={event =>
                  setPasswordForm(previous => ({ ...previous, confirmPassword: event.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                t.account.security.submitButton
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handlePreferencesSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>{t.account.settings.title}</CardTitle>
            <CardDescription>{t.account.settings.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="timezone">{t.account.settings.timezone}</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={event => setTimezone(event.target.value)}
                placeholder={t.account.settings.timezonePlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t.account.settings.language}</Label>
              <Select value={languagePreference} onValueChange={value => setLanguagePreference(value as LanguageOption)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.account.settings.languagePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t.account.settings.theme}</Label>
              <Select value={themePreference} onValueChange={value => setThemePreference(value as ThemePreference)}>
                <SelectTrigger>
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
          <CardFooter>
            <Button type="submit" disabled={isSavingPreferences}>
              {isSavingPreferences ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                t.account.settings.saveButton
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

