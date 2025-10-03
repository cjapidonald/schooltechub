import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpcomingLessonsCard } from "../UpcomingLessonsCard";
import { en } from "@/translations/en";

vi.mock("@/lib/data/lesson-plans", () => ({
  listUpcomingLessonPlans: vi.fn(),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", t: en }),
}));

const { listUpcomingLessonPlans } = await import("@/lib/data/lesson-plans");

describe("UpcomingLessonsCard", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    (listUpcomingLessonPlans as Mock).mockResolvedValue([
      {
        lessonId: "lesson-1",
        classTitle: "STEM Club",
        lessonTitle: "Robotics basics",
        date: "2024-02-01",
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.clearAllMocks();
  });

  const renderCard = () =>
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <UpcomingLessonsCard isEnabled className="" />
        </QueryClientProvider>
      </MemoryRouter>,
    );

  it("shows upcoming lessons with links", async () => {
    renderCard();

    const link = await screen.findByRole("link", { name: /Robotics basics/i });
    expect(link).toHaveAttribute("href", "/lesson-builder?id=lesson-1");
  });

  it("renders empty state when there are no lessons", async () => {
    (listUpcomingLessonPlans as Mock).mockResolvedValueOnce([]);

    renderCard();

    expect(
      await screen.findByText(/No upcoming lessons scheduled./i),
    ).toBeInTheDocument();
  });
});

