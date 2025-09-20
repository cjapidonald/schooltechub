import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { Chrome } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Teacher");
  const [googleLoading, setGoogleLoading] = useState(false);

  const { language, t } = useLanguage();

  useEffect(() => {
    // Set up auth state listener FIRST to handle redirects/code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate(getLocalizedPath("/", language));
      }
    });

    // Then check for existing session (also triggers code exchange on redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(getLocalizedPath("/", language));
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, language]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 px-4">
      <SEO
        title={t.auth.seo.title}
        description={t.auth.seo.description}
        canonicalUrl={t.auth.seo.canonical}
      />

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.auth.card.title}</CardTitle>
          <CardDescription>{t.auth.card.description}</CardDescription>
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
    </div>
  );
};

export default Auth;