import { Link } from "react-router-dom";
import { Mail, Facebook, Instagram, Linkedin } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { t, language } = useLanguage();
  const emailInputId = useId();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    try {
      const { error } = await supabase.from("newsletter_subscribers").insert([
        { email, is_active: true }
      ]);

      if (error) throw error;

      toast({
        title: t.footer.toast.successTitle,
        description: t.footer.toast.successMessage,
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: t.footer.toast.errorTitle,
        description: error.message || t.footer.toast.errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-background/60 via-background/40 to-background/80 backdrop-blur-xl dark:border-white/5">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-10 left-0 h-56 w-56 -translate-x-1/3 rounded-full bg-secondary/20 blur-3xl" />
      </div>
      <div className="container relative py-12">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-xl backdrop-blur-2xl dark:border-white/5 dark:bg-white/5">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-lg font-semibold">
                  School Tech Hub Solutions
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.footer.tagline}
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.facebook.com/share/g/1NukWcXVpp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={t.footer.social.facebook}
                >
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">{t.footer.social.facebook}</span>
                </a>
                <a
                  href="https://www.instagram.com/schooltechhub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={t.footer.social.instagram}
                >
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">{t.footer.social.instagram}</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/donald-cjapi-b7800a383/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={t.footer.social.linkedin}
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">{t.footer.social.linkedin}</span>
                </a>
                <a
                  href="mailto:dcjapi@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={t.footer.social.email}
                >
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">{t.footer.social.email}</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">{t.footer.quickLinks}</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to={getLocalizedPath("/blog", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.nav.blog}
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/events", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.nav.events}
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/lesson-builder", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.nav.builder}
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/faq", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.nav.faq}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold mb-4">{t.nav.services}</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to={getLocalizedPath("/services", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.services.lms.title}
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/services", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.services.virtual.title}
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/services", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.services.assessment.title}
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/contact", language)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.nav.contact}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-semibold mb-4">{t.footer.newsletter}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.footer.newsletterText}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <label htmlFor={emailInputId} className="sr-only">
                  {t.footer.emailLabel ?? t.footer.emailPlaceholder}
                </label>
                <Input
                  type="email"
                  placeholder={t.footer.emailPlaceholder}
                  id={emailInputId}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-sm"
                />
                <Button type="submit" className="w-full" disabled={isSubscribing}>
                  {isSubscribing ? t.footer.subscribing : t.footer.subscribe}
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center dark:border-white/5">
            <p className="text-sm text-muted-foreground mb-2">© 2024 SchoolTech Hub. {t.footer.allRights}.</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t.footer.contact.emailLabel}: dcjapi@gmail.com | {t.footer.contact.phoneLabel}: +84 0372725432</p>
              <p>{t.footer.contact.availability}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;