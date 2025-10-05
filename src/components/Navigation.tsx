import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Search,
  User,
  LogOut,
  BookOpen,
  IdCard,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const location = useLocation();
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

  const navItems = useMemo(() => {
    const items = [
      { name: t.nav.home, path: "/" },
      { name: t.nav.dashboard, path: "/dashboard" },
      { name: t.nav.student, path: "/student" },
      { name: t.nav.blog, path: "/blog" },
      { name: t.nav.events, path: "/events" },
      { name: t.nav.services, path: "/services" },
      { name: t.nav.about, path: "/about" },
    ];

    return items;
  }, [
    t.nav.dashboard,
    t.nav.about,
    t.nav.blog,
    t.nav.events,
    t.nav.home,
    t.nav.student,
    t.nav.services,
  ]);
  
  const getLocalizedNavPath = (path: string) => getLocalizedPath(path, "en");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(getLocalizedNavPath(`/blog?search=${encodeURIComponent(searchQuery)}`));
      setSearchQuery("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(getLocalizedNavPath("/"));
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="container flex h-16 items-center gap-4">
        <Link to={getLocalizedNavPath("/")} className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SchoolTech</span>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Desktop search */}
          <form
            onSubmit={handleSearch}
            className="relative hidden flex-1 items-center md:flex md:max-w-xs lg:max-w-sm xl:max-w-md"
          >
            <label htmlFor="desktop-search" className="sr-only">
              {t.common.search}
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              id="desktop-search"
              type="text"
              placeholder={t.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-full pl-9 pr-3"
            />
          </form>

          {/* Desktop navigation links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map(item => {
              const localizedPath = getLocalizedNavPath(item.path);
              const [targetPath, queryString] = localizedPath.split("?");
              const matchesPath =
                location.pathname === targetPath ||
                (item.path !== "/" && targetPath && location.pathname.startsWith(targetPath));
              const targetParams = new URLSearchParams(queryString ?? "");
              const currentParams = new URLSearchParams(location.search);
              const matchesQuery =
                targetParams.toString().length === 0 ||
                Array.from(targetParams.entries()).every(([key, value]) => currentParams.get(key) === value);
              const isActive = matchesPath && matchesQuery;

              return (
                <Link
                  key={item.path}
                  to={localizedPath}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                    "border border-transparent hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="text-sm text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate(getLocalizedNavPath("/dashboard"))}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t.nav.dashboard}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(getLocalizedNavPath("/account"))}
                  >
                    <IdCard className="mr-2 h-4 w-4" />
                    {t.nav.my_profile}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(getLocalizedNavPath("/account?tab=classes"))}
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    {t.account.tabs.classes}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="whitespace-nowrap">
                <Link to={getLocalizedNavPath("/auth")}>{t.nav.signUp} / {t.nav.signIn}</Link>
              </Button>
            )}
          </div>

          {/* Mobile navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[380px]">
              <div className="mt-8 flex flex-col space-y-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative">
                  <label htmlFor="mobile-search" className="sr-only">
                    {t.common.search}
                  </label>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    id="mobile-search"
                    type="text"
                    placeholder={t.common.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-full pl-9 pr-3"
                  />
                </form>

                {navItems.map(item => {
                  const localizedPath = getLocalizedNavPath(item.path);
                  const [targetPath, queryString] = localizedPath.split("?");
                  const matchesPath =
                    location.pathname === targetPath ||
                    (item.path !== "/" && targetPath && location.pathname.startsWith(targetPath));
                  const targetParams = new URLSearchParams(queryString ?? "");
                  const currentParams = new URLSearchParams(location.search);
                  const matchesQuery =
                    targetParams.toString().length === 0 ||
                    Array.from(targetParams.entries()).every(([key, value]) => currentParams.get(key) === value);
                  const isActive = matchesPath && matchesQuery;

                  return (
                    <Link
                      key={item.path}
                      to={localizedPath}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "py-2 text-lg font-medium transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                {user ? (
                  <div className="border-t pt-4 space-y-3">
                    <p className="px-2 text-sm text-muted-foreground">{user.email}</p>
                    <Link
                      to={getLocalizedNavPath("/account")}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button className="w-full" variant="secondary">
                        {t.nav.my_profile ?? t.nav.dashboard}
                      </Button>
                    </Link>
                    <Link
                      to={getLocalizedNavPath("/account?tab=classes")}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button className="w-full" variant="outline">
                        {t.account.tabs.classes}
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t.nav.signOut}
                    </Button>
                  </div>
                ) : (
                  <Link to={getLocalizedNavPath("/auth")} onClick={() => setIsOpen(false)}>
                    <Button className="w-full">{t.nav.signUp} / {t.nav.signIn}</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
