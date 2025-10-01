import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ClassLessonPlanViewer } from "../ClassLessonPlanViewer";
import { en } from "@/translations/en";

vi.mock("@/lib/classes", () => {
  return {
    listClassLessonPlans: vi.fn(),
    linkPlanToClass: vi.fn(),
  };
});

vi.mock("@/components/classes/AttachLessonPlanDialog", () => ({
  AttachLessonPlanDialog: ({ open, onSelect }: { open: boolean; onSelect: (id: string) => void }) =>
    open ? (
      <div>
        <button type="button" onClick={() => onSelect("new-plan")}>Link mock plan</button>
      </div>
    ) : null,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect?: (date?: Date) => void }) => (
    <button type="button" onClick={() => onSelect?.(new Date(2024, 0, 1))}>
      Select date
    </button>
  ),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", t: en }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const { listClassLessonPlans, linkPlanToClass } = await import("@/lib/classes");

describe("ClassLessonPlanViewer", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    // Mock functions are setup in vi.mock calls above
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.clearAllMocks();
  });

  const renderViewer = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ClassLessonPlanViewer classId="class-1" onUnlink={() => undefined} />
      </QueryClientProvider>,
    );

  it("renders linked plans and enables the filter after selecting a date", async () => {
    const user = userEvent.setup();
    renderViewer();

    expect(await screen.findByText("Sample plan")).toBeInTheDocument();

    const showAllButton = screen.getByRole("button", { name: /show all plans/i });
    expect(showAllButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /select date/i }));

    expect(showAllButton).not.toBeDisabled();
  });

  it("calls linkPlanToClass when attaching a plan", async () => {
    const user = userEvent.setup();
    renderViewer();

    expect(await screen.findByText("Sample plan")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /attach existing plan/i }));
    await user.click(await screen.findByRole("button", { name: /link mock plan/i }));

    expect(linkPlanToClass).toHaveBeenCalledWith("new-plan", "class-1");
  });
});

