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
        title: "Dashboard",
        path: "/admin",
        slug: "",
        description: "Monitor platform health, stats, and the latest approvals in one place.",
        variant: "dashboard",
      },
    ],
  },
  {
    label: "Moderation",
    items: [
      {
        title: "Resources",
        path: "/admin/moderation/resources",
        slug: "moderation/resources",
        description: "Review resource submissions awaiting approval.",
      },
      {
        title: "Blogposts",
        path: "/admin/moderation/blogposts",
        slug: "moderation/blogposts",
        description: "Approve or reject drafted blogposts before they go live.",
      },
      {
        title: "Research Applications",
        path: "/admin/moderation/research-applications",
        slug: "moderation/research-applications",
        description: "Triage research study requests and coordinate reviewer feedback.",
      },
      {
        title: "Comments (stub)",
        path: "/admin/moderation/comments",
        slug: "moderation/comments",
        description: "Centralise comment moderation with a forthcoming workflow.",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Posts",
        path: "/admin/content/posts",
        slug: "content/posts",
        description: "Plan and manage editorial posts across the site.",
      },
      {
        title: "Resources",
        path: "/admin/content/resources",
        slug: "content/resources",
        description: "Curate approved resources and update catalogue metadata.",
      },
    ],
  },
  {
    label: "Users",
    items: [
      {
        title: "Directory",
        path: "/admin/users/directory",
        slug: "users/directory",
        description: "Audit accounts, access levels, and sign-in activity.",
      },
      {
        title: "Invitations",
        path: "/admin/users/invitations",
        slug: "users/invitations",
        description: "Track outstanding invitations and reminders for collaborators.",
      },
      {
        title: "Roles (Admins)",
        path: "/admin/users/roles",
        slug: "users/roles",
        description: "Grant or revoke administrative roles across the organisation.",
      },
    ],
  },
  {
    label: "Research",
    items: [
      {
        title: "Projects",
        path: "/admin/research/projects",
        slug: "research/projects",
        description: "Coordinate active research projects and milestones.",
      },
      {
        title: "Documents",
        path: "/admin/research/documents",
        slug: "research/documents",
        description: "Organise research documentation, consent forms, and templates.",
      },
      {
        title: "Participants",
        path: "/admin/research/participants",
        slug: "research/participants",
        description: "Manage participant rosters, consent, and communication.",
      },
      {
        title: "Submissions",
        path: "/admin/research/submissions",
        slug: "research/submissions",
        description: "Review submitted findings, datasets, and supporting evidence.",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Notifications",
        path: "/admin/system/notifications",
        slug: "system/notifications",
        description: "Broadcast updates and manage delivery schedules.",
      },
      {
        title: "Audit Log",
        path: "/admin/system/audit-log",
        slug: "system/audit-log",
        description: "Inspect sensitive changes recorded across the platform.",
      },
      {
        title: "Settings",
        path: "/admin/system/settings",
        slug: "system/settings",
        description: "Adjust platform-wide configuration and integration keys.",
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
