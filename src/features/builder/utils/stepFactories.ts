import { nanoid } from "nanoid";
import type { BuilderResourceLink, BuilderStep } from "../types";

export const createResourceLink = (
  resource: Omit<BuilderResourceLink, "id">,
): BuilderResourceLink => ({
  ...resource,
  id: nanoid(),
});

export const createEmptyStep = (): BuilderStep => ({
  id: nanoid(),
  title: "New step",
  learningGoals: "",
  duration: "",
  grouping: "Whole Class",
  deliveryMode: "In-person",
  notes: "",
  resources: [],
});
