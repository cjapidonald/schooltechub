import { Menu } from "lucide-react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { adminNavigation, getAdminPageMeta, type AdminPageMeta } from "./config";

export interface AdminOutletContext {
  meta: AdminPageMeta;
}

export default function AdminLayout() {
  const location = useLocation();
  const guardState = useAdminGuard(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = useMemo(() => getAdminPageMeta(location.pathname), [location.pathname]);

  if (guardState === "checking") {
    return <AdminGuardSkeleton />;
  }

  if (guardState === "forbidden") {
    return <AdminForbidden />;
  }

  if (guardState === "error") {
    return <AdminGuardError />;
  }

  if (!meta) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="relative hidden w-64 shrink-0 border-r bg-background/70 px-4 py-6 md:flex md:flex-col">
        <AdminSidebar />
      </aside>

      <div className="flex w-full flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="mr-2 h-4 w-4" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="h-full overflow-y-auto px-4 py-6">
                  <AdminSidebar onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <AdminBreadcrumbs meta={meta} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <Outlet context={{ meta }} />
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-1 px-3">
        <h2 className="text-lg font-semibold tracking-tight">Admin Console</h2>
        <p className="text-sm text-muted-foreground">Operational tools for SchoolTech Hub</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pb-6">
        {adminNavigation.map((group, index) => (
          <div key={index} className="space-y-2">
            {group.label && (
              <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">{group.label}</p>
            )}
            <div className="space-y-1">
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                  onClick={onNavigate}
                >
                  {item.title}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

function AdminBreadcrumbs({ meta }: { meta: AdminPageMeta }) {
  const crumbs = useMemo(() => {
    const items: Array<{ label: string; href?: string; current?: boolean }> = [
      { label: "Admin", href: "/admin" },
    ];

    if (meta.groupLabel) {
      items.push({ label: meta.groupLabel });
    }

    items.push({ label: meta.title, current: true });

    return items;
  }, [meta.groupLabel, meta.title]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : crumb.current ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <span className="text-sm text-muted-foreground">{crumb.label}</span>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function AdminGuardSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md border-dashed">
        <CardHeader className="space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <CardTitle className="text-xl">Checking permissions</CardTitle>
          <p className="text-sm text-muted-foreground">Verifying your admin access…</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

function AdminForbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl">Admin access required</CardTitle>
          <p className="text-sm text-muted-foreground">
            You need to be signed in with an administrator account to open the console.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminGuardError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl">Unable to verify access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Something went wrong while confirming your administrator status. Please try again.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={() => window.location.reload()}>Retry</Button>
          <Button asChild variant="outline">
            <Link to="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
