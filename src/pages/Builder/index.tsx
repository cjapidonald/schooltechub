import { MemoryRouter } from "react-router-dom";

import { LanguageProvider } from "@/contexts/LanguageContext";

import LessonBuilderPage from "../lesson-builder/LessonBuilderPage";

const BuilderPage = () => (
  <MemoryRouter>
    <LanguageProvider>
      <LessonBuilderPage />
    </LanguageProvider>
  </MemoryRouter>
);

export default BuilderPage;
