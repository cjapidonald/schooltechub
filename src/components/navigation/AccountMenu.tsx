import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AccountMenuProps = {
  user: SupabaseUser | null;
  authPath: string;
  authLabel: string;
  signOutLabel: string;
  onSignOut: () => void | Promise<void>;
};

const AccountMenu = ({
  user,
  authPath,
  authLabel,
  signOutLabel,
  onSignOut,
}: AccountMenuProps) => {
  if (!user) {
    return (
      <Button asChild className="whitespace-nowrap">
        <Link to={authPath}>{authLabel}</Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={onSignOut} className="flex items-center gap-2">
      <LogOut className="h-4 w-4" />
      {signOutLabel}
    </Button>
  );
};

export default AccountMenu;
