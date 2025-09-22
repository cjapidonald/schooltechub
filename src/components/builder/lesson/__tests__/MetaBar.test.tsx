import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MetaBar } from "../MetaBar";
import type { LessonBuilderPlan } from "@/types/lesson-builder";

const basePlan: LessonBuilderPlan = {
  id: "plan-1",
  slug: "plan-1",
  title: "Sample plan",
  summary: "Summary",
  status: "draft",
  stage: null,
  stages: [],
  subjects: [],
  deliveryMethods: [],
  technologyTags: [],
  durationMinutes: null,
  overview: null,
  steps: [],
  standards: [],
  availableStandards: [],
  resources: [],
  lastSavedAt: null,
  version: 1,
  parts: [],
  history: [],
  schoolLogoUrl: null,
  lessonDate: null,
  ownerId: null,
  createdAt: null,
  updatedAt: null,
};

const copy = {
  titleLabel: "Lesson title",
  summaryLabel: "Lesson summary",
  stageLabel: "Stage",
  stagePlaceholder: "Select stage",
  objectivesLabel: "Objectives",
  objectivesPlaceholder: "Add objectives...",
  successCriteriaLabel: "Success criteria",
  successCriteriaPlaceholder: "Add success criteria...",
  subjectsLabel: "Subjects",
  durationLabel: "Duration",
  technologyLabel: "Technology",
  logoLabel: "Upload school logo",
  logoChangeLabel: "Change logo",
  logoUploadingLabel: "Uploading...",
  logoAlt: "School logo",
  dateLabel: "Lesson date",
  datePlaceholder: "Select a date",
};

describe("MetaBar", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the current logo when provided", () => {
    let latestPlan = { ...basePlan, schoolLogoUrl: "https://example.com/logo.png" };
    const onUpdate = vi.fn((updater: (plan: LessonBuilderPlan) => LessonBuilderPlan) => {
      latestPlan = updater(latestPlan);
      return latestPlan;
    });

    render(
      <MetaBar plan={latestPlan} copy={copy} onUpdate={onUpdate} profileId="profile-1" />
    );

    expect(screen.getByRole("img", { name: copy.logoAlt })).toHaveAttribute(
      "src",
      "https://example.com/logo.png"
    );
  });

  it("uploads a new logo and triggers update", async () => {
    const user = userEvent.setup();
    let latestPlan = { ...basePlan };
    const onUpdate = vi.fn((updater: (plan: LessonBuilderPlan) => LessonBuilderPlan) => {
      latestPlan = updater(latestPlan);
      return latestPlan;
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://cdn.example/new-logo.png", path: "path" }),
    }));

    render(
      <MetaBar plan={latestPlan} copy={copy} onUpdate={onUpdate} profileId="profile-1" />
    );

    const input = screen.getByTestId("logo-input") as HTMLInputElement;
    const file = new File(["image"], "logo.png", { type: "image/png" });

    await user.upload(input, file);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
      expect(latestPlan.schoolLogoUrl).toBe("https://cdn.example/new-logo.png");
    });
  });

  it("updates the lesson date when a new date is selected", async () => {
    const user = userEvent.setup();
    let latestPlan = { ...basePlan, lessonDate: "2025-02-10" };
    const onUpdate = vi.fn((updater: (plan: LessonBuilderPlan) => LessonBuilderPlan) => {
      latestPlan = updater(latestPlan);
      return latestPlan;
    });

    render(
      <MetaBar plan={latestPlan} copy={copy} onUpdate={onUpdate} profileId="profile-1" />
    );

    const dateButton = screen.getByRole("button", { name: /February 10/i });
    await user.click(dateButton);

    const targetDate = new Date(2025, 1, 20);
    const dialog = await screen.findByRole("dialog");
    const cells = within(dialog).getAllByRole("gridcell");
    const matchCell = cells.find((cell) => cell.textContent?.trim() === "20");

    expect(matchCell).toBeDefined();
    await user.click(matchCell!);

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());

    const caption = within(dialog).getByText(/^[A-Za-z]+ \d{4}$/);
    const [monthName, year] = caption.textContent?.split(" ") ?? [];
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
    const expectedDate = `${year}-${String(monthIndex).padStart(2, "0")}-20`;

    expect(latestPlan.lessonDate).toBe(expectedDate);
  });
});
