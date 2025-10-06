import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AuthRole } from "@/components/auth/RoleAuthDialog";
import useNavItemActiveState from "./useNavItemActiveState";
import type { NavItem } from "./types";

type DesktopNavLinksProps = {
  items: NavItem[];
  getLocalizedNavPath: (path: string) => string;
  onAuthRoleSelect: (role: AuthRole) => void;
  isAuthDialogOpen: boolean;
};

const DesktopNavLinks = ({
  items,
  getLocalizedNavPath,
  onAuthRoleSelect,
  isAuthDialogOpen,
}: DesktopNavLinksProps) => {
  const getNavItemState = useNavItemActiveState(getLocalizedNavPath);

  return (
    <div className="hidden lg:flex items-center gap-1 xl:gap-2">
      {items.map(item => {
        const localizedItem = getNavItemState(item);

        if (localizedItem.type === "teacher-auth" || localizedItem.type === "student-auth") {
          return (
            <button
              key={localizedItem.path}
              type="button"
              onClick={() =>
                onAuthRoleSelect(localizedItem.type === "student-auth" ? "student" : "teacher")
              }
              aria-current={localizedItem.isActive ? "page" : undefined}
              aria-haspopup="dialog"
              aria-expanded={isAuthDialogOpen}
              aria-controls="role-auth-dialog"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                "border border-transparent hover:border-white/40 hover:bg-white/20 hover:text-foreground hover:backdrop-blur-sm",
                "text-muted-foreground"
              )}
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
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
              "border border-transparent hover:border-white/40 hover:bg-white/20 hover:text-foreground hover:backdrop-blur-sm",
              "text-muted-foreground"
            )}
          >
            {localizedItem.name}
          </Link>
        );
      })}
    </div>
  );
};

export default DesktopNavLinks;
