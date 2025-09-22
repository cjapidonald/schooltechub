import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { SEO } from "@/components/SEO";
import { AccountResourceForm } from "@/components/account/resources/AccountResourceForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { getResource } from "@/lib/resources-api";
import { Skeleton } from "@/components/ui/skeleton";

const AccountResourceEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useRequireAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const resourceQuery = useQuery({
    queryKey: ["account-resource", user?.id, id],
    enabled: Boolean(user?.id && id),
    queryFn: async () => {
      if (!user?.id || !id) return null;
      return await getResource(id, user.id);
    },
  });

  if (loading || resourceQuery.isLoading) {
    return (
      <div className="container space-y-6 py-10">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={getLocalizedPath("/auth", language)} replace />;
  }

  if (!id) {
    return <Navigate to={getLocalizedPath("/account/resources", language)} replace />;
  }

  if (!resourceQuery.data) {
    return <Navigate to={getLocalizedPath("/account/resources", language)} replace />;
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO
        title={t.account.resources.edit.seo.title.replace("{title}", resourceQuery.data.title)}
        description={t.account.resources.edit.seo.description}
        canonicalUrl={t.account.resources.edit.seo.canonical}
      />
      <div className="container space-y-6 py-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.account.resources.edit.heading}</h1>
          <p className="text-muted-foreground">{t.account.resources.edit.subheading}</p>
        </div>
        <AccountResourceForm
          userId={user.id}
          resource={resourceQuery.data}
          onSuccess={(updated) => {
            navigate(getLocalizedPath(`/account/resources/${updated.id}`, language));
          }}
        />
      </div>
    </div>
  );
};

export default AccountResourceEdit;
