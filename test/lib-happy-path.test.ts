import { describe, expect, it } from "vitest";
import { listMyClasses, getClass, createClass, updateClass, deleteClass, linkPlanToClass, unlinkPlanFromClass } from "@/lib/classes";
import { saveDraft, getMyPlans, getPlanWithSteps, exportPlanToDocx, exportPlanToPDF } from "@/lib/lessonPlans";
import { getMyNotifications, markRead, getPrefs, updatePrefs } from "@/lib/notifications";
import {
  listProjects,
  getProject,
  apply,
  listMyApplications,
  listParticipantDocs,
  uploadSubmission,
  listMySubmissions,
} from "@/lib/research";
import type { SupabaseClient } from "@supabase/supabase-js";

type BuilderResult<T> = Promise<{ data: T; error: null } | { data: null; error: null } | { error: null }>;

type TableHandlers = {
  select?: (args: { filters: Record<string, unknown> }) => BuilderResult<any>;
  selectOrder?: (args: { filters: Record<string, unknown> }) => BuilderResult<any>;
  selectMaybeSingle?: (args: { filters: Record<string, unknown> }) => Promise<{ data: any | null; error: null }>;
  insert?: (payload: Record<string, unknown>) => Promise<{ data: any; error: null }>;
  update?: (args: { payload: Record<string, unknown>; filters: Record<string, unknown> }) => Promise<{ data: any; error: null }>;
  delete?: (filters: Record<string, unknown>) => Promise<{ error: null }>;
  upsert?: (payload: unknown) => Promise<{ data?: any; error: null }>;
};

type StorageHandlers = {
  upload?: (path: string, _body: Blob | ArrayBuffer, options: { contentType: string; upsert: boolean }) => Promise<{ error: null }>;
};

type ClientConfig = {
  userId: string;
  tables: Record<string, TableHandlers>;
  storage?: Record<string, StorageHandlers>;
};

function createDeleteBuilder(
  handler: TableHandlers,
  filters: Record<string, unknown>,
) {
  let executed: Promise<{ error: null }> | null = null;

  function run() {
    if (!executed) {
      executed = handler.delete ? handler.delete(filters) : Promise.resolve({ error: null });
    }
    return executed;
  }

  const builder: any = {
    eq(column: string, value: unknown) {
      filters[column] = value;
      return builder;
    },
    then(onFulfilled: any, onRejected: any) {
      return run().then(onFulfilled, onRejected);
    },
    catch(onRejected: any) {
      return run().catch(onRejected);
    },
    finally(onFinally: any) {
      return run().finally(onFinally);
    },
  };

  return builder;
}

function createSelectBuilder(
  handler: TableHandlers,
  filters: Record<string, unknown>,
): any {
  return {
    eq(column: string, value: unknown) {
      filters[column] = value;
      return this;
    },
    order() {
      if (!handler.selectOrder) {
        throw new Error("selectOrder handler not provided");
      }
      return handler.selectOrder({ filters });
    },
    maybeSingle() {
      if (!handler.selectMaybeSingle) {
        throw new Error("selectMaybeSingle handler not provided");
      }
      return handler.selectMaybeSingle({ filters });
    },
    single() {
      if (!handler.selectMaybeSingle) {
        throw new Error("selectMaybeSingle handler not provided");
      }
      return handler.selectMaybeSingle({ filters }).then(result => ({
        data: result.data,
        error: result.error,
      }));
    },
  };
}

function createInsertBuilder(handler: TableHandlers, payload: Record<string, unknown>): any {
  return {
    select() {
      return {
        single() {
          if (!handler.insert) {
            throw new Error("insert handler not provided");
          }
          return handler.insert(payload);
        },
      };
    },
  };
}

function createUpsertBuilder(handler: TableHandlers, payload: unknown): any {
  return {
    select() {
      return {
        single() {
          if (!handler.upsert) {
            throw new Error("upsert handler not provided");
          }
          return handler.upsert(payload);
        },
      };
    },
  };
}

function createUpdateBuilder(handler: TableHandlers, payload: Record<string, unknown>): any {
  const filters: Record<string, unknown> = {};
  let executed: Promise<{ data: any; error: null }> | null = null;

  function run() {
    if (!executed) {
      if (!handler.update) {
        executed = Promise.resolve({ data: null, error: null });
      } else {
        executed = handler.update({ payload, filters });
      }
    }
    return executed;
  }

  const builder: any = {
    eq(column: string, value: unknown) {
      filters[column] = value;
      return builder;
    },
    select() {
      return {
        single() {
          return run();
        },
      };
    },
    then(onFulfilled: any, onRejected: any) {
      return run().then(onFulfilled, onRejected);
    },
    catch(onRejected: any) {
      return run().catch(onRejected);
    },
    finally(onFinally: any) {
      return run().finally(onFinally);
    },
  };

  return builder;
}

function createSupabaseClient(config: ClientConfig): SupabaseClient {
  return {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: config.userId }, access_token: "test-access-token" } },
          error: null,
        }),
    },
    from(table: string) {
      const handlers = config.tables[table];
      if (!handlers) {
        throw new Error(`No handlers configured for table ${table}`);
      }
      return {
        select() {
          const filters: Record<string, unknown> = {};
          return createSelectBuilder(handlers, filters);
        },
        insert(payload: Record<string, unknown>) {
          return createInsertBuilder(handlers, payload);
        },
        update(payload: Record<string, unknown>) {
          return createUpdateBuilder(handlers, payload);
        },
        delete() {
          const filters: Record<string, unknown> = {};
          return createDeleteBuilder(handlers, filters);
        },
        upsert(payload: unknown) {
          return createUpsertBuilder(handlers, payload);
        },
      } as any;
    },
    storage: {
      from(bucket: string) {
        const handler = config.storage?.[bucket];
        if (!handler || !handler.upload) {
          throw new Error(`No storage handlers configured for bucket ${bucket}`);
        }
        return {
          upload: handler.upload,
        } as any;
      },
    },
  } as unknown as SupabaseClient;
}

describe("classes data helpers", () => {
  const classRow = {
    id: "class-1",
    title: "STEM Club",
    owner_id: "user-1",
    created_at: "2024-01-01T00:00:00Z",
  };

  const baseClient = createSupabaseClient({
    userId: "user-1",
    tables: {
      classes: {
        selectOrder: () => Promise.resolve({ data: [classRow], error: null }),
        selectMaybeSingle: () => Promise.resolve({ data: classRow, error: null }),
        insert: payload =>
          Promise.resolve({
            data: { ...classRow, id: "class-2", title: payload.title },
            error: null,
          }),
        update: ({ payload }) =>
          Promise.resolve({
            data: { ...classRow, title: payload.title ?? classRow.title },
            error: null,
          }),
        delete: () => Promise.resolve({ error: null }),
      },
      class_lesson_plans: {
        insert: payload =>
          Promise.resolve({ data: { id: "link-1", ...payload }, error: null }),
        delete: () => Promise.resolve({ error: null }),
      },
    },
  });

  it("lists classes", async () => {
    const classes = await listMyClasses(baseClient);
    expect(classes).toHaveLength(1);
    expect(classes[0].title).toBe("STEM Club");
  });

  it("fetches a class", async () => {
    const result = await getClass("class-1", baseClient);
    expect(result?.id).toBe("class-1");
  });

  it("creates a class", async () => {
    const created = await createClass({ title: "Robotics" }, baseClient);
    expect(created.id).toBe("class-2");
    expect(created.title).toBe("Robotics");
  });

  it("updates a class", async () => {
    const updated = await updateClass("class-1", { title: "Updated" }, baseClient);
    expect(updated.title).toBe("Updated");
  });

  it("deletes a class", async () => {
    await expect(deleteClass("class-1", baseClient)).resolves.toBeUndefined();
  });

  it("links and unlinks lesson plans", async () => {
    await expect(linkPlanToClass("plan-1", "class-1", baseClient)).resolves.toBeUndefined();
    await expect(unlinkPlanFromClass("plan-1", "class-1", baseClient)).resolves.toBeUndefined();
  });
});

describe("lesson plan helpers", () => {
  const planRow = {
    id: "plan-1",
    owner_id: "user-1",
    title: "Math Lesson",
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-05T00:00:00Z",
    meta: {},
  };

  const stepRows = [
    { id: "step-1", lesson_plan_id: "plan-1", position: 0, title: "Warm up", notes: "Discussion", resource_ids: ["res-1"] },
  ];

  let storedPlan = { ...planRow };

  const client = createSupabaseClient({
    userId: "user-1",
    tables: {
      lesson_plans: {
        selectOrder: () => Promise.resolve({ data: [planRow], error: null }),
        selectMaybeSingle: ({ filters }) => {
          if (filters.id === storedPlan.id) {
            return Promise.resolve({ data: storedPlan, error: null });
          }
          return Promise.resolve({ data: planRow, error: null });
        },
        insert: payload =>
          Promise.resolve().then(() => {
            storedPlan = {
              ...planRow,
              id: "plan-2",
              owner_id: payload.owner_id,
              title: payload.title,
            };
            return { data: storedPlan, error: null };
          }),
        update: ({ payload }) =>
          Promise.resolve().then(() => {
            storedPlan = { ...storedPlan, title: payload.title ?? storedPlan.title };
            return { data: storedPlan, error: null };
          }),
      },
      lesson_plan_steps: {
        selectOrder: () => Promise.resolve({ data: stepRows, error: null }),
        upsert: () => Promise.resolve({ data: stepRows, error: null }),
      },
    },
  });

  it("saves a new draft", async () => {
    const result = await saveDraft({ title: "New Lesson", steps: [{ title: "Intro" }] }, client);
    expect(result.plan.title).toBe("New Lesson");
    expect(result.steps[0].title).toBe("Warm up");
  });

  it("lists my plans", async () => {
    const plans = await getMyPlans(client);
    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe("Math Lesson");
  });

  it("gets a plan with steps", async () => {
    const result = await getPlanWithSteps("plan-1", client);
    expect(result?.steps).toHaveLength(1);
  });

  it("exports to PDF and Docx", async () => {
    const pdf = await exportPlanToPDF("plan-1", client);
    expect(pdf.type).toBe("application/pdf");

    const docx = await exportPlanToDocx("plan-1", client);
    expect(docx.type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });
});

describe("notification helpers", () => {
  const notificationRow = {
    id: "notif-1",
    user_id: "user-1",
    type: "resource_approved",
    payload: { message: "Congrats" },
    created_at: "2024-01-10T00:00:00Z",
    is_read: false,
    email_sent: false,
  };

  const prefsRow = {
    user_id: "user-1",
    email_enabled: true,
    resource_approved: true,
    blogpost_approved: true,
    research_application_approved: true,
    comment_reply: true,
    updated_at: "2024-01-11T00:00:00Z",
  };

  const client = createSupabaseClient({
    userId: "user-1",
    tables: {
      notifications: {
        selectOrder: () => Promise.resolve({ data: [notificationRow], error: null }),
        update: () => Promise.resolve({ data: notificationRow, error: null }),
      },
      notification_prefs: {
        selectMaybeSingle: () => Promise.resolve({ data: prefsRow, error: null }),
        upsert: () => Promise.resolve({ data: prefsRow, error: null }),
      },
    },
  });

  it("loads notifications", async () => {
    const notifications = await getMyNotifications(client);
    expect(notifications[0].payload.message).toBe("Congrats");
  });

  it("marks notifications read", async () => {
    await expect(markRead("notif-1", client)).resolves.toBeUndefined();
  });

  it("gets and updates prefs", async () => {
    const prefs = await getPrefs(client);
    expect(prefs.emailEnabled).toBe(true);

    const updated = await updatePrefs({ emailEnabled: false }, client);
    expect(updated.emailEnabled).toBe(true);
  });
});

describe("research helpers", () => {
  const projectRow = {
    id: "project-1",
    title: "AI in Classrooms",
    slug: "ai-classrooms",
    summary: "Study",
    status: "open",
    visibility: "list_public",
    created_by: "owner-1",
    created_at: "2024-02-01T00:00:00Z",
  };

  const applicationRow = {
    id: "application-1",
    project_id: "project-1",
    applicant_id: "user-1",
    status: "pending",
    statement: "I would like to join",
    submitted_at: "2024-02-02T00:00:00Z",
    approved_at: null,
    approved_by: null,
  };

  const documentRow = {
    id: "doc-1",
    project_id: "project-1",
    title: "Protocol",
    doc_type: "protocol",
    status: "participant",
    storage_path: "project-1/doc.pdf",
    created_at: "2024-02-03T00:00:00Z",
  };

  const submissionRow = {
    id: "submission-1",
    project_id: "project-1",
    participant_id: "user-1",
    title: "Report",
    description: null,
    storage_path: "project-1/user-1/file.pdf",
    status: "submitted",
    reviewed_by: null,
    reviewed_at: null,
    submitted_at: "2024-02-04T00:00:00Z",
  };

  const client = createSupabaseClient({
    userId: "user-1",
    tables: {
      research_projects: {
        selectOrder: () => Promise.resolve({ data: [projectRow], error: null }),
        selectMaybeSingle: ({ filters }) => {
          if (filters.slug === "missing") {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: projectRow, error: null });
        },
      },
      research_applications: {
        selectMaybeSingle: () => Promise.resolve({ data: null, error: null }),
        insert: payload =>
          Promise.resolve({
            data: { ...applicationRow, project_id: payload.project_id, applicant_id: payload.applicant_id },
            error: null,
          }),
        selectOrder: () => Promise.resolve({ data: [applicationRow], error: null }),
      },
      research_documents: {
        selectOrder: () => Promise.resolve({ data: [documentRow], error: null }),
      },
      research_participants: {
        selectMaybeSingle: () => Promise.resolve({ data: { id: "participant-1" }, error: null }),
      },
      research_submissions: {
        insert: payload =>
          Promise.resolve({
            data: { ...submissionRow, storage_path: payload.storage_path, title: payload.title },
            error: null,
          }),
        selectOrder: () => Promise.resolve({ data: [submissionRow], error: null }),
      },
    },
    storage: {
      research: {
        upload: () => Promise.resolve({ error: null }),
      },
    },
  });

  it("lists and fetches projects", async () => {
    const projects = await listProjects({}, client);
    expect(projects[0].title).toBe("AI in Classrooms");

    const project = await getProject("ai-classrooms", client);
    expect(project?.id).toBe("project-1");
  });

  it("applies to a project and lists applications", async () => {
    const application = await apply("project-1", "I would like to join", client);
    expect(application.projectId).toBe("project-1");

    const applications = await listMyApplications(client);
    expect(applications).toHaveLength(1);
  });

  it("lists participant documents", async () => {
    const documents = await listParticipantDocs("project-1", client);
    expect(documents[0].title).toBe("Protocol");
  });

  it("uploads submissions and lists them", async () => {
    const blob = new Blob(["example"], { type: "text/plain" });
    const submission = await uploadSubmission("project-1", blob, { title: "Example" }, client);
    expect(submission.title).toBe("Example");

    const submissions = await listMySubmissions("project-1", client);
    expect(submissions).toHaveLength(1);
  });
});
