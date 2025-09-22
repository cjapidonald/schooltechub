import { Navigate } from "react-router-dom";

import { SEO } from "@/components/SEO";
import { AccountResourcesList } from "@/components/account/resources/AccountResourcesList";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const AccountResources = () => {
  const { user, loading } = useRequireAuth();
  const { t, language } = useLanguage();

  if (loading) {
    return (
      <div className="container space-y-6 py-10">
        <div className="grid gap-4">
          <div className="h-12 animate-pulse rounded-md bg-muted" />
          <div className="h-48 animate-pulse rounded-md bg-muted" />
          <div className="h-48 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={getLocalizedPath("/auth", language)} replace />;
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <SEO
        title={t.account.resources.seo.title}
        description={t.account.resources.seo.description}
        canonicalUrl={t.account.resources.seo.canonical}
      />
      <div className="container space-y-8 py-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.account.resources.heading}</h1>
          <p className="text-muted-foreground">{t.account.resources.subheading}</p>
        </div>
        <AccountResourcesList userId={user.id} />
      </div>
    </div>
  );
};

export default AccountResources;
