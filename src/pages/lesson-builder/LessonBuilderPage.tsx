import React from 'react';

const LessonBuilderPage: React.FC = () => {
  return (
    <main className="bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Lesson Builder</h1>
          <p className="mt-2 text-base text-slate-600">
            Draft your lesson on the left and preview the experience on the right.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Lesson details</h2>
            <p className="mt-3 text-sm text-slate-600">
              This is where the lesson builder form will live. Add fields and interactions here.
            </p>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold text-slate-900">Preview</h2>
            <p className="mt-3 text-sm text-slate-600">
              A live preview of the lesson will appear here as you build your plan.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default LessonBuilderPage;
