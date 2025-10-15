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
import { useMyProfile } from "@/hooks/useMyProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  PROFILE_IMAGE_BUCKET,
  createProfileImageSignedUrl,
  resolveAvatarReference,
  isHttpUrl,
} from "@/lib/avatar";
import { createFileIdentifier } from "@/lib/files";
import { cn } from "@/lib/utils";
import type { Salutation } from "../../../../types/supabase-tables";

type ThemePreference = "system" | "light" | "dark";
type SettingsPanelProps = {
  user: User;
  className?: string;
  variant?: "default" | "glass";
};

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

const getMetadataString = (metadata: Record<string, unknown> | undefined, key: string) => {
  const rawValue = metadata?.[key];
  if (typeof rawValue !== "string") {
    return "";
  }

  const trimmed = rawValue.trim();
  return trimmed.length > 0 ? trimmed : "";
};

const SALUTATION_OPTIONS: Salutation[] = ["Mr", "Ms", "Mx"];
type SalutationOption = Salutation | "none";

const isSalutationValue = (value: unknown): value is Salutation =>
  typeof value === "string" && (SALUTATION_OPTIONS as readonly string[]).includes(value);

const getMetadataSalutation = (metadata: Record<string, unknown> | undefined): SalutationOption => {
  if (!metadata) {
    return "none";
  }

  const rawValue = metadata.salutation;
  return isSalutationValue(rawValue) ? (rawValue as Salutation) : "none";
};

export const SettingsPanel = ({ user, className, variant = "default" }: SettingsPanelProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataFirstNameValue = getMetadataString(metadata, "first_name");
  const metadataLastNameValue = getMetadataString(metadata, "last_name");
  const metadataSubjectValue = getMetadataString(metadata, "subject");
  const metadataPhoneValue = getMetadataString(metadata, "phone");
  const metadataSalutationValue = getMetadataSalutation(metadata);
  const initialSchoolName =
    typeof metadata?.school_name === "string" && metadata.school_name.trim().length > 0
      ? metadata.school_name.trim()
      : "";
  const initialSchoolLogoUrl =
    typeof metadata?.school_logo_url === "string" && metadata.school_logo_url.trim().length > 0
      ? metadata.school_logo_url.trim()
      : null;
  const {
    schoolName: profileSchoolName,
    schoolLogoUrl: profileSchoolLogoUrl,
    honorific: profileHonorific,
    firstName: profileFirstName,
    lastName: profileLastName,
    refresh: refreshProfile,
    isLoading: isProfileLoading,
  } = useMyProfile();
  const initialSalutation: SalutationOption = profileHonorific ?? metadataSalutationValue;
  const [salutation, setSalutation] = useState<SalutationOption>(initialSalutation);
  const [firstName, setFirstName] = useState<string>(profileFirstName ?? metadataFirstNameValue);
  const [lastName, setLastName] = useState<string>(profileLastName ?? metadataLastNameValue);
  const [subject, setSubject] = useState<string>(metadataSubjectValue);
  const [phoneNumber, setPhoneNumber] = useState<string>(metadataPhoneValue);
  const { reference: initialAvatarReference, url: initialAvatarUrl } =
    resolveAvatarReference(metadata ?? null);
  const [schoolName, setSchoolName] = useState<string>(initialSchoolName);
  const [storedSchoolLogoUrl, setStoredSchoolLogoUrl] = useState<string | null>(initialSchoolLogoUrl);
  const [schoolLogoFile, setSchoolLogoFile] = useState<File | null>(null);
  const [schoolLogoPreviewUrl, setSchoolLogoPreviewUrl] = useState<string | null>(null);
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);
  const [isSavingSchoolInfo, setIsSavingSchoolInfo] = useState(false);
  const schoolLogoInputRef = useRef<HTMLInputElement | null>(null);

  const [currentAvatarReference, setCurrentAvatarReference] = useState<string | null>(
    initialAvatarReference,
  );
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPersonalInfo, setIsSavingPersonalInfo] = useState(false);

  const [timezone, setTimezone] = useState<string>(() => {
    const stored = (user.user_metadata as Record<string, unknown> | undefined)?.timezone;
    return typeof stored === "string" ? stored : "";
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

  const isGlass = variant === "glass";
  const cardClassName = isGlass
    ? "border border-white/15 bg-white/10 text-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl"
    : undefined;
  const inputClassName = isGlass
    ? "border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/50"
    : undefined;
  const helperTextClassName = isGlass ? "text-white/60" : "text-muted-foreground";
  const subtleTextClassName = isGlass ? "text-white/70" : "text-muted-foreground";
  const labelClassName = isGlass ? "text-white" : undefined;
  const containerClassName = cn("space-y-6", className, isGlass && "text-white");
  const primaryButtonClassName = isGlass
    ? "border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
    : undefined;
  const outlineButtonClassName = isGlass
    ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
    : undefined;
  const ghostButtonClassName = isGlass ? "text-white hover:bg-white/10" : undefined;
  const avatarContainerClassName = isGlass
    ? "border-white/20 bg-white/10"
    : "border-border/70 bg-muted/40";
  const selectTriggerClassName = isGlass
    ? "border-white/20 bg-white/10 text-white focus:ring-white/50"
    : undefined;
  const selectContentClassName = isGlass
    ? "border border-white/20 bg-slate-900/90 text-white backdrop-blur-xl"
    : undefined;
  const selectItemClassName = isGlass ? "focus:bg-white/20 focus:text-white" : undefined;

  useEffect(() => {
    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const { reference, url } = resolveAvatarReference(metadata ?? null);

    setCurrentAvatarReference(reference);
    setCurrentAvatarUrl(url);

    setFirstName(getMetadataString(metadata, "first_name"));
    setLastName(getMetadataString(metadata, "last_name"));
    setSubject(getMetadataString(metadata, "subject"));
    setPhoneNumber(getMetadataString(metadata, "phone"));
    setSalutation(getMetadataSalutation(metadata));

    const storedTimezone = metadata?.timezone;
    const storedTheme = metadata?.theme;

    if (typeof storedTimezone === "string") {
      setTimezone(storedTimezone);
    }

    if (isThemePreference(storedTheme)) {
      setThemePreference(storedTheme);
    }
  }, [user]);

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }

    setSchoolName(previous => {
      const next = profileSchoolName ?? "";
      return previous === next ? previous : next;
    });

    setStoredSchoolLogoUrl(previous => {
      const next = profileSchoolLogoUrl ?? null;
      return previous === next ? previous : next;
    });

    setIsLogoRemoved(false);
    setSchoolLogoFile(null);
    setSchoolLogoPreviewUrl(previous => {
      if (previous && previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });

    if (schoolLogoInputRef.current) {
      schoolLogoInputRef.current.value = "";
    }
    setSalutation(profileHonorific ?? metadataSalutationValue);
    setFirstName(profileFirstName ?? metadataFirstNameValue);
    setLastName(profileLastName ?? metadataLastNameValue);
  }, [
    isProfileLoading,
    metadataFirstNameValue,
    metadataLastNameValue,
    metadataSalutationValue,
    profileFirstName,
    profileHonorific,
    profileLastName,
    profileSchoolLogoUrl,
    profileSchoolName,
  ]);

  useEffect(() => {
    if (!currentAvatarReference || isHttpUrl(currentAvatarReference)) {
      return;
    }

    let isCancelled = false;

    const resolveSignedUrl = async () => {
      try {
        const signedUrl = await createProfileImageSignedUrl(currentAvatarReference);
        if (!isCancelled) {
          setCurrentAvatarUrl(signedUrl);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to resolve avatar image URL", error);
          setCurrentAvatarUrl(null);
        }
      }
    };

    void resolveSignedUrl();

    return () => {
      isCancelled = true;
    };
  }, [currentAvatarReference]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (schoolLogoPreviewUrl && schoolLogoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(schoolLogoPreviewUrl);
      }
    };
  }, [schoolLogoPreviewUrl]);

  const displayedAvatarUrl = avatarPreviewUrl ?? currentAvatarUrl ?? undefined;
  const avatarFallback = useMemo(() => {
    const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    const email = user.email ?? "";
    const source = fullName.trim() || email.trim();
    return source ? source.charAt(0).toUpperCase() : "?";
  }, [user]);
  const displayedSchoolLogo = schoolLogoPreviewUrl ?? (isLogoRemoved ? null : storedSchoolLogoUrl);

  const handleSchoolLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (schoolLogoPreviewUrl && schoolLogoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(schoolLogoPreviewUrl);
    }

    setSchoolLogoFile(file);
    setSchoolLogoPreviewUrl(URL.createObjectURL(file));
    setIsLogoRemoved(false);
  };

  const handleSchoolLogoToggle = () => {
    if (schoolLogoPreviewUrl && schoolLogoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(schoolLogoPreviewUrl);
    }

    if (schoolLogoPreviewUrl) {
      setSchoolLogoPreviewUrl(null);
      setSchoolLogoFile(null);
      setIsLogoRemoved(!storedSchoolLogoUrl);
    } else {
      setIsLogoRemoved(previous => !previous);
    }

    if (schoolLogoInputRef.current) {
      schoolLogoInputRef.current.value = "";
    }
  };

  const handleSchoolInfoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingSchoolInfo) {
      return;
    }

    setIsSavingSchoolInfo(true);

    try {
      let nextLogoUrl = storedSchoolLogoUrl;

      if (schoolLogoFile) {
        const fileExtension = schoolLogoFile.name.split(".").pop();
        const safeExtension = fileExtension ? fileExtension.toLowerCase() : "png";
        const filePath = `${user.id}/school-logos/${createFileIdentifier()}.${safeExtension}`;

        const { error: uploadError } = await supabase.storage
          .from(PROFILE_IMAGE_BUCKET)
          .upload(filePath, schoolLogoFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(filePath);

        nextLogoUrl = publicUrl;
      } else if (isLogoRemoved) {
        nextLogoUrl = null;
      }

      const trimmedSchoolName = schoolName.trim();
      const normalizedSchoolName = trimmedSchoolName.length > 0 ? trimmedSchoolName : null;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, school_name: normalizedSchoolName, school_logo_url: nextLogoUrl },
          { onConflict: "id" },
        );

      if (profileError) {
        throw profileError;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          school_name: normalizedSchoolName,
          school_logo_url: nextLogoUrl,
        },
      });

      if (authError) {
        throw authError;
      }

      setSchoolName(normalizedSchoolName ?? "");
      setStoredSchoolLogoUrl(nextLogoUrl ?? null);
      setIsLogoRemoved(false);
      setSchoolLogoFile(null);
      setSchoolLogoPreviewUrl(previous => {
        if (previous && previous.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
      if (schoolLogoInputRef.current) {
        schoolLogoInputRef.current.value = "";
      }

      toast({
        title: t.account.toast.schoolInfoSaved,
      });

      void refreshProfile();
    } catch (error) {
      console.error("Failed to save school info", error);
      toast({
        variant: "destructive",
        title: t.common.error,
        description: t.common.tryAgain,
      });
    } finally {
      setIsSavingSchoolInfo(false);
    }
  };

  const handlePersonalInfoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSavingPersonalInfo) {
      return;
    }

    setIsSavingPersonalInfo(true);

    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedSubject = subject.trim();
      const trimmedPhone = phoneNumber.trim();

      const normalizedFirstName = trimmedFirstName.length > 0 ? trimmedFirstName : null;
      const normalizedLastName = trimmedLastName.length > 0 ? trimmedLastName : null;
      const normalizedSubject = trimmedSubject.length > 0 ? trimmedSubject : null;
      const normalizedPhone = trimmedPhone.length > 0 ? trimmedPhone : null;

      const normalizedSalutation = salutation === "none" ? null : salutation;
      const fullNameParts = [normalizedSalutation, normalizedFirstName, normalizedLastName].filter(Boolean) as string[];
      const combinedFullName = fullNameParts.join(" ").trim();
      const normalizedFullName = combinedFullName.length > 0 ? combinedFullName : null;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          salutation: normalizedSalutation,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          full_name: normalizedFullName,
          subject: normalizedSubject,
          phone: normalizedPhone,
        },
      });

      if (authError) {
        throw authError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: normalizedFullName,
            salutation: normalizedSalutation,
            first_name: normalizedFirstName,
            last_name: normalizedLastName,
          },
          { onConflict: "id" },
        );

      if (profileError) {
        throw profileError;
      }

      setFirstName(normalizedFirstName ?? "");
      setLastName(normalizedLastName ?? "");
      setSalutation(normalizedSalutation ?? "none");
      setSubject(normalizedSubject ?? "");
      setPhoneNumber(normalizedPhone ?? "");

      toast({
        title: t.account.toast.profileUpdated,
      });

      void refreshProfile();
    } catch (error) {
      console.error("Failed to update personal info", error);
      toast({
        variant: "destructive",
        title: t.common.error,
        description: t.common.tryAgain,
      });
    } finally {
      setIsSavingPersonalInfo(false);
    }
  };

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
        .from(PROFILE_IMAGE_BUCKET)
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(filePath);

      const signedUrl = await createProfileImageSignedUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
          avatar_storage_path: filePath,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setCurrentAvatarReference(filePath);
      setCurrentAvatarUrl(signedUrl);
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
          theme: themePreference,
        },
      });

      if (error) {
        throw error;
      }

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

  return (
    <div className={containerClassName}>
      <Card className={cn(cardClassName)}>
        <CardHeader>
          <CardTitle>{t.account.image.title}</CardTitle>
          <CardDescription className={cn(subtleTextClassName)}>
            {t.account.image.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {displayedAvatarUrl ? <AvatarImage src={displayedAvatarUrl} alt="" /> : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                {user.email ? <p className="text-sm font-medium">{user.email}</p> : null}
                {currentAvatarUrl ? (
                  <p className={cn("text-xs", subtleTextClassName)}>{t.account.image.description}</p>
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
                className={cn(outlineButtonClassName)}
              >
                {t.account.image.changeButton}
              </Button>
              <Button
                type="button"
                onClick={handleAvatarUpload}
                disabled={!avatarFile || isUploadingAvatar}
                className={cn(primaryButtonClassName)}
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

      <Card className={cn(cardClassName)}>
        <form onSubmit={handlePersonalInfoSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>{t.account.personal.title}</CardTitle>
            <CardDescription className={cn(subtleTextClassName)}>
              {t.account.personal.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="salutation" className={cn(labelClassName)}>
                  {t.account.personal.salutationLabel}
                </Label>
                <Select value={salutation} onValueChange={value => setSalutation(value as SalutationOption)}>
                  <SelectTrigger
                    id="salutation"
                    disabled={isSavingPersonalInfo}
                    className={cn(selectTriggerClassName)}
                  >
                    <SelectValue placeholder={t.account.personal.salutationPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className={cn(selectContentClassName)}>
                    <SelectItem value="none" className={cn(selectItemClassName)}>
                      {t.account.personal.salutationNone}
                    </SelectItem>
                    {SALUTATION_OPTIONS.map(option => (
                      <SelectItem key={option} value={option} className={cn(selectItemClassName)}>
                        {t.account.personal.salutationOptions[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className={cn(labelClassName)}>
                  {t.account.personal.emailLabel}
                </Label>
                <Input id="email" value={user.email ?? ""} disabled className={cn(inputClassName)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first-name" className={cn(labelClassName)}>
                  {t.account.personal.firstNameLabel}
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={event => setFirstName(event.target.value)}
                  placeholder={t.account.personal.firstNamePlaceholder}
                  disabled={isSavingPersonalInfo}
                  className={cn(inputClassName)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name" className={cn(labelClassName)}>
                  {t.account.personal.lastNameLabel}
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={event => setLastName(event.target.value)}
                  placeholder={t.account.personal.lastNamePlaceholder}
                  disabled={isSavingPersonalInfo}
                  className={cn(inputClassName)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject" className={cn(labelClassName)}>
                {t.account.personal.subjectLabel}
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={event => setSubject(event.target.value)}
                placeholder={t.account.personal.subjectPlaceholder}
                disabled={isSavingPersonalInfo}
                className={cn(inputClassName)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className={cn(labelClassName)}>
                {t.account.personal.phoneLabel}
              </Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={event => setPhoneNumber(event.target.value)}
                placeholder={t.account.personal.phonePlaceholder}
                disabled={isSavingPersonalInfo}
                className={cn(inputClassName)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingPersonalInfo} className={cn(primaryButtonClassName)}>
              {isSavingPersonalInfo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                t.account.personal.saveButton
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className={cn(cardClassName)}>
        <form onSubmit={handleSchoolInfoSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>{t.account.school.title}</CardTitle>
            <CardDescription className={cn(subtleTextClassName)}>
              {t.account.school.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="school-name" className={cn(labelClassName)}>
                {t.account.school.nameLabel}
              </Label>
              <Input
                id="school-name"
                value={schoolName}
                onChange={event => setSchoolName(event.target.value)}
                placeholder={t.account.school.namePlaceholder}
                className={cn(inputClassName)}
              />
            </div>
            <div className="space-y-2">
              <Label className={cn(labelClassName)}>{t.account.school.logoLabel}</Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border",
                    avatarContainerClassName,
                  )}
                >
                  {displayedSchoolLogo ? (
                    <img
                      src={displayedSchoolLogo}
                      alt={schoolName ? `${schoolName} logo` : t.account.school.logoAlt}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className={cn("px-2 text-center text-xs", helperTextClassName)}>
                      {t.account.school.logoPlaceholder}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    ref={schoolLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSchoolLogoFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => schoolLogoInputRef.current?.click()}
                    disabled={isSavingSchoolInfo}
                    className={cn(outlineButtonClassName)}
                  >
                    {t.account.school.uploadButton}
                  </Button>
                  {(storedSchoolLogoUrl || schoolLogoPreviewUrl || isLogoRemoved) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSchoolLogoToggle}
                      disabled={isSavingSchoolInfo}
                      className={cn(ghostButtonClassName)}
                    >
                      {isLogoRemoved ? t.account.school.restoreButton : t.account.school.removeButton}
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className={cn("text-xs", helperTextClassName)}>{t.account.school.logoHelp}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingSchoolInfo} className={cn(primaryButtonClassName)}>
              {isSavingSchoolInfo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                t.common.save
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className={cn(cardClassName)}>
        <form onSubmit={handlePasswordSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>{t.account.security.title}</CardTitle>
            <CardDescription className={cn(subtleTextClassName)}>
              {t.account.security.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password" className={cn(labelClassName)}>
                {t.account.security.newPasswordLabel}
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={event =>
                  setPasswordForm(previous => ({ ...previous, newPassword: event.target.value }))
                }
                placeholder="••••••••"
                className={cn(inputClassName)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password" className={cn(labelClassName)}>
                {t.account.security.confirmPasswordLabel}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={event =>
                  setPasswordForm(previous => ({ ...previous, confirmPassword: event.target.value }))
                }
                placeholder="••••••••"
                className={cn(inputClassName)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingPassword} className={cn(primaryButtonClassName)}>
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

      <Card className={cn(cardClassName)}>
        <form onSubmit={handlePreferencesSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>{t.account.settings.title}</CardTitle>
            <CardDescription className={cn(subtleTextClassName)}>
              {t.account.settings.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="timezone" className={cn(labelClassName)}>
                {t.account.settings.timezone}
              </Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={event => setTimezone(event.target.value)}
                placeholder={t.account.settings.timezonePlaceholder}
                className={cn(inputClassName)}
              />
            </div>
            <div className="grid gap-2">
              <Label className={cn(labelClassName)}>{t.account.settings.language}</Label>
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  isGlass
                    ? "border-white/20 bg-white/5 text-white/80"
                    : "border-input bg-muted/50 text-muted-foreground",
                )}
              >
                {t.account.settings.languageValue}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className={cn(labelClassName)}>{t.account.settings.theme}</Label>
              <Select value={themePreference} onValueChange={value => setThemePreference(value as ThemePreference)}>
                <SelectTrigger className={cn(selectTriggerClassName)}>
                  <SelectValue placeholder={t.account.settings.themePlaceholder} />
                </SelectTrigger>
                <SelectContent className={cn(selectContentClassName)}>
                  <SelectItem value="system" className={cn(selectItemClassName)}>
                    {t.account.settings.themeOptions.system}
                  </SelectItem>
                  <SelectItem value="light" className={cn(selectItemClassName)}>
                    {t.account.settings.themeOptions.light}
                  </SelectItem>
                  <SelectItem value="dark" className={cn(selectItemClassName)}>
                    {t.account.settings.themeOptions.dark}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingPreferences} className={cn(primaryButtonClassName)}>
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

