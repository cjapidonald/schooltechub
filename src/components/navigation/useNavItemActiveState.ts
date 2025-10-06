import { useCallback } from "react";
import { useLocation } from "react-router-dom";

interface NavItemActiveStateInput {
  itemPath: string;
  localizedPath: string;
  currentPathname: string;
  currentSearch?: string;
}

export const isNavItemActive = ({
  itemPath,
  localizedPath,
  currentPathname,
  currentSearch = "",
}: NavItemActiveStateInput): boolean => {
  const [targetPath, queryString] = localizedPath.split("?");

  const matchesPath =
    currentPathname === targetPath ||
    (itemPath !== "/" && Boolean(targetPath) && currentPathname.startsWith(targetPath));

  const targetParams = new URLSearchParams(queryString ?? "");
  const currentParams = new URLSearchParams(currentSearch);

  const matchesQuery =
    targetParams.toString().length === 0 ||
    Array.from(targetParams.entries()).every(([key, value]) => currentParams.get(key) === value);

  return matchesPath && matchesQuery;
};

export const useNavItemActiveState = () => {
  const location = useLocation();

  return useCallback(
    (itemPath: string, localizedPath: string) =>
      isNavItemActive({
        itemPath,
        localizedPath,
        currentPathname: location.pathname,
        currentSearch: location.search,
      }),
    [location.pathname, location.search]
  );
};

export default useNavItemActiveState;
