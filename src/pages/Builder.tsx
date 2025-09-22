import { SEO } from "@/components/SEO";
import LessonBuilder from "@/features/builder/components/LessonBuilder";

const BuilderPage = () => {
  return (
    <div className="min-h-screen bg-muted/20 py-10">
      <SEO title="Lesson Builder" description="Design tech-rich lessons with favorites, collections, and offline fallbacks." />
      <main className="container mx-auto">
        <LessonBuilder />
      </main>
    </div>
  );
};

export default BuilderPage;
