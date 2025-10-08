import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LessonPreviewPane } from "../LessonPreviewPane";
import type { LessonPlanMetaDraft } from "../../types";

const baseMeta: LessonPlanMetaDraft = {
  title: "",
  subject: null,
  date: null,
  objective: "",
  successCriteria: "",
  teacher: null,
  classId: null,
  lessonId: null,
  sequence: null,
  stage: null,
};

const baseProfile = {
  fullName: null,
  schoolName: null,
  schoolLogoUrl: null,
};

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
          date: null,
          objective: "",
          successCriteria: "",
        }}
        profile={{
          ...baseProfile,
          fullName: "   ",
          schoolName: "",
        }}
      />
    );

    expect(screen.queryByText("Teacher")).not.toBeInTheDocument();

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

    render(<LessonPreviewPane meta={{ ...baseMeta, date: null }} profile={baseProfile} />);

    const expectedDate = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(fixedNow);

    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("shows the subject when provided", () => {
    render(
      <LessonPreviewPane
        meta={{ ...baseMeta, subject: "Science" }}
        profile={baseProfile}
      />
    );

    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
  });
});
