import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./useNavItemActiveState";

describe("isNavItemActive", () => {
  it("matches localized routes without query parameters", () => {
    const result = isNavItemActive({
      itemPath: "/blog",
      localizedPath: "/en/blog",
      currentPathname: "/en/blog",
      currentSearch: "",
    });

    expect(result).toBe(true);
  });

  it("matches when query parameters align", () => {
    const result = isNavItemActive({
      itemPath: "/events",
      localizedPath: "/en/events?type=upcoming",
      currentPathname: "/en/events",
      currentSearch: "?type=upcoming",
    });

    expect(result).toBe(true);
  });

  it("does not match when query parameters differ", () => {
    const result = isNavItemActive({
      itemPath: "/events",
      localizedPath: "/en/events?type=past",
      currentPathname: "/en/events",
      currentSearch: "?type=upcoming",
    });

    expect(result).toBe(false);
  });

  it("does not treat the home link as active for nested routes", () => {
    const result = isNavItemActive({
      itemPath: "/",
      localizedPath: "/en",
      currentPathname: "/en/about",
      currentSearch: "",
    });

    expect(result).toBe(false);
  });
});
