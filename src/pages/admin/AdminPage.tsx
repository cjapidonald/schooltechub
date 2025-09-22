import { useOutletContext } from "react-router-dom";

import type { AdminOutletContext } from "./AdminLayout";
import { AdminDashboardSkeleton, AdminSectionSkeleton } from "./components/AdminSkeletons";

export default function AdminPage() {
  const { meta } = useOutletContext<AdminOutletContext>();

  if (meta.variant === "dashboard") {
    return <AdminDashboardSkeleton title={meta.title} description={meta.description} />;
  }

  return <AdminSectionSkeleton title={meta.title} description={meta.description} />;
}
