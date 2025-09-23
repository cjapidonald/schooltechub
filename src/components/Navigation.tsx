import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, User, LogOut, Languages, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.blog, path: "/blog" },
    { name: t.nav.builder, path: "/lesson-builder" },
    { name: t.nav.events, path: "/events" },
    { name: t.nav.services, path: "/services" },
    { name: t.nav.about, path: "/about" },
  ];
  
  const getLocalizedNavPath = (path: string) => {
    return getLocalizedPath(path, language);
  };

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
            {navItems.map((item) => {
              const localizedPath = getLocalizedNavPath(item.path);
              const isActive =
                location.pathname === localizedPath ||
                (item.path !== "/" && location.pathname.startsWith(localizedPath));

              return (
                <Link
                  key={item.path}
                  to={localizedPath}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-foreground/90 transition-all duration-300 ease-out [text-shadow:0_0_10px_hsla(215,28%,17%,0.08)]",
                    "bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl",
                    "hover:border-white/30 hover:bg-white/10 hover:text-foreground hover:brightness-125 hover:scale-[1.02]",
                    "transform-gpu",
                    "before:pointer-events-none before:absolute before:inset-0 before:top-1/2 before:left-1/2 before:h-[180%] before:w-[160%] before:-translate-x-1/2 before:-translate-y-1/2 before:scale-95 before:rounded-full before:bg-[radial-gradient(45%_45%_at_50%_50%,hsla(0,0%,100%,0.45),hsla(198,100%,50%,0)_70%)] before:opacity-0 before:blur-2xl before:content-[''] before:transition-opacity before:duration-300 before:will-change-[transform,opacity]",
                    "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-white/20 after:opacity-0 after:content-[''] after:transition-opacity after:duration-300",
                    "group-hover:before:opacity-80 group-hover:before:animate-[nav-liquid_900ms_ease-out] group-hover:after:opacity-100",
                    "aria-[current=page]:border-white/40 aria-[current=page]:bg-white/15 aria-[current=page]:text-foreground aria-[current=page]:brightness-125 aria-[current=page]:scale-[1.02] aria-[current=page]:shadow-[0_0_25px_hsla(0,0%,100%,0.15)] aria-[current=page]:after:opacity-100 aria-[current=page]:before:opacity-90"
                  )}
                >
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Select
              value={language}
              onValueChange={(val) => {
                setLanguage(val as "en" | "sq" | "vi");
              }}
            >
              <SelectTrigger className="h-10 min-w-[5.5rem] px-3 lg:min-w-[6.5rem]">
                <div className="flex items-center gap-1">
                  <Languages className="h-4 w-4" />
                  <SelectValue placeholder="Lang" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sq">Shqip</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>

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
                    onClick={() => navigate(getLocalizedNavPath("/account"))}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t.nav.profile}
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

                {navItems.map((item) => {
                  const localizedPath = getLocalizedNavPath(item.path);
                  const isActive =
                    location.pathname === localizedPath ||
                    (item.path !== "/" && location.pathname.startsWith(localizedPath));

                  return (
                    <Link
                      key={item.path}
                      to={localizedPath}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "group relative flex w-full items-center justify-start overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-lg font-medium text-foreground/90 transition-all duration-300 ease-out",
                        "bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl",
                        "hover:border-white/30 hover:bg-white/15 hover:text-foreground hover:brightness-125 hover:scale-[1.01]",
                        "transform-gpu",
                        "before:pointer-events-none before:absolute before:inset-0 before:top-1/2 before:left-1/2 before:h-[220%] before:w-[200%] before:-translate-x-1/2 before:-translate-y-1/2 before:scale-95 before:rounded-[32px] before:bg-[radial-gradient(48%_48%_at_50%_50%,hsla(0,0%,100%,0.4),hsla(198,100%,50%,0)_70%)] before:opacity-0 before:blur-3xl before:content-[''] before:transition-opacity before:duration-300 before:will-change-[transform,opacity]",
                        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[32px] after:border after:border-white/20 after:opacity-0 after:content-[''] after:transition-opacity after:duration-300",
                        "group-hover:before:opacity-80 group-hover:before:animate-[nav-liquid_900ms_ease-out] group-hover:after:opacity-100",
                        "aria-[current=page]:border-white/40 aria-[current=page]:bg-white/20 aria-[current=page]:text-foreground aria-[current=page]:brightness-125 aria-[current=page]:scale-[1.02] aria-[current=page]:shadow-[0_0_25px_hsla(0,0%,100%,0.18)] aria-[current=page]:after:opacity-100 aria-[current=page]:before:opacity-90"
                      )}
                    >
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  );
                })}

                {/* Language Select mobile */}
                <div className="pt-2">
                  <Select
                    value={language}
                    onValueChange={(val) => {
                      setLanguage(val as "en" | "sq" | "vi");
                      setIsOpen(false);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        <SelectValue placeholder="Language" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sq">Shqip</SelectItem>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {user ? (
                  <div className="border-t pt-4 space-y-3">
                    <p className="px-2 text-sm text-muted-foreground">{user.email}</p>
                    <Link
                      to={getLocalizedNavPath("/account")}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button className="w-full" variant="secondary">
                        {t.nav.profile}
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
