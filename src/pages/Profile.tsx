import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, IdCard, Loader2, Mail, Phone, School, User as UserIcon } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalUser } from "@/hooks/useOptionalUser";
import { useToast } from "@/hooks/use-toast";
import { useMyProfile } from "@/hooks/useMyProfile";
import { supabase } from "@/integrations/supabase/client";
import { createProfileImageSignedUrl, resolveAvatarReference } from "@/lib/avatar";
import { SettingsPanel } from "@/pages/account/components/SettingsPanel";

const extractMetadataValue = (metadata: Record<string, unknown>, key: string): string | null => {
  const value = metadata[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const Profile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, loading } = useOptionalUser();
  const { fullName, schoolName, honorific, firstName: profileFirstName, lastName: profileLastName } = useMyProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAvatar = async () => {
      if (!user) {
        if (isMounted) {
          setAvatarUrl(null);
        }
        return;
      }

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const { reference, url } = resolveAvatarReference(metadata);

      if (url) {
        if (isMounted) {
          setAvatarUrl(url);
        }
        return;
      }

      if (!reference) {
        if (isMounted) {
          setAvatarUrl(null);
        }
        return;
      }

      try {
        const signedUrl = await createProfileImageSignedUrl(reference);
        if (isMounted) {
          setAvatarUrl(signedUrl);
        }
      } catch (error) {
        console.error("Failed to resolve avatar", error);
        if (isMounted) {
          setAvatarUrl(null);
        }
      }
    };

    void loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataFirstName = extractMetadataValue(metadata, "first_name");
  const metadataLastName = extractMetadataValue(metadata, "last_name");
  const subject = extractMetadataValue(metadata, "subject");
  const phoneNumber = extractMetadataValue(metadata, "phone");
  const firstName = profileFirstName ?? metadataFirstName;
  const lastName = profileLastName ?? metadataLastName;

  const fallbackValue = t.profilePage.fallback.notProvided;
  const displayFullName = useMemo(() => {
    const honorificPart = honorific?.trim();
    const combinedParts = [honorificPart, firstName?.trim(), lastName?.trim()]
      .filter((part): part is string => Boolean(part && part.length > 0))
      .join(" ");

    if (combinedParts.length > 0) {
      return combinedParts;
    }

    if (fullName && fullName.trim().length > 0) {
      return fullName.trim();
    }

    const metadataParts = [metadataFirstName, metadataLastName]
      .filter((part): part is string => Boolean(part && part.length > 0))
      .join(" ");

    if (metadataParts.length > 0) {
      return metadataParts;
    }

    return fallbackValue;
  }, [fallbackValue, firstName, fullName, honorific, lastName, metadataFirstName, metadataLastName]);

  const avatarFallback = useMemo(() => {
    const source = displayFullName !== fallbackValue ? displayFullName : user?.email ?? "";
    return source ? source.charAt(0).toUpperCase() : "?";
  }, [displayFullName, fallbackValue, user?.email]);

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      toast({
        title: t.profilePage.security.resetError,
        description: t.profilePage.security.noEmail,
        variant: "destructive",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      toast({
        title: t.profilePage.security.resetSent,
        description: t.profilePage.security.resetDescription,
      });
    } catch (error) {
      console.error("Failed to send password reset email", error);
      toast({
        title: t.profilePage.security.resetError,
        description: t.common.tryAgain,
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  if (loading) {
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

  const detailItems = [
    {
      label: t.profilePage.info.email,
      value: user.email ?? fallbackValue,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      label: t.profilePage.info.salutation,
      value: honorific ?? fallbackValue,
      icon: <IdCard className="h-4 w-4" />,
    },
    {
      label: t.profilePage.info.firstName,
      value: firstName ?? fallbackValue,
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      label: t.profilePage.info.lastName,
      value: lastName ?? fallbackValue,
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      label: t.profilePage.info.subject,
      value: subject ?? fallbackValue,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: t.profilePage.info.phone,
      value: phoneNumber ?? fallbackValue,
      icon: <Phone className="h-4 w-4" />,
    },
    {
      label: t.profilePage.info.school,
      value: schoolName ?? extractMetadataValue(metadata, "school_name") ?? fallbackValue,
      icon: <School className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO title={t.profilePage.title} description={t.profilePage.subtitle} />
      <div className="container space-y-8 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.profilePage.title}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{t.profilePage.subtitle}</p>
          </div>
          <Button asChild className="sm:shrink-0" variant="outline">
            <a href="#profile-settings">{t.profilePage.editButton}</a>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.profilePage.info.title}</CardTitle>
                <CardDescription>{t.profilePage.info.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{displayFullName}</p>
                    <p className="text-sm text-muted-foreground">{subject ?? fallbackValue}</p>
                    <p className="text-sm text-muted-foreground">{phoneNumber ?? fallbackValue}</p>
                  </div>
                </div>
                <dl className="space-y-4">
                  {detailItems.map(item => (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/80 p-3">
                      <div className="mt-0.5 text-muted-foreground">{item.icon}</div>
                      <div className="space-y-1">
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dt>
                        <dd className="text-sm font-medium text-foreground">{item.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.profilePage.security.title}</CardTitle>
                <CardDescription>{t.profilePage.security.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t.profilePage.security.instructions}</p>
                <Button onClick={handleSendPasswordReset} disabled={isSendingReset}>
                  {isSendingReset ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    t.profilePage.security.resetButton
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div id="profile-settings">
            <SettingsPanel user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
