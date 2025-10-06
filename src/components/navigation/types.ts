export type NavItemType = "link" | "teacher-auth" | "student-auth";

export type NavItem = {
  name: string;
  path: string;
  type?: NavItemType;
};

export type LocalizedNavItem = NavItem & {
  localizedPath: string;
  isActive: boolean;
};
