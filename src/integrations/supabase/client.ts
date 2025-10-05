import { createMockId, ensureTable, mockTables, MOCK_SESSION, MOCK_USER } from "./mockData";

export type SupabaseResponse<T> = { data: T; error: null };

const noopPromise = async <T>(data: T): Promise<SupabaseResponse<T>> => ({ data, error: null });

class MockMutationResult<T = any> {
  constructor(private rows: T[]) {}

  select(): this {
    return this;
  }

  eq(): this {
    return this;
  }

  order(): this {
    return this;
  }

  limit(): this {
    return this;
  }

  range(): this {
    return this;
  }

  in(): this {
    return this;
  }

  contains(): this {
    return this;
  }

  overlaps(): this {
    return this;
  }

  textSearch(): this {
    return this;
  }

  ilike(): this {
    return this;
  }

  or(): this {
    return this;
  }

  filter(): this {
    return this;
  }

  maybeSingle() {
    return noopPromise(this.rows[0] ?? null);
  }

  single() {
    return noopPromise(this.rows[0] ?? null);
  }

  then<TResult1 = SupabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: (value: SupabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
  ) {
    return Promise.resolve({ data: this.rows, error: null }).then(onfulfilled, onrejected);
  }
}

class MockQuery<T = any> {
  constructor(private tableName: string) {
    ensureTable(tableName);
  }

  private get table(): T[] {
    return ensureTable(this.tableName) as T[];
  }

  select(): this {
    return this;
  }

  eq(): this {
    return this;
  }

  neq(): this {
    return this;
  }

  gt(): this {
    return this;
  }

  gte(): this {
    return this;
  }

  lt(): this {
    return this;
  }

  lte(): this {
    return this;
  }

  is(): this {
    return this;
  }

  like(): this {
    return this;
  }

  ilike(): this {
    return this;
  }

  textSearch(): this {
    return this;
  }

  contains(): this {
    return this;
  }

  overlaps(): this {
    return this;
  }

  in(): this {
    return this;
  }

  not(): this {
    return this;
  }

  or(): this {
    return this;
  }

  filter(): this {
    return this;
  }

  order(): this {
    return this;
  }

  limit(): this {
    return this;
  }

  range(): this {
    return this;
  }

  maybeSingle() {
    return noopPromise(this.table[0] ?? null);
  }

  single() {
    return noopPromise(this.table[0] ?? null);
  }

  insert(values: Partial<T> | Partial<T>[]) {
    const records = Array.isArray(values) ? values : [values];
    const table = this.table;
    const created = records.map((record, index) => {
      const payload: any = { ...record };
      if (!("id" in payload) || !payload.id) {
        payload.id = createMockId(this.tableName);
      }
      return payload;
    });
    table.push(...(created as T[]));
    return new MockMutationResult(created);
  }

  upsert(values: Partial<T> | Partial<T>[]) {
    const records = Array.isArray(values) ? values : [values];
    const table = this.table;
    const upserted = records.map((record, index) => {
      const payload: any = { ...record };
      if (!payload.id) {
        payload.id = createMockId(this.tableName);
      }
      const existingIndex = table.findIndex(row => (row as any).id === payload.id);
      if (existingIndex >= 0) {
        table[existingIndex] = { ...(table[existingIndex] as any), ...payload };
        return table[existingIndex];
      }
      table.push(payload as T);
      return payload as T;
    });
    return new MockMutationResult(upserted);
  }

  update(values: Partial<T>) {
    const table = this.table;
    if (table.length === 0) {
      const created: any = { ...values, id: createMockId(this.tableName) };
      table.push(created);
      return new MockMutationResult([created]);
    }
    Object.assign(table[0] as any, values);
    return new MockMutationResult([table[0]]);
  }

  delete() {
    const table = this.table;
    const removed = table.splice(0, table.length);
    return new MockMutationResult(removed);
  }

  then<TResult1 = SupabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: (value: SupabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
  ) {
    const rows = this.table.slice();
    return Promise.resolve({ data: rows, error: null }).then(onfulfilled, onrejected);
  }
}

const createStorageClient = () => ({
  from(bucket: string) {
    return {
      async upload(path: string, _file: unknown) {
        return { data: { path, fullPath: `${bucket}/${path}` }, error: null };
      },
      async remove(_paths: string[]) {
        return { data: [], error: null };
      },
      async list() {
        return { data: [], error: null };
      },
      getPublicUrl(path: string) {
        const publicUrl = `https://example.com/${bucket}/${path}`;
        return { data: { publicUrl, publicURL: publicUrl, path }, error: null };
      },
      async createSignedUrl(path: string, _expiresIn: number) {
        return { data: { signedUrl: `https://example.com/${bucket}/${path}?token=mock`, path }, error: null };
      },
    };
  },
});

const createAuthClient = () => ({
  async getSession() {
    return { data: { session: MOCK_SESSION }, error: null };
  },
  async getUser() {
    return { data: { user: MOCK_USER }, error: null };
  },
  onAuthStateChange(callback: (event: string, session: typeof MOCK_SESSION | null) => void) {
    callback("SIGNED_IN", MOCK_SESSION);
    return {
      data: {
        subscription: {
          unsubscribe() {
            /* noop */
          },
        },
      },
      error: null,
    };
  },
  async signInWithPassword() {
    return { data: { session: MOCK_SESSION, user: MOCK_USER }, error: null };
  },
  async signInWithOAuth() {
    return { data: { provider: "mock" }, error: null };
  },
  async signUp() {
    return { data: { user: MOCK_USER }, error: null };
  },
  async signOut() {
    return { error: null };
  },
  async updateUser() {
    return { data: { user: MOCK_USER }, error: null };
  },
  async resetPasswordForEmail() {
    return { data: {}, error: null };
  },
});

const createFunctionsClient = () => ({
  async invoke(_name: string, { body }: { body?: unknown } = {}) {
    return { data: body ?? {}, error: null };
  },
});

const createMockSupabaseClient = () => ({
  from(table: string) {
    return new MockQuery(table);
  },
  storage: createStorageClient(),
  auth: createAuthClient(),
  functions: createFunctionsClient(),
  channel() {
    return {
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
      send() {
        return { error: null };
      },
    };
  },
  removeChannel() {
    return { error: null };
  },
  getChannels() {
    return [];
  },
});

export const supabase: any = createMockSupabaseClient();
export type MockSupabaseClient = typeof supabase;
export const MOCK_TABLES = mockTables;
