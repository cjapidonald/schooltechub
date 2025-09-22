import { describe, expect, it } from "vitest";
import {
  applyLessonPlanFilters,
  buildLessonPlanSearchClause,
  normalizeLessonPlanFilters
} from "../lessonPlanFilters";

describe("normalizeLessonPlanFilters", () => {
  it("converts single values into arrays and trims input", () => {
    const filters = normalizeLessonPlanFilters({
      q: "  robotics  ",
      stage: "Primary",
      subjects: "Math, Science",
      delivery: ["Online", " In-person "],
      tech: "VR"
    });

    expect(filters).toEqual({
      q: "robotics",
      stage: ["Primary"],
      subjects: ["Math", "Science"],
      delivery: ["Online", "In-person"],
      tech: ["VR"]
    });
  });

  it("drops empty filters", () => {
    const filters = normalizeLessonPlanFilters({
      q: " ",
      stage: "",
      subjects: [],
      delivery: undefined,
      tech: undefined
    });

    expect(filters).toEqual({
      q: undefined,
      stage: undefined,
      subjects: undefined,
      delivery: undefined,
      tech: undefined
    });
  });
});

describe("buildLessonPlanSearchClause", () => {
  it("creates an OR clause across searchable fields", () => {
    expect(buildLessonPlanSearchClause("AI tools")).toBe(
      "title.ilike.%AI tools%,summary.ilike.%AI tools%,description.ilike.%AI tools%,content.ilike.%AI tools%"
    );
  });

  it("removes dangerous characters", () => {
    expect(buildLessonPlanSearchClause("%DROP, TABLE%"))
      .toBe("title.ilike.%DROP TABLE%,summary.ilike.%DROP TABLE%,description.ilike.%DROP TABLE%,content.ilike.%DROP TABLE%");
  });
});

describe("applyLessonPlanFilters", () => {
  const createBuilder = () => {
    const calls: Record<string, unknown[]> = {
      or: [],
      in: [],
      overlaps: [],
      contains: []
    };

    const builder: any = {
      or(clause: string) {
        calls.or.push([clause]);
        return builder;
      },
      in(column: string, values: string[]) {
        calls.in.push([column, values]);
        return builder;
      },
      overlaps(column: string, values: string[]) {
        calls.overlaps.push([column, values]);
        return builder;
      },
      contains(column: string, values: string[]) {
        calls.contains.push([column, values]);
        return builder;
      }
    };

    return { builder, calls } as const;
  };

  it("applies all filter types when provided", () => {
    const { builder, calls } = createBuilder();

    applyLessonPlanFilters(builder, {
      q: "robotics",
      stage: ["Upper Primary"],
      subjects: ["Science"],
      delivery: ["Hybrid"],
      tech: ["AR"]
    });

    expect(calls.or).toEqual([
      [
        "title.ilike.%robotics%,summary.ilike.%robotics%,description.ilike.%robotics%,content.ilike.%robotics%"
      ]
    ]);
    expect(calls.in).toEqual([["stage", ["Upper Primary"]]]);
    expect(calls.overlaps).toEqual([
      ["subjects", ["Science"]],
      ["delivery", ["Hybrid"]],
      ["tech", ["AR"]]
    ]);
    expect(calls.contains).toEqual([]);
  });

  it("falls back to contains when overlaps is unavailable", () => {
    const calls: Record<string, unknown[]> = {
      contains: [],
      in: [],
      or: [],
      overlaps: []
    };

    const builder: any = {
      contains(column: string, values: string[]) {
        calls.contains.push([column, values]);
        return builder;
      },
      in(column: string, values: string[]) {
        calls.in.push([column, values]);
        return builder;
      },
      or(clause: string) {
        calls.or.push([clause]);
        return builder;
      }
    };

    applyLessonPlanFilters(builder, {
      q: "coding",
      stage: ["Secondary"],
      subjects: ["Math"],
      delivery: ["Online"],
      tech: ["Chromebooks"]
    });

    expect(calls.contains).toEqual([
      ["subjects", ["Math"]],
      ["delivery", ["Online"]],
      ["tech", ["Chromebooks"]]
    ]);
  });

  it("skips filters when arrays are empty", () => {
    const { builder, calls } = createBuilder();

    applyLessonPlanFilters(builder, {
      q: undefined,
      stage: [],
      subjects: [],
      delivery: undefined,
      tech: []
    });

    expect(calls.or).toHaveLength(0);
    expect(calls.in).toHaveLength(0);
    expect(calls.overlaps).toHaveLength(0);
  });
});
