import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import type { LocalizedNavItem, NavItem } from "./types";

type GetLocalizedPath = (path: string) => string;
type LocationLike = { pathname: string; search: string };

export const resolveNavItemActiveState = (
  item: NavItem,
  location: LocationLike,
  getLocalizedNavPath: GetLocalizedPath
): LocalizedNavItem => {
  const localizedPath = getLocalizedNavPath(item.path);
  const [targetPath, queryString] = localizedPath.split("?");
  const matchesPath =
    location.pathname === targetPath ||
    (item.path !== "/" && targetPath && location.pathname.startsWith(targetPath));

  const targetParams = new URLSearchParams(queryString ?? "");
  const currentParams = new URLSearchParams(location.search);
  const matchesQuery =
    targetParams.toString().length === 0 ||
    Array.from(targetParams.entries()).every(
      ([key, value]) => currentParams.get(key) === value
    );

  return {
    ...item,
    localizedPath,
    isActive: matchesPath && matchesQuery,
  };
};

export const useNavItemActiveState = (getLocalizedNavPath: GetLocalizedPath) => {
  const location = useLocation();

  return useCallback(
    (item: NavItem) =>
      resolveNavItemActiveState(item, location, getLocalizedNavPath),
    [getLocalizedNavPath, location.pathname, location.search]
  );
};

export default useNavItemActiveState;
