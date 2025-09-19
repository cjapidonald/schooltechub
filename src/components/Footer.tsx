import { Link } from "react-router-dom";
import { GraduationCap, Mail, Facebook, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { t } = useLanguage();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    try {
      const { error } = await supabase.from("newsletter_subscribers").insert([
        { email, is_active: true }
      ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've been subscribed to our monthly tech tips.",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-background to-muted border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="School Tech Hub Solutions" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t.footer.tagline}
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/g/1NukWcXVpp/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://www.instagram.com/schooltechhub/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://www.linkedin.com/in/donald-cjapi-b7800a383/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="mailto:dcjapi@gmail.com" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/edutech" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.nav.edutech}
                </Link>
              </li>
              <li>
                <Link to="/diary" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.nav.teacherDiary}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.nav.blog}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
                <Link to="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.services.lms.title}
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.services.virtual.title}
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.services.assessment.title}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
              <Input
                type="email"
                placeholder={t.footer.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm"
              />
              <Button type="submit" className="w-full" disabled={isSubscribing}>
                {isSubscribing ? "..." : t.footer.subscribe}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground mb-2">© 2024 SchoolTech Hub. {t.footer.allRights}.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Email: dcjapi@gmail.com | Phone: +84 0372725432</p>
            <p>Available worldwide for online consultations</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;