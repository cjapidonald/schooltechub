import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import AccountDashboard from "../index";
import { en } from "@/translations/en";

vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: {
      id: "user-1",
      email: "user@example.com",
      user_metadata: {},
    },
    loading: false,
  }),
}));

vi.mock("@/hooks/useMyProfile", () => ({
  useMyProfile: () => ({
    fullName: "Alex Teacher",
    schoolName: "Learning Academy",
    schoolLogoUrl: null,
  }),
}));

vi.mock("@/lib/classes", () => ({
  listMyClasses: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/classes/ClassCreateDialog", () => ({
  ClassCreateDialog: () => null,
}));

vi.mock("@/pages/account/components/UpcomingLessonsCard", () => ({
  UpcomingLessonsCard: () => <div>Upcoming lessons card</div>,
}));

vi.mock("@/components/SEO", () => ({
  SEO: () => null,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", t: en }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("AccountDashboard overview", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  const renderDashboard = () =>
    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AccountDashboard />
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );

  it("shows research teaser and publishing shortcuts", async () => {
    renderDashboard();

    expect(await screen.findByText(/Research & Applications/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Post a blog/i })).toHaveAttribute("href", "/blog/new");
    expect(screen.getByRole("link", { name: /Ask a question/i })).toHaveAttribute("href", "/forum/new");
  });
});

