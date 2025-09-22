import { useOutletContext } from "react-router-dom";

import type { AdminOutletContext } from "./AdminLayout";
import { AdminDashboardSkeleton, AdminSectionSkeleton } from "./components/AdminSkeletons";
import AdminPostsPage from "./content/AdminPostsPage";
import AdminResourcesPage from "./content/AdminResourcesPage";
import AdminAuditLogPage from "./system/AdminAuditLogPage";

const PAGE_COMPONENTS: Record<string, () => JSX.Element> = {
  "content/posts": AdminPostsPage,
  "content/resources": AdminResourcesPage,
  "system/audit-log": AdminAuditLogPage,
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
