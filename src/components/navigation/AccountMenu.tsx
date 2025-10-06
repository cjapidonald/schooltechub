import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { SupabaseUser } from "@supabase/supabase-js";

type AccountMenuProps = {
  user: SupabaseUser | null;
  authPath: string;
  authLabel: string;
  myProfileLabel: string;
  signOutLabel: string;
  onSignOut: () => void | Promise<void>;
  onNavigateToProfile: () => void;
};

const AccountMenu = ({
  user,
  authPath,
  authLabel,
  myProfileLabel,
  signOutLabel,
  onSignOut,
  onNavigateToProfile,
}: AccountMenuProps) => {
  if (!user) {
    return (
      <Button asChild className="whitespace-nowrap">
        <Link to={authPath}>{authLabel}</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" onClick={onNavigateToProfile}>
        {myProfileLabel}
      </Button>
      <Button variant="outline" onClick={onSignOut} className="flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        {signOutLabel}
      </Button>
    </div>
  );
};

export default AccountMenu;
