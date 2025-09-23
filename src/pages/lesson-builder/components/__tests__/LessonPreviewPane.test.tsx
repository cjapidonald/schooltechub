import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LessonPreviewPane } from "../LessonPreviewPane";
import type { LessonPlanMetaDraft } from "../../types";
import type { MyClassSummary } from "@/hooks/useMyClasses";

const baseMeta: LessonPlanMetaDraft = {
  title: "",
  subject: null,
  classId: null,
  date: null,
  objective: "",
  successCriteria: "",
};

const baseProfile = {
  fullName: null,
  schoolName: null,
  schoolLogoUrl: null,
};

const classes: MyClassSummary[] = [
  { id: "class-1", title: "Algebra I" },
  { id: "class-2", title: "World History" },
];

afterEach(() => {
  vi.useRealTimers();
});

describe("LessonPreviewPane", () => {
  it("hides summary rows when the values are empty", () => {
    render(
      <LessonPreviewPane
        meta={{
          ...baseMeta,
          title: "   ",
          subject: null,
          classId: null,
          date: null,
          objective: "",
          successCriteria: "",
        }}
        profile={{
          ...baseProfile,
          fullName: "   ",
          schoolName: "",
        }}
        classes={classes}
      />
    );

    expect(screen.queryByText("Teacher")).not.toBeInTheDocument();
    expect(screen.queryByText("Class")).not.toBeInTheDocument();

    const today = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
    expect(screen.getByText(today)).toBeInTheDocument();
  });

  it("defaults the displayed date to today when no date is provided", () => {
    vi.useFakeTimers();
    const fixedNow = new Date("2025-01-15T12:00:00.000Z");
    vi.setSystemTime(fixedNow);

    render(
      <LessonPreviewPane meta={{ ...baseMeta, date: null }} profile={baseProfile} classes={classes} />
    );

    const expectedDate = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(fixedNow);

    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("updates the class preview when a class is selected", () => {
    const { rerender } = render(
      <LessonPreviewPane meta={baseMeta} profile={baseProfile} classes={classes} />
    );

    expect(screen.queryByText("Class")).not.toBeInTheDocument();

    rerender(
      <LessonPreviewPane
        meta={{ ...baseMeta, classId: "class-2" }}
        profile={baseProfile}
        classes={classes}
      />
    );

    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByText("World History")).toBeInTheDocument();
  });
});
