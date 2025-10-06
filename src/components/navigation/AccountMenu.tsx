import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IdCard, LogOut, User } from "lucide-react";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">My account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="text-sm text-muted-foreground">{user.email}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNavigateToProfile}>
          <IdCard className="mr-2 h-4 w-4" />
          {myProfileLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {signOutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
