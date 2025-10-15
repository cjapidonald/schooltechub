import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import RoleAuthDialog, { type AuthRole } from "@/components/auth/RoleAuthDialog";
import DesktopNavLinks from "@/components/navigation/DesktopNavLinks";
import AccountMenu from "@/components/navigation/AccountMenu";
import MobileNavSheet from "@/components/navigation/MobileNavSheet";
import type { NavItem } from "@/components/navigation/types";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { name: t.nav.home, path: "/" },
      { name: t.nav.blog, path: "/blog" },
      { name: t.nav.events, path: "/events" },
      { name: t.nav.services, path: "/services" },
      { name: t.nav.about, path: "/about" },
    ];

    return items;
  }, [
    t.nav.about,
    t.nav.blog,
    t.nav.events,
    t.nav.home,
    t.nav.services,
  ]);

  const getLocalizedNavPath = useCallback(
    (path: string) => getLocalizedPath(path, "en"),
    []
  );

  const isAuthDialogOpen = authRole !== null;

  const handleAuthSuccess = (role: AuthRole) => {
    const targetPath = role === "student" ? "/student" : "/teacher";
    const localizedTarget = getLocalizedNavPath(targetPath);
    setAuthRole(null);
    navigate(localizedTarget);
  };

  const homePath = getLocalizedNavPath("/");
  const authPath = getLocalizedNavPath("/auth");
  const authLabel = `${t.nav.signUp} / ${t.nav.signIn}`;
  const signOutLabel = t.nav.signOut;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(homePath);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <div className="container flex h-16 items-center gap-4">
          <Link to={homePath} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-bold">
              <span className="text-red-500">School</span>Tech
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-3">
            <DesktopNavLinks
              items={navItems}
              getLocalizedNavPath={getLocalizedNavPath}
              onAuthRoleSelect={role => setAuthRole(role)}
              isAuthDialogOpen={isAuthDialogOpen}
            />

            <div className="hidden items-center gap-3 md:flex">
              <AccountMenu
                user={user}
                authPath={authPath}
                authLabel={authLabel}
                signOutLabel={signOutLabel}
                onSignOut={handleSignOut}
              />
            </div>

            <MobileNavSheet
              items={navItems}
              getLocalizedNavPath={getLocalizedNavPath}
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              onAuthRoleSelect={role => setAuthRole(role)}
              isAuthDialogOpen={isAuthDialogOpen}
              user={user}
              authPath={authPath}
              authLabel={authLabel}
              signOutLabel={signOutLabel}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </nav>
      <RoleAuthDialog
        open={isAuthDialogOpen}
        role={authRole ?? "teacher"}
        onOpenChange={open => {
          if (!open) {
            setAuthRole(null);
          }
        }}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Navigation;
