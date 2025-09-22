import { Fragment, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ADMIN_NAVIGATION, ADMIN_ROUTE_META } from "../constants/routes";

const normalizePath = (pathname: string) => {
  if (!pathname) return "/admin";
  if (pathname === "/") return "/admin";
  return pathname.endsWith("/") && pathname !== "/admin" ? pathname.slice(0, -1) : pathname;
};

export const AdminLayout = () => {
  const location = useLocation();
  const pathname = normalizePath(location.pathname || "/admin");

  const breadcrumbs = useMemo(() => {
    const crumbs: { href: string; title: string }[] = [];
    let current = pathname;
    const visited = new Set<string>();

    while (current) {
      const meta = ADMIN_ROUTE_META[current];
      if (!meta || visited.has(current)) {
        break;
      }

      crumbs.push({ href: current, title: meta.title });
      visited.add(current);
      current = meta.parent ?? "";
    }

    if (crumbs.length === 0) {
      crumbs.push({ href: "/admin", title: ADMIN_ROUTE_META["/admin"].title });
    }

    return crumbs.reverse();
  }, [pathname]);

  const isGroupActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isItemActive = (href: string) => pathname === href;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link to="/admin" className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold">
            <span>SchoolTech Hub</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAVIGATION.map((group) => (
                  <SidebarMenuItem key={group.href}>
                    <SidebarMenuButton asChild isActive={isGroupActive(group.href)}>
                      <Link to={group.href} className="flex items-center gap-2">
                        <group.icon className="size-4" />
                        <span>{group.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {group.items && (
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={isItemActive(item.href)}>
                              <Link to={item.href}>{item.label}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button asChild variant="outline" size="sm">
            <Link to="/">Return to site</Link>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {index < breadcrumbs.length - 1 ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.title}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 bg-muted/10 p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
