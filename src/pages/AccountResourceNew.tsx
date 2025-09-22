import { Navigate, useNavigate } from "react-router-dom";

import { SEO } from "@/components/SEO";
import { AccountResourceForm } from "@/components/account/resources/AccountResourceForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const AccountResourceNew = () => {
  const { user, loading } = useRequireAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container space-y-6 py-10">
        <div className="grid gap-4">
          <div className="h-12 animate-pulse rounded-md bg-muted" />
          <div className="h-[420px] animate-pulse rounded-md bg-muted" />
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
        title={t.account.resources.new.seo.title}
        description={t.account.resources.new.seo.description}
        canonicalUrl={t.account.resources.new.seo.canonical}
      />
      <div className="container space-y-6 py-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.account.resources.new.heading}</h1>
          <p className="text-muted-foreground">{t.account.resources.new.subheading}</p>
        </div>
        <AccountResourceForm
          userId={user.id}
          onSuccess={(resource) => {
            navigate(getLocalizedPath(`/account/resources/${resource.id}`, language));
          }}
        />
      </div>
    </div>
  );
};

export default AccountResourceNew;
