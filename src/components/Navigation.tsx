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
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to={getLocalizedNavPath("/")} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SchoolTech</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 flex-1 max-w-3xl mx-8">
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={getLocalizedNavPath(item.path)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                  location.pathname === getLocalizedNavPath(item.path) ||
                  (item.path !== "/" && location.pathname.startsWith(getLocalizedNavPath(item.path)))
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 w-48 lg:w-64"
            />
          </form>

          {/* Language Select */}
          <Select
            value={language}
            onValueChange={(val) => {
              setLanguage(val as "en" | "sq" | "vi");
            }}
          >
            <SelectTrigger className="w-28">
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

          {/* Auth Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.nav.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to={getLocalizedNavPath("/auth")}>{t.nav.signUp} / {t.nav.signIn}</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col space-y-4 mt-8">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder={t.common.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 w-full"
                />
              </form>

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-lg font-medium transition-colors hover:text-primary py-2",
                    location.pathname.startsWith(item.path === "/" ? "/home" : item.path)
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}

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
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm text-muted-foreground px-2">{user.email}</p>
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
                <Link to="/auth" onClick={() => setIsOpen(false)} className="mt-4">
                  <Button className="w-full">{t.nav.signUp} / {t.nav.signIn}</Button>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navigation;