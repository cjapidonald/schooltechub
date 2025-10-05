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
import { cn } from "@/lib/utils";
import { SettingsPanel } from "@/pages/account/components/SettingsPanel";

const extractMetadataValue = (metadata: Record<string, unknown>, key: string): string | null => {
  const value = metadata[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const BackgroundOrnaments = () => (
  <div className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute -top-48 left-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-sky-500/25 blur-3xl" />
    <div className="absolute bottom-[-14rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-purple-500/20 blur-3xl" />
    <div className="absolute top-1/3 right-1/5 h-[22rem] w-[22rem] rounded-full bg-emerald-500/20 blur-3xl" />
    <div className="absolute left-[-10rem] top-1/2 h-[18rem] w-[18rem] rounded-full bg-blue-500/20 blur-3xl" />
  </div>
);

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

  const gradientBackgroundClass =
    "relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white";

  if (loading) {
    return (
      <div className={gradientBackgroundClass}>
        <SEO title={t.profilePage.title} description={t.profilePage.subtitle} />
        <BackgroundOrnaments />
        <div className="relative flex min-h-[60vh] items-center justify-center px-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={gradientBackgroundClass}>
        <SEO title={t.profilePage.title} description={t.profilePage.subtitle} />
        <BackgroundOrnaments />
        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
          <Card
            className={cn(
              "w-full rounded-[2rem] border border-white/15 bg-white/10 p-8 text-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl",
            )}
          >
            <CardHeader className="space-y-4">
              <CardTitle className="text-3xl font-semibold text-white">{t.profilePage.title}</CardTitle>
              <CardDescription className="text-white/70">
                {t.profilePage.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-white/70">{t.profilePage.fallback.signInRequired}</p>
              <div className="flex justify-center">
                <Button
                  asChild
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white hover:bg-white/20"
                >
                  <Link to="/auth">{t.nav.signIn}</Link>
                </Button>
              </div>
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

  const heroCardClass =
    "relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-8 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl sm:p-12";
  const glassCardClass =
    "rounded-[2rem] border border-white/15 bg-white/10 text-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl";
  const detailItemClass =
    "flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.85)]";
  const subtleTextClass = "text-white/70";
  const actionButtonClass =
    "rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white hover:bg-white/20";

  return (
    <div className={cn(gradientBackgroundClass, "pb-20")}>
      <SEO title={t.profilePage.title} description={t.profilePage.subtitle} />
      <BackgroundOrnaments />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 md:px-8">
        <section className={heroCardClass}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4 text-center md:max-w-2xl md:text-left">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-white/60">Account</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t.profilePage.title}</h1>
              <p className={cn("mx-auto max-w-2xl text-lg", subtleTextClass)}>{t.profilePage.subtitle}</p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Button asChild className={cn(actionButtonClass)}>
                <a href="#profile-settings">{t.profilePage.editButton}</a>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[360px,1fr]">
          <div className="space-y-6">
            <Card className={cn(glassCardClass, "p-6 sm:p-8")}>
              <CardHeader className="space-y-4 border-none p-0">
                <CardTitle className="text-2xl font-semibold text-white">
                  {t.profilePage.info.title}
                </CardTitle>
                <CardDescription className={cn(subtleTextClass)}>
                  {t.profilePage.info.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-0 pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-20 w-20 border border-white/30 bg-white/10 text-white">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xl font-semibold text-white">{displayFullName}</p>
                    <p className={cn("text-sm", subtleTextClass)}>{subject ?? fallbackValue}</p>
                    <p className={cn("text-sm", subtleTextClass)}>{phoneNumber ?? fallbackValue}</p>
                  </div>
                </div>
                <dl className="space-y-4">
                  {detailItems.map(item => (
                    <div key={item.label} className={detailItemClass}>
                      <div className="mt-0.5 text-white/70">{item.icon}</div>
                      <div className="space-y-1">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">{item.label}</dt>
                        <dd className="text-sm font-medium text-white">{item.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card className={cn(glassCardClass, "p-6 sm:p-8")}>
              <CardHeader className="space-y-4 border-none p-0">
                <CardTitle className="text-2xl font-semibold text-white">
                  {t.profilePage.security.title}
                </CardTitle>
                <CardDescription className={cn(subtleTextClass)}>
                  {t.profilePage.security.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-0 pt-6">
                <p className={cn("text-sm", subtleTextClass)}>{t.profilePage.security.instructions}</p>
                <Button
                  onClick={handleSendPasswordReset}
                  disabled={isSendingReset}
                  className={cn(actionButtonClass, "w-full justify-center")}
                >
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

          <div id="profile-settings" className="space-y-6">
            <SettingsPanel user={user} variant="glass" className="space-y-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
