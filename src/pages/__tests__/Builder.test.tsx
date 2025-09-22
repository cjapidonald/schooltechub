import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import BuilderPage from "../Builder";
import { createEmptyLessonDraft, useLessonDraftStore } from "@/stores/lessonDraft";

describe("Lesson draft builder", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    useLessonDraftStore.setState({ draft: createEmptyLessonDraft() });
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  const renderBuilder = () =>
    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BuilderPage />
        </QueryClientProvider>
      </HelmetProvider>,
    );

  it("creates steps and mirrors them in the preview", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const addButton = screen.getByRole("button", { name: /add step/i });
    await user.click(addButton);

    const titleInput = await screen.findByLabelText(/step 1 title/i);
    expect(titleInput).toHaveValue("New step");

    await user.clear(titleInput);
    await user.type(titleInput, "Warm-up discussion");

    const previewItem = await screen.findByTestId("lesson-draft-preview-step-1");
    expect(previewItem).toHaveTextContent("Warm-up discussion");

    const notesField = screen.getByLabelText(/step 1 notes/i);
    await user.type(notesField, "Greet students and introduce the prompt.");

    expect(previewItem).toHaveTextContent("Greet students");
  });

  it("restores default title when left blank", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("button", { name: /add step/i }));

    const titleInput = await screen.findByLabelText(/step 1 title/i);
    await user.clear(titleInput);

    const helper = await screen.findByText(/each step needs a title/i);
    expect(helper).toBeInTheDocument();

    titleInput.blur();

    const previewItem = await screen.findByTestId("lesson-draft-preview-step-1");
    expect(previewItem).toHaveTextContent("New step");
  });

  it("removes a step after confirmation", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("button", { name: /add step/i }));

    const removeButton = await screen.findByRole("button", { name: /remove step 1/i });
    await user.click(removeButton);

    const dialog = await screen.findByRole("alertdialog");
    const confirmButton = within(dialog).getByRole("button", { name: /remove step/i });
    await user.click(confirmButton);

    expect(screen.queryByTestId("lesson-draft-step-1")).not.toBeInTheDocument();
    expect(
      screen.getByText(/No steps yet\. Use the “Add step” button to start outlining your lesson\./i),
    ).toBeInTheDocument();
  });

  it("opens the resource search modal when focusing the input", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("button", { name: /add step/i }));

    const resourceInput = await screen.findByLabelText(/step 1 resources/i);
    resourceInput.focus();

    const dialog = await screen.findByRole("dialog", { name: /search resources/i });
    expect(dialog).toBeInTheDocument();

    const [closeButton] = within(dialog).getAllByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(screen.queryByRole("dialog", { name: /search resources/i })).not.toBeInTheDocument();
  });
});
