import { useOutletContext } from "react-router-dom";

import type { AdminOutletContext } from "./AdminLayout";
import { AdminDashboardSkeleton, AdminSectionSkeleton } from "./components/AdminSkeletons";
import AdminPostsPage from "./content/AdminPostsPage";
import AdminResourcesPage from "./content/AdminResourcesPage";
import AdminUserDirectoryPage from "./users/AdminUserDirectoryPage";
import AdminUserInvitationsPage from "./users/AdminUserInvitationsPage";
import AdminUserRolesPage from "./users/AdminUserRolesPage";

const PAGE_COMPONENTS: Record<string, () => JSX.Element> = {
  "content/posts": AdminPostsPage,
  "content/resources": AdminResourcesPage,
  "users/directory": AdminUserDirectoryPage,
  "users/invitations": AdminUserInvitationsPage,
  "users/roles": AdminUserRolesPage,
};

export default function AdminPage() {
  const { meta } = useOutletContext<AdminOutletContext>();

  const Component = meta.slug ? PAGE_COMPONENTS[meta.slug] : undefined;

  if (Component) {
    return <Component />;
  }

  if (meta.variant === "dashboard") {
    return <AdminDashboardSkeleton title={meta.title} description={meta.description} />;
  }

  return <AdminSectionSkeleton title={meta.title} description={meta.description} />;
}
