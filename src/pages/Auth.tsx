import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Chrome,
  GraduationCap,
  Users2,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Teacher");
  const [googleLoading, setGoogleLoading] = useState(false);

  const { language, t } = useLanguage();

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    if (!next) {
      return "/";
    }
    try {
      const decoded = decodeURIComponent(next);
      return decoded.startsWith("/") ? decoded : "/";
    } catch {
      return "/";
    }
  }, [location.search]);

  useEffect(() => {
    // Set up auth state listener FIRST to handle redirects/code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate(getLocalizedPath(nextPath, language));
      }
    });

    // Then check for existing session (also triggers code exchange on redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(getLocalizedPath(nextPath, language));
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, language, nextPath]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) {
      toast({
        title: t.auth.toast.errorTitle,
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: t.auth.toast.successTitle,
        description: t.auth.toast.successDescription,
      });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: t.auth.toast.errorTitle,
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`
      }
    });

    if (error) {
      toast({
        title: t.auth.toast.errorTitle,
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
    setGoogleLoading(false);
  };

  const roleIconMap = {
    student: GraduationCap,
    parent: Users2,
    teacher: LayoutDashboard,
  } as const;

  type RoleKey = keyof typeof roleIconMap;

  const credentialEntries = [
    {
      key: "teacher",
      label: t.auth.demoCredentials.teacher.label,
      name: t.auth.demoCredentials.teacher.name,
      roleDescription: t.auth.demoCredentials.teacher.roleDescription,
      email: t.auth.demoCredentials.teacher.email,
      password: t.auth.demoCredentials.teacher.password,
    },
    {
      key: "student",
      label: t.auth.demoCredentials.student.label,
      name: t.auth.demoCredentials.student.name,
      roleDescription: t.auth.demoCredentials.student.roleDescription,
      email: t.auth.demoCredentials.student.email,
      password: t.auth.demoCredentials.student.password,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-16">
      <SEO
        title={t.auth.seo.title}
        description={t.auth.seo.description}
        canonicalUrl={t.auth.seo.canonical}
      />

      <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="flex flex-col gap-6 lg:gap-8">
          <Card className="w-full self-start shadow-lg lg:sticky lg:top-10">
            <CardHeader className="space-y-3 text-center">
              <div className="flex justify-center">
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium uppercase tracking-wide">
                  {t.auth.roleShowcase.badge}
                </Badge>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{t.auth.card.title}</CardTitle>
                <CardDescription>{t.auth.card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">{t.auth.tabs.signIn}</TabsTrigger>
                  <TabsTrigger value="signup">{t.auth.tabs.signUp}</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">{t.auth.email}</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t.auth.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">{t.auth.password}</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder={t.auth.passwordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t.auth.signingIn : t.auth.signIn}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t.auth.name}</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={t.auth.namePlaceholder}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t.auth.email}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t.auth.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t.auth.password}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={t.auth.passwordCreatePlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">{t.auth.role}</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder={t.auth.selectRole} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Teacher">{t.auth.roles.teacher}</SelectItem>
                          <SelectItem value="Admin">{t.auth.roles.admin}</SelectItem>
                          <SelectItem value="Parent">{t.auth.roles.parent}</SelectItem>
                          <SelectItem value="Student">{t.auth.roles.student}</SelectItem>
                          <SelectItem value="Other">{t.auth.roles.other}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t.auth.signingUp : t.auth.signUp}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                {googleLoading ? t.auth.googleSigningIn : t.auth.googleSignIn}
              </Button>

              <div className="mt-4 text-center text-sm">
                <Link to={getLocalizedPath("/", language)} className="text-primary hover:underline">
                  {t.auth.backToHome}
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full border-primary/20 bg-primary/5 shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">{t.auth.demoCredentials.title}</CardTitle>
              <CardDescription>{t.auth.demoCredentials.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {credentialEntries.map(entry => (
                <div
                  key={entry.key}
                  className="rounded-2xl border border-primary/20 bg-background/80 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="w-fit text-xs uppercase tracking-wide">
                      {entry.label}
                    </Badge>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{entry.name}</h3>
                      <p className="text-sm text-muted-foreground">{entry.roleDescription}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                      <span className="text-muted-foreground">{t.auth.demoCredentials.emailLabel}</span>
                      <span className="font-medium text-foreground">{entry.email}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                      <span className="text-muted-foreground">{t.auth.demoCredentials.passwordLabel}</span>
                      <span className="font-medium text-foreground">{entry.password}</span>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{t.auth.demoCredentials.note}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit px-3 py-1 text-xs font-medium uppercase tracking-wide">
              {t.auth.roleShowcase.badge}
            </Badge>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              {t.auth.roleShowcase.title}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              {t.auth.roleShowcase.subtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(roleIconMap) as RoleKey[]).map((key) => {
              const roleContent = t.auth.roleShowcase.roles[key];
              const Icon = roleIconMap[key];

              return (
                <Card key={key} className="flex h-full flex-col justify-between border-primary/10 bg-background/60 shadow-sm">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{roleContent.title}</CardTitle>
                        <CardDescription>{roleContent.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {roleContent.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                        {roleContent.preview.title}
                      </p>
                      <div className="space-y-2 text-sm">
                        {roleContent.preview.items.map((item) => (
                          <div key={item.label} className="rounded-md bg-background/80 px-3 py-2 shadow-sm">
                            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                            <p className="font-medium text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-6 rounded-2xl border border-primary/20 bg-background/70 p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{t.auth.roleShowcase.teacherFlow.title}</h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {t.auth.roleShowcase.teacherFlow.description}
              </p>
            </div>
            <div className="space-y-4">
              {t.auth.roleShowcase.teacherFlow.steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {t.auth.roleShowcase.teacherFlow.stepLabel} {index + 1}
                      </p>
                      <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-muted bg-background/70 p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{t.auth.roleShowcase.connection.title}</h2>
              <p className="text-sm text-muted-foreground">{t.auth.roleShowcase.connection.subtitle}</p>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-3">
              {t.auth.roleShowcase.connection.items.map((item) => (
                <div key={item.title} className="rounded-lg border border-muted/60 bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;