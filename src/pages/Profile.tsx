import { useEffect, useMemo, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";

interface TeacherProfile {
  firstName: string;
  lastName: string;
  school: string;
  subject: string;
  phoneNumber: string;
  email: string;
  avatarUrl?: string;
}

const Profile = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const teacherProfile = useMemo<TeacherProfile>(() => {
    const metadata = user?.user_metadata ?? {};

    return {
      firstName: metadata.firstName || metadata.first_name || t.profilePage.fallback.notProvided,
      lastName: metadata.lastName || metadata.last_name || t.profilePage.fallback.notProvided,
      school: metadata.school || t.profilePage.fallback.notProvided,
      subject: metadata.subject || t.profilePage.fallback.notProvided,
      phoneNumber: metadata.phoneNumber || metadata.phone_number || t.profilePage.fallback.notProvided,
      email: user?.email ?? t.profilePage.fallback.notProvided,
      avatarUrl: metadata.avatarUrl || metadata.avatar_url,
    };
  }, [t.profilePage.fallback.notProvided, user?.email, user?.user_metadata]);

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({
        title: t.profilePage.security.resetError,
        description: t.profilePage.security.noEmail,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: t.profilePage.security.resetSent,
        description: t.profilePage.security.resetDescription,
      });
    } catch (error) {
      toast({
        title: t.profilePage.security.resetError,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const initials = useMemo(() => {
    const firstInitial = teacherProfile.firstName?.[0] ?? "";
    const lastInitial = teacherProfile.lastName?.[0] ?? "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "ST";
  }, [teacherProfile.firstName, teacherProfile.lastName]);

  return (
    <div className="container py-10">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">
          {t.profilePage.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t.profilePage.subtitle}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              {teacherProfile.avatarUrl ? (
                <AvatarImage src={teacherProfile.avatarUrl} alt={teacherProfile.firstName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{t.profilePage.info.title}</CardTitle>
              <CardDescription>{t.profilePage.info.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>{t.profilePage.info.firstName}</Label>
              <Input value={teacherProfile.firstName} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>{t.profilePage.info.lastName}</Label>
              <Input value={teacherProfile.lastName} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>{t.profilePage.info.school}</Label>
              <Input value={teacherProfile.school} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>{t.profilePage.info.subject}</Label>
              <Input value={teacherProfile.subject} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>{t.profilePage.info.phone}</Label>
              <Input value={teacherProfile.phoneNumber} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>{t.profilePage.info.email}</Label>
              <Input value={teacherProfile.email} readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t.profilePage.security.title}
            </CardTitle>
            <CardDescription>{t.profilePage.security.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.profilePage.security.instructions}
            </p>
            <Button onClick={handlePasswordReset} disabled={isResettingPassword} className="w-full">
              {isResettingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t.profilePage.security.resetButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
