import { describe, expect, it } from "vitest";

import {
  RESOURCE_SORT_OPTIONS as LIB_RESOURCE_SORT_OPTIONS,
  RESOURCE_STAGE_OPTIONS as LIB_RESOURCE_STAGE_OPTIONS,
  RESOURCE_SUBJECT_OPTIONS as LIB_RESOURCE_SUBJECT_OPTIONS,
  RESOURCE_TYPE_OPTIONS as LIB_RESOURCE_TYPE_OPTIONS,
} from "@/lib/resource-filters";
import {
  RESOURCE_STAGE_OPTIONS as MODAL_RESOURCE_STAGE_OPTIONS,
  RESOURCE_SUBJECT_OPTIONS as MODAL_RESOURCE_SUBJECT_OPTIONS,
  RESOURCE_TYPE_OPTIONS as MODAL_RESOURCE_TYPE_OPTIONS,
} from "@/components/lesson-draft/ResourceSearchModal";

describe("resource filter configuration", () => {
  it("keeps lesson draft modal options in sync with shared constants", () => {
    expect(MODAL_RESOURCE_TYPE_OPTIONS).toBe(LIB_RESOURCE_TYPE_OPTIONS);
    expect(MODAL_RESOURCE_SUBJECT_OPTIONS).toBe(LIB_RESOURCE_SUBJECT_OPTIONS);
    expect(MODAL_RESOURCE_STAGE_OPTIONS).toBe(LIB_RESOURCE_STAGE_OPTIONS);
  });
});
