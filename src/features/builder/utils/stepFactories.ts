import { nanoid } from "nanoid";
import type { BuilderResourceLink, BuilderStep } from "../types";

const defaultTags = ["collaboration", "creativity", "critical-thinking"];
const defaultTechnology = ["Slides", "Whiteboard"];

export const createResourceLink = (label = "Resource", url = ""): BuilderResourceLink => ({
  id: nanoid(),
  label,
  url,
});

export const createEmptyStep = (): BuilderStep => ({
  id: nanoid(),
  title: "New Step",
  goal: "",
  notes: "",
  durationMinutes: 10,
  grouping: "Whole Class",
  deliveryMode: "In-class",
  technology: [...defaultTechnology],
  tags: [...defaultTags],
  offlineFallback: "Provide printed instructions and offline manipulatives.",
  resources: [createResourceLink("Slide Deck", "https://example.com/slides")],
});
