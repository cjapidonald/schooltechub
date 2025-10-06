import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import type { SupabaseUser } from "@supabase/supabase-js";
import type { AuthRole } from "@/components/auth/RoleAuthDialog";
import useNavItemActiveState from "./useNavItemActiveState";
import type { NavItem } from "./types";

export type MobileNavSheetProps = {
  items: NavItem[];
  getLocalizedNavPath: (path: string) => string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthRoleSelect: (role: AuthRole) => void;
  isAuthDialogOpen: boolean;
  user: SupabaseUser | null;
  authPath: string;
  profilePath: string;
  authLabel: string;
  myProfileLabel: string;
  signOutLabel: string;
  onSignOut: () => Promise<void> | void;
};

const MobileNavSheet = ({
  items,
  getLocalizedNavPath,
  isOpen,
  onOpenChange,
  onAuthRoleSelect,
  isAuthDialogOpen,
  user,
  authPath,
  profilePath,
  authLabel,
  myProfileLabel,
  signOutLabel,
  onSignOut,
}: MobileNavSheetProps) => {
  const handleClose = () => onOpenChange(false);
  const getNavItemState = useNavItemActiveState(getLocalizedNavPath);

  const handleSignOut = async () => {
    await onSignOut();
    handleClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[380px]">
        <div className="mt-8 flex flex-col space-y-4">
          {items.map(item => {
            const localizedItem = getNavItemState(item);

            if (localizedItem.type === "teacher-auth" || localizedItem.type === "student-auth") {
              return (
                <button
                  key={localizedItem.path}
                  type="button"
                  onClick={() => {
                    onAuthRoleSelect(localizedItem.type === "student-auth" ? "student" : "teacher");
                    handleClose();
                  }}
                  aria-current={localizedItem.isActive ? "page" : undefined}
                  aria-haspopup="dialog"
                  aria-expanded={isAuthDialogOpen}
                  aria-controls="role-auth-dialog"
                  className="py-2 text-left text-lg font-medium transition-colors text-muted-foreground hover:text-primary"
                >
                  {localizedItem.name}
                </button>
              );
            }

            return (
              <Link
                key={localizedItem.path}
                to={localizedItem.localizedPath}
                aria-current={localizedItem.isActive ? "page" : undefined}
                onClick={handleClose}
                className="py-2 text-lg font-medium transition-colors text-muted-foreground hover:text-primary"
              >
                {localizedItem.name}
              </Link>
            );
          })}

          {user ? (
            <div className="border-t pt-4 space-y-3">
              <p className="px-2 text-sm text-muted-foreground">{user.email}</p>
              <Link to={profilePath} onClick={handleClose}>
                <Button className="w-full" variant="secondary">
                  {myProfileLabel}
                </Button>
              </Link>
              <Button onClick={handleSignOut} className="w-full" variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                {signOutLabel}
              </Button>
            </div>
          ) : (
            <Link to={authPath} onClick={handleClose}>
              <Button className="w-full">{authLabel}</Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavSheet;
