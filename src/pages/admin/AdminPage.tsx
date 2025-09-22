import { useOutletContext } from "react-router-dom";

import type { AdminOutletContext } from "./AdminLayout";
import { AdminDashboardSkeleton, AdminSectionSkeleton } from "./components/AdminSkeletons";
import AdminPostsPage from "./content/AdminPostsPage";
import AdminResourcesPage from "./content/AdminResourcesPage";
import AdminResearchProjectsPage from "./research/AdminResearchProjectsPage";
import AdminResearchDocumentsPage from "./research/AdminResearchDocumentsPage";
import AdminResearchParticipantsPage from "./research/AdminResearchParticipantsPage";
import AdminResearchSubmissionsPage from "./research/AdminResearchSubmissionsPage";
import AdminUserDirectoryPage from "./users/AdminUserDirectoryPage";
import AdminUserInvitationsPage from "./users/AdminUserInvitationsPage";
import AdminUserRolesPage from "./users/AdminUserRolesPage";
import AdminAuditLogPage from "./system/AdminAuditLogPage";
import AdminDashboardPage from "./dashboard/AdminDashboardPage";

const PAGE_COMPONENTS: Record<string, () => JSX.Element> = {
  "": AdminDashboardPage,
  "content/posts": AdminPostsPage,
  "content/resources": AdminResourcesPage,
  "research/projects": AdminResearchProjectsPage,
  "research/documents": AdminResearchDocumentsPage,
  "research/participants": AdminResearchParticipantsPage,
  "research/submissions": AdminResearchSubmissionsPage,
  "users/directory": AdminUserDirectoryPage,
  "users/invitations": AdminUserInvitationsPage,
  "users/roles": AdminUserRolesPage,
  "system/audit-log": AdminAuditLogPage,
};

export default function AdminPage() {
  const { meta } = useOutletContext<AdminOutletContext>();

  const slugKey = meta.slug ?? "";
  const Component = PAGE_COMPONENTS[slugKey];

  if (Component) {
    return <Component />;
  }

  if (meta.variant === "dashboard") {
    return <AdminDashboardSkeleton title={meta.title} description={meta.description} />;
  }

  return <AdminSectionSkeleton title={meta.title} description={meta.description} />;
}
