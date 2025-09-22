import { describe, expect, it } from "vitest";

import { generateStudentExport, generateTeacherExport } from "../exporters";
import type { BuilderState } from "../../types";
import type { LinkHealthStatus } from "../../api/linkHealth";

const createSampleState = (): BuilderState => ({
  id: "lesson-1",
  title: "AI Explorers",
  objective: "Students will investigate how AI supports problem solving.",
  stage: "Middle School",
  subject: "Science",
  lessonDate: "2025-03-15",
  schoolLogoUrl: "https://example.com/logo.png",
  steps: [
    {
      id: "step-1",
      title: "Warm Up",
      goal: "Activate prior knowledge",
      notes: "Encourage every student to contribute a prediction.",
      durationMinutes: 10,
      grouping: "Pairs",
      deliveryMode: "In-class",
      technology: ["Slides"],
      tags: ["collaboration"],
      offlineFallback: "Use printed scenario cards if tech fails.",
      resources: [
        {
          id: "res-1",
          label: "Intro Slides",
          url: "https://example.com/slides",
        },
      ],
    },
  ],
  updatedAt: new Date().toISOString(),
});

const unhealthyLink: LinkHealthStatus = {
  url: "https://example.com/slides",
  isHealthy: false,
  statusCode: 404,
  statusText: "Not Found",
  lastChecked: null,
  lastError: null,
};

describe("builder exporters", () => {
  it("includes lesson metadata, warnings, and formatted resources in the teacher export", () => {
    const state = createSampleState();
    const linkLookup: Record<string, LinkHealthStatus> = {
      [unhealthyLink.url]: unhealthyLink,
    };

    const content = generateTeacherExport(state, linkLookup);

    expect(content).toContain("Learning objective: Students will investigate how AI supports problem solving.");
    expect(content).toContain("Date: 2025-03-15");
    expect(content).toContain("School logo: [View logo](https://example.com/logo.png)");
    expect(content).toContain("Learning goal: Activate prior knowledge");
    expect(content).toContain("Grouping: Pairs");
    expect(content).toContain("Delivery mode: In-class");
    expect(content).toContain("Instructional notes: Encourage every student to contribute a prediction.");
    expect(content).toContain("Resources:\n  - [Intro Slides](https://example.com/slides)");
    expect(content).toContain("Offline fallback: Use printed scenario cards if tech fails.");
    expect(content).toMatch(/Link warnings:\n⚠️ https:\/\/example\.com\/slides \(Not Found\)/);
  });

  it("omits offline fallback but keeps metadata in the student export", () => {
    const state = createSampleState();

    const content = generateStudentExport(state);

    expect(content).toContain("Date: 2025-03-15");
    expect(content).toContain("School logo: [View logo](https://example.com/logo.png)");
    expect(content).toContain("Learning goal: Activate prior knowledge");
    expect(content).toContain("Instructional notes: Encourage every student to contribute a prediction.");
    expect(content).toContain("[Intro Slides](https://example.com/slides)");
    expect(content).not.toContain("Offline fallback");
    expect(content).not.toContain("Link warnings");
  });
});
