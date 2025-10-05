export type AdminPageVariant = "dashboard" | "default";

export interface AdminNavItem {
  title: string;
  path: string;
  slug: string;
  description?: string;
  variant?: AdminPageVariant;
}

export interface AdminNavGroup {
  label?: string;
  items: AdminNavItem[];
}

export interface AdminPageMeta extends AdminNavItem {
  groupLabel?: string;
}

export const adminNavigation: AdminNavGroup[] = [
  {
    items: [
      {
        title: "Command Center",
        path: "/admin",
        slug: "",
        description: "Monitor live activity, platform health, and upcoming launches.",
        variant: "dashboard",
      },
    ],
  },
  {
    label: "Content Studio",
    items: [
      {
        title: "Editorial Planner",
        path: "/admin/content/posts",
        slug: "content/posts",
        description: "Plan storytelling for the refreshed SchoolTech Hub site.",
      },
      {
        title: "Learning Library",
        path: "/admin/content/resources",
        slug: "content/resources",
        description: "Curate approved resources and update catalogue metadata.",
      },
    ],
  },
  {
    label: "Community Pulse",
    items: [
      {
        title: "Story Reviews",
        path: "/admin/moderation/blogposts",
        slug: "moderation/blogposts",
        description: "Review community submissions and sign off new stories.",
      },
    ],
  },
  {
    label: "People Ops",
    items: [
      {
        title: "Team Directory",
        path: "/admin/users/directory",
        slug: "users/directory",
        description: "Audit accounts, access levels, and sign-in activity.",
      },
      {
        title: "Invites",
        path: "/admin/users/invitations",
        slug: "users/invitations",
        description: "Track outstanding invitations and reminders for collaborators.",
      },
      {
        title: "Admin Roles",
        path: "/admin/users/roles",
        slug: "users/roles",
        description: "Grant or revoke administrative roles across the organisation.",
      },
    ],
  },
];

const adminPageMeta = new Map<string, AdminPageMeta>();

for (const group of adminNavigation) {
  for (const item of group.items) {
    adminPageMeta.set(item.slug, { ...item, groupLabel: group.label });
  }
}

function normaliseAdminPath(pathname: string): string {
  const withoutPrefix = pathname.startsWith("/admin") ? pathname.slice("/admin".length) : pathname;
  const trimmed = withoutPrefix.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed;
}

export function getAdminPageMeta(pathname: string): AdminPageMeta | undefined {
  const slug = normaliseAdminPath(pathname);
  return adminPageMeta.get(slug);
}
