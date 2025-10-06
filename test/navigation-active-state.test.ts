import { describe, expect, it } from "vitest";
import { resolveNavItemActiveState } from "@/components/navigation/useNavItemActiveState";
import type { NavItem } from "@/components/navigation/types";

describe("resolveNavItemActiveState", () => {
  const getLocalizedNavPath = (path: string) => {
    if (path === "/events") {
      return `/es${path}?category=featured`;
    }

    return `/es${path}`;
  };

  it("returns active state when path and query parameters match", () => {
    const item: NavItem = { name: "Events", path: "/events" };

    const result = resolveNavItemActiveState(
      item,
      { pathname: "/es/events", search: "?category=featured" },
      getLocalizedNavPath
    );

    expect(result.localizedPath).toBe("/es/events?category=featured");
    expect(result.isActive).toBe(true);
  });

  it("returns inactive state when query parameters do not match", () => {
    const item: NavItem = { name: "Events", path: "/events" };

    const result = resolveNavItemActiveState(
      item,
      { pathname: "/es/events", search: "?category=webinar" },
      getLocalizedNavPath
    );

    expect(result.isActive).toBe(false);
  });

  it("treats nested localized paths as active when they start with the target path", () => {
    const item: NavItem = { name: "Services", path: "/services" };

    const result = resolveNavItemActiveState(
      item,
      { pathname: "/es/services/design", search: "" },
      getLocalizedNavPath
    );

    expect(result.localizedPath).toBe("/es/services");
    expect(result.isActive).toBe(true);
  });
});
