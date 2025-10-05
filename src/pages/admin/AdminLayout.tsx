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
import { clearPrototypeAdminSession, useAdminGuard } from "@/hooks/useAdminGuard";
import { adminNavigation, getAdminPageMeta, type AdminPageMeta } from "./config";
import AdminLoginPrototype from "./AdminLoginPrototype";

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
    return <AdminLoginPrototype />;
  }

  if (guardState === "error") {
    return <AdminGuardError />;
  }

  if (!meta) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-16 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-96 w-[28rem] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen gap-6 px-4 py-8 md:px-8">
        <aside className="hidden w-72 shrink-0 md:block">
          <div className="sticky top-8 flex h-[calc(100vh-4rem)] flex-col justify-between rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-900/20 backdrop-blur-xl">
            <AdminSidebar />
            <button
              type="button"
              onClick={() => {
                clearPrototypeAdminSession();
                if (typeof window !== "undefined") {
                  window.location.assign("/admin/login");
                }
              }}
              className="group mt-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:bg-white/20 hover:text-white"
            >
              Reset Prototype Session
            </button>
          </div>
        </aside>

        <div className="flex w-full flex-col">
          <header className="sticky top-4 z-20 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center justify-between gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20 md:hidden"
                  >
                    <Menu className="mr-2 h-4 w-4" />
                    Menu
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 border-white/10 bg-slate-950/80 p-0 text-white backdrop-blur-xl">
                  <div className="h-full overflow-y-auto px-4 py-6">
                    <AdminSidebar onNavigate={() => setMobileOpen(false)} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-6 w-full justify-center border border-white/10 bg-white/10 text-xs uppercase tracking-wide text-white/70 hover:border-white/30 hover:bg-white/20"
                      onClick={() => {
                        clearPrototypeAdminSession();
                        if (typeof window !== "undefined") {
                          window.location.assign("/admin/login");
                        }
                      }}
                    >
                      Reset Prototype Session
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex flex-1 items-center justify-end gap-3 text-right">
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">Admin Console</span>
              </div>
            </div>
            <AdminBreadcrumbs meta={meta} />
          </header>

          <main className="relative mt-6 flex-1">
            <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-2xl" />
            <div className="relative h-full overflow-y-auto rounded-[2.5rem] px-4 py-8 md:px-10">
              <Outlet context={{ meta }} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 text-white">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">SchoolTech Hub</p>
        <h2 className="text-2xl font-semibold tracking-tight">Command Console</h2>
        <p className="text-sm text-white/60">Glassmorphism-inspired workspace for the refreshed platform.</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pb-6 pr-2">
        {adminNavigation.map((group, index) => (
          <div key={index} className="space-y-2">
            {group.label && (
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">{group.label}</p>
            )}
            <div className="space-y-1">
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg shadow-sky-500/20"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`
                  }
                  onClick={onNavigate}
                >
                  <span>{item.title}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">View</span>
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
          <div key={index} className="flex items-center text-white">
            {index > 0 && <BreadcrumbSeparator className="text-white/50" />}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href} className="text-white/70 hover:text-white">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : crumb.current ? (
                <BreadcrumbPage className="text-white">{crumb.label}</BreadcrumbPage>
              ) : (
                <span className="text-sm text-white/60">{crumb.label}</span>
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-white/10 bg-white/10 text-white backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full bg-white/20" />
          <CardTitle className="text-xl">Calibrating access</CardTitle>
          <p className="text-sm text-white/60">We&apos;re validating your admin preview permissions…</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-3 w-full bg-white/20" />
          <Skeleton className="h-3 w-5/6 bg-white/10" />
          <Skeleton className="h-3 w-2/3 bg-white/5" />
        </CardContent>
      </Card>
    </div>
  );
}

function AdminGuardError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-white/10 bg-white/10 text-white backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl">Unable to verify access</CardTitle>
          <p className="text-sm text-white/60">
            Something went wrong while confirming your administrator status. Please try again.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="bg-white text-slate-900 hover:bg-slate-100"
          >
            Retry
          </Button>
          <Button asChild variant="outline" className="border-white/30 text-white hover:border-white/40 hover:bg-white/10">
            <Link to="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
