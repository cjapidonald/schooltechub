import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, Trash2, Upload } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useToast } from "@/hooks/use-toast";
import { useMyProfile } from "@/hooks/useMyProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  PROFILE_IMAGE_BUCKET,
  createProfileImageSignedUrl,
  resolveAvatarReference,
  isHttpUrl,
} from "@/lib/avatar";
import { createFileIdentifier } from "@/lib/files";

const HONORIFIC_OPTIONS = [
  { value: "Ms", label: "Ms" },
  { value: "Mr", label: "Mr" },
  { value: "Mx", label: "Mx" },
] as const;

type HonorificOption = (typeof HONORIFIC_OPTIONS)[number]["value"];

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const Profile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, loading } = useOptionalUser();
  const {
    firstName: savedFirstName,
    lastName: savedLastName,
    honorific: savedHonorific,
    schoolName: savedSchoolName,
    avatarUrl: profileAvatarUrl,
    isLoading: isProfileLoading,
    refresh,
  } = useMyProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [honorific, setHonorific] = useState<HonorificOption>("Ms");
  const [schoolName, setSchoolName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [baseAvatarUrl, setBaseAvatarUrl] = useState<string | null>(null);
  const [storedAvatarPublicUrl, setStoredAvatarPublicUrl] = useState<string | null>(null);
  const [currentAvatarReference, setCurrentAvatarReference] = useState<string | null>(null);
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const metadataStrings = useMemo(() => {
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const getString = (key: string) => {
      const value = metadata[key];
      return typeof value === "string" ? value.trim() : "";
    };

    return {
      firstName: getString("first_name"),
      lastName: getString("last_name"),
      honorific: getString("salutation"),
      schoolName: getString("school_name"),
    };
  }, [user?.user_metadata]);

  const avatarMetadata = useMemo(() => {
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const { reference, url } = resolveAvatarReference(metadata);
    const directUrl = url ?? (reference && isHttpUrl(reference) ? reference : null);
    const storageReference = reference && !isHttpUrl(reference) ? reference : null;

    return {
      directUrl,
      storageReference,
    };
  }, [user?.user_metadata]);

  useEffect(() => {
    if (loading || isProfileLoading) {
      return;
    }

    const nextFirstName = savedFirstName ?? metadataStrings.firstName ?? "";
    const nextLastName = savedLastName ?? metadataStrings.lastName ?? "";
    const nextHonorific = (savedHonorific ?? metadataStrings.honorific ?? "") as HonorificOption | "";
    const nextSchoolName = savedSchoolName ?? metadataStrings.schoolName ?? "";

    setFirstName(previous => (previous === nextFirstName ? previous : nextFirstName));
    setLastName(previous => (previous === nextLastName ? previous : nextLastName));
    setSchoolName(previous => (previous === nextSchoolName ? previous : nextSchoolName));
    setHonorific(previous => {
      if (nextHonorific && HONORIFIC_OPTIONS.some(option => option.value === nextHonorific)) {
        return nextHonorific;
      }
      return previous || "Ms";
    });
  }, [
    loading,
    isProfileLoading,
    savedFirstName,
    savedLastName,
    savedHonorific,
    savedSchoolName,
    metadataStrings.firstName,
    metadataStrings.lastName,
    metadataStrings.honorific,
    metadataStrings.schoolName,
  ]);

  useEffect(() => {
    setCurrentAvatarReference(avatarMetadata.storageReference ?? null);

    const loadAvatar = async () => {
      let nextUrl = profileAvatarUrl ?? avatarMetadata.directUrl ?? null;

      if (!nextUrl && avatarMetadata.storageReference) {
        try {
          nextUrl = await createProfileImageSignedUrl(avatarMetadata.storageReference);
        } catch (error) {
          console.error("Failed to create signed avatar URL", error);
          nextUrl = null;
        }
      }

      setBaseAvatarUrl(previous => (previous === nextUrl ? previous : nextUrl));
      setStoredAvatarPublicUrl(previous => {
        if (avatarMetadata.directUrl === previous) {
          return previous;
        }
        return avatarMetadata.directUrl ?? null;
      });
      setIsAvatarRemoved(false);
    };

    if (!avatarPreviewUrl) {
      void loadAvatar();
    }
  }, [avatarMetadata.directUrl, avatarMetadata.storageReference, profileAvatarUrl, avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

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
    setIsAvatarRemoved(false);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setBaseAvatarUrl(null);
    setStoredAvatarPublicUrl(null);
    setCurrentAvatarReference(null);
    setIsAvatarRemoved(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSaving(true);

    try {
      let nextAvatarReference = currentAvatarReference;
      let nextAvatarPublicUrl = storedAvatarPublicUrl;
      let nextAvatarDisplayUrl = baseAvatarUrl;

      if (avatarFile) {
        const fileExtension = avatarFile.name.split(".").pop();
        const safeExtension = fileExtension ? fileExtension.toLowerCase() : "png";
        const filePath = `${user.id}/profile/${createFileIdentifier()}.${safeExtension}`;

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

        nextAvatarReference = filePath;
        nextAvatarPublicUrl = publicUrl;
        nextAvatarDisplayUrl = signedUrl;
      } else if (isAvatarRemoved) {
        nextAvatarReference = null;
        nextAvatarPublicUrl = null;
        nextAvatarDisplayUrl = null;
      }

      const normalizedFirstName = toNullable(firstName) ?? null;
      const normalizedLastName = toNullable(lastName) ?? null;
      const normalizedSchoolName = toNullable(schoolName) ?? null;
      const normalizedHonorific = toNullable(honorific) ?? null;

      const fullNameParts = [normalizedFirstName, normalizedLastName].filter(Boolean) as string[];
      const combinedFullName = fullNameParts.join(" ").trim();
      const normalizedFullName = combinedFullName.length > 0 ? combinedFullName : null;
      const displayName = normalizedHonorific && normalizedLastName
        ? `${normalizedHonorific} ${normalizedLastName}`
        : normalizedFullName;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          salutation: normalizedHonorific,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          full_name: normalizedFullName,
          display_name: displayName,
          school_name: normalizedSchoolName,
          avatar_url: nextAvatarPublicUrl,
          avatar_storage_path: nextAvatarReference,
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
            salutation: normalizedHonorific,
            first_name: normalizedFirstName,
            last_name: normalizedLastName,
            full_name: normalizedFullName,
            display_name: displayName,
            school_name: normalizedSchoolName,
            avatar_url: nextAvatarPublicUrl,
          },
          { onConflict: "id" },
        );

      if (profileError) {
        throw profileError;
      }

      if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }

      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setBaseAvatarUrl(nextAvatarDisplayUrl ?? null);
      setStoredAvatarPublicUrl(nextAvatarPublicUrl ?? null);
      setCurrentAvatarReference(nextAvatarReference ?? null);
      setIsAvatarRemoved(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: t.profilePage.toasts.saved,
      });

      void refresh();
    } catch (error) {
      console.error("Failed to update profile", error);
      toast({
        variant: "destructive",
        title: t.profilePage.toasts.errorTitle,
        description: t.profilePage.toasts.errorDescription ?? t.common.tryAgain,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayedAvatarUrl = avatarPreviewUrl ?? baseAvatarUrl ?? undefined;
  const avatarFallback = useMemo(() => {
    const source = `${firstName} ${lastName}`.trim() || user?.email || "T";
    return source.charAt(0).toUpperCase();
  }, [firstName, lastName, user?.email]);

  if (loading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-muted/10">
        <SEO title={t.profilePage.title} description={t.profilePage.subtitle} />
        <div className="container flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted/10">
        <SEO title={t.profilePage.title} description={t.profilePage.subtitle} />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>{t.profilePage.title}</CardTitle>
              <CardDescription>{t.profilePage.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t.profilePage.fallback.signInRequired}</p>
              <Button asChild>
                <Link to="/auth">{t.nav.signIn}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO title={t.profilePage.title} description={t.profilePage.subtitle} />
      <div className="container py-10">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>{t.profilePage.title}</CardTitle>
              <CardDescription>{t.profilePage.form.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-24 w-24 border">
                    {displayedAvatarUrl ? <AvatarImage src={displayedAvatarUrl} alt="" /> : null}
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div>
                      <Label>{t.profilePage.form.photoLabel}</Label>
                      <p className="text-sm text-muted-foreground">{t.profilePage.form.photoHelp}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                        disabled={isSaving}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {t.profilePage.form.uploadButton}
                      </Button>
                      {(displayedAvatarUrl || storedAvatarPublicUrl) && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleRemoveAvatar}
                          disabled={isSaving}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t.profilePage.form.removeButton}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="profile-honorific">{t.profilePage.form.honorificLabel}</Label>
                    <Select
                      value={honorific}
                      onValueChange={value => setHonorific(value as HonorificOption)}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="profile-honorific">
                        <SelectValue placeholder={t.profilePage.form.honorificPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {HONORIFIC_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profile-first-name">{t.profilePage.info.firstName}</Label>
                    <Input
                      id="profile-first-name"
                      value={firstName}
                      onChange={event => setFirstName(event.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-last-name">{t.profilePage.info.lastName}</Label>
                    <Input
                      id="profile-last-name"
                      value={lastName}
                      onChange={event => setLastName(event.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-school">{t.profilePage.info.school}</Label>
                    <Input
                      id="profile-school"
                      value={schoolName}
                      onChange={event => setSchoolName(event.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="profile-email">{t.profilePage.info.email}</Label>
                    <Input id="profile-email" value={user.email ?? ""} disabled readOnly />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.common.loading}
                      </>
                    ) : (
                      t.profilePage.form.saveButton
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
