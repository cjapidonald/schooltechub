import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AuthRole } from "@/components/auth/RoleAuthDialog";
import type { LocalizedNavItem } from "./types";

type DesktopNavLinksProps = {
  items: LocalizedNavItem[];
  onAuthRoleSelect: (role: AuthRole) => void;
  isAuthDialogOpen: boolean;
};

const DesktopNavLinks = ({ items, onAuthRoleSelect, isAuthDialogOpen }: DesktopNavLinksProps) => {
  return (
    <div className="hidden lg:flex items-center gap-1 xl:gap-2">
      {items.map(item => {
        if (item.type === "teacher-auth" || item.type === "student-auth") {
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onAuthRoleSelect(item.type === "student-auth" ? "student" : "teacher")}
              aria-current={item.isActive ? "page" : undefined}
              aria-haspopup="dialog"
              aria-expanded={isAuthDialogOpen}
              aria-controls="role-auth-dialog"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                "border border-transparent hover:border-white/40 hover:bg-white/20 hover:text-foreground hover:backdrop-blur-sm",
                "text-muted-foreground"
              )}
            >
              {item.name}
            </button>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.localizedPath}
            aria-current={item.isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
              "border border-transparent hover:border-white/40 hover:bg-white/20 hover:text-foreground hover:backdrop-blur-sm",
              "text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
};

export default DesktopNavLinks;
