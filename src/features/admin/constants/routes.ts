import type { LucideIcon } from "lucide-react";
import {
  FileText,
  FlaskConical,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Waypoints,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
}

export interface AdminNavGroup {
  label: string;
  href: string;
  icon: LucideIcon;
  items?: AdminNavItem[];
}

export interface AdminRouteMeta {
  title: string;
  description: string;
  parent?: string;
}

export const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Moderation",
    href: "/admin/moderation",
    icon: ShieldCheck,
    items: [
      { label: "Resources", href: "/admin/moderation/resources" },
      { label: "Blogposts", href: "/admin/moderation/blogposts" },
      { label: "Research Applications", href: "/admin/moderation/research-applications" },
      { label: "Comments", href: "/admin/moderation/comments" },
    ],
  },
  {
    label: "Content",
    href: "/admin/content",
    icon: FileText,
    items: [
      { label: "Posts", href: "/admin/content/posts" },
      { label: "Resources", href: "/admin/content/resources" },
    ],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    items: [
      { label: "Directory", href: "/admin/users/directory" },
      { label: "Invitations", href: "/admin/users/invitations" },
      { label: "Roles (Admins)", href: "/admin/users/roles" },
    ],
  },
  {
    label: "Research",
    href: "/admin/research",
    icon: FlaskConical,
    items: [
      { label: "Projects", href: "/admin/research/projects" },
      { label: "Documents", href: "/admin/research/documents" },
      { label: "Participants", href: "/admin/research/participants" },
      { label: "Submissions", href: "/admin/research/submissions" },
    ],
  },
  {
    label: "System",
    href: "/admin/system",
    icon: Waypoints,
    items: [
      { label: "Notifications", href: "/admin/system/notifications" },
      { label: "Audit Log", href: "/admin/system/audit-log" },
      { label: "Settings", href: "/admin/system/settings" },
    ],
  },
];

export const ADMIN_ROUTE_META: Record<string, AdminRouteMeta> = {
  "/admin": {
    title: "Dashboard",
    description: "Track high-level program metrics and see the most recent approvals awaiting follow-up.",
  },
  "/admin/moderation": {
    title: "Moderation",
    description: "Review queues across content types that require human approval.",
    parent: "/admin",
  },
  "/admin/moderation/resources": {
    title: "Resource Moderation",
    description: "Pending teaching resources awaiting review before publication.",
    parent: "/admin/moderation",
  },
  "/admin/moderation/blogposts": {
    title: "Blogpost Moderation",
    description: "Draft and submitted blog content to approve or reject.",
    parent: "/admin/moderation",
  },
  "/admin/moderation/research-applications": {
    title: "Research Applications",
    description: "Incoming research study applications and institutional approvals.",
    parent: "/admin/moderation",
  },
  "/admin/moderation/comments": {
    title: "Comment Moderation",
    description: "Community discussion that needs moderation attention.",
    parent: "/admin/moderation",
  },
  "/admin/content": {
    title: "Content",
    description: "Published and scheduled editorial content.",
    parent: "/admin",
  },
  "/admin/content/posts": {
    title: "Posts",
    description: "Manage published articles, announcements, and updates.",
    parent: "/admin/content",
  },
  "/admin/content/resources": {
    title: "Resource Library",
    description: "Catalog of instructional resources available to educators.",
    parent: "/admin/content",
  },
  "/admin/users": {
    title: "Users",
    description: "Administrative controls for user accounts and permissions.",
    parent: "/admin",
  },
  "/admin/users/directory": {
    title: "User Directory",
    description: "Search and audit the full directory of registered users.",
    parent: "/admin/users",
  },
  "/admin/users/invitations": {
    title: "Invitations",
    description: "Track outstanding invitations and resend as needed.",
    parent: "/admin/users",
  },
  "/admin/users/roles": {
    title: "Roles & Admins",
    description: "Grant and revoke elevated administrative access.",
    parent: "/admin/users",
  },
  "/admin/research": {
    title: "Research",
    description: "Oversight for partner research initiatives.",
    parent: "/admin",
  },
  "/admin/research/projects": {
    title: "Research Projects",
    description: "Active and proposed research collaborations.",
    parent: "/admin/research",
  },
  "/admin/research/documents": {
    title: "Research Documents",
    description: "Protocols, consent forms, and related documentation.",
    parent: "/admin/research",
  },
  "/admin/research/participants": {
    title: "Research Participants",
    description: "Roster of participant cohorts and recruitment status.",
    parent: "/admin/research",
  },
  "/admin/research/submissions": {
    title: "Research Submissions",
    description: "Recent submissions awaiting review or archiving.",
    parent: "/admin/research",
  },
  "/admin/system": {
    title: "System",
    description: "Operational tooling for platform health.",
    parent: "/admin",
  },
  "/admin/system/notifications": {
    title: "System Notifications",
    description: "Outgoing messages and delivery health.",
    parent: "/admin/system",
  },
  "/admin/system/audit-log": {
    title: "Audit Log",
    description: "Immutable log of administrator actions.",
    parent: "/admin/system",
  },
  "/admin/system/settings": {
    title: "Admin Settings",
    description: "Configuration for administrative preferences and feature flags.",
    parent: "/admin/system",
  },
};
