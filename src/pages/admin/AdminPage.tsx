import { useOutletContext } from "react-router-dom";

import type { AdminOutletContext } from "./AdminLayout";
import { AdminDashboardSkeleton, AdminSectionSkeleton } from "./components/AdminSkeletons";
import AdminPostsPage from "./content/AdminPostsPage";
import AdminResourcesPage from "./content/AdminResourcesPage";
import AdminDashboardPage from "./dashboard/AdminDashboardPage";

const PAGE_COMPONENTS: Record<string, () => JSX.Element> = {
  "": AdminDashboardPage,
  "content/posts": AdminPostsPage,
  "content/resources": AdminResourcesPage,
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
