export interface SupabaseResponse {
  data: any;
  error?: { message: string } | null;
  count?: number | null;
}

export interface StorageResponse {
  data?: { signedUrl?: string | null } | null;
  error?: { message: string } | null;
}

export interface StorageUploadResponse {
  error?: { message: string } | null;
}

export interface StoragePublicResponse {
  data?: { publicUrl?: string | null } | null;
  error?: { message: string } | null;
}

interface CallRecord {
  table: string;
  method: string;
  args: unknown[];
}

class QueryBuilder {
  public readonly calls: CallRecord[] = [];

  constructor(
    private readonly parent: SupabaseStub,
    private readonly table: string,
    private response: SupabaseResponse
  ) {}

  private record(method: string, args: unknown[]): this {
    const entry: CallRecord = { table: this.table, method, args };
    this.parent.calls.push(entry);
    this.calls.push(entry);
    return this;
  }

  select(field: string, options?: unknown): this {
    return this.record("select", [field, options]);
  }

  eq(column: string, value: unknown): this {
    return this.record("eq", [column, value]);
  }

  order(column: string, options?: unknown): this {
    return this.record("order", [column, options]);
  }

  ilike(column: string, pattern: string): this {
    return this.record("ilike", [column, pattern]);
  }

  overlaps(column: string, values: unknown[]): this {
    return this.record("overlaps", [column, values]);
  }

  range(from: number, to: number): this {
    return this.record("range", [from, to]);
  }

  insert(values: unknown): this {
    return this.record("insert", [values]);
  }

  update(values: unknown): this {
    return this.record("update", [values]);
  }

  upsert(values: unknown, options?: unknown): this {
    return this.record("upsert", [values, options]);
  }

  single() {
    this.record("single", []);
    return Promise.resolve({
      data: this.response.data,
      error: this.response.error ?? null,
    });
  }

  maybeSingle() {
    this.record("maybeSingle", []);
    return Promise.resolve({
      data: this.response.data,
      error: this.response.error ?? null,
    });
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: unknown;
          error: { message: string } | null;
          count?: number | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    this.record("then", []);
    const result = {
      data: this.response.data,
      error: this.response.error ?? null,
      count: this.response.count ?? null,
    };
    if (onfulfilled) {
      try {
        return Promise.resolve(onfulfilled(result));
      } catch (error) {
        if (onrejected) {
          return Promise.resolve(onrejected(error));
        }
        return Promise.reject(error);
      }
    }
    return Promise.resolve(result as unknown as TResult1);
  }
}

export class SupabaseStub {
  public calls: CallRecord[] = [];
  public storageCalls: Array<{
    bucket: string;
    path: string;
    method: "upload" | "createSignedUrl" | "getPublicUrl";
    expiresIn?: number;
  }> = [];
  private responses: SupabaseResponse[] = [];
  private storageResponses: StorageResponse[] = [];
  private storageUploadResponses: StorageUploadResponse[] = [];
  private storagePublicResponses: StoragePublicResponse[] = [];

  from(table: string): QueryBuilder {
    const response = this.responses.shift() ?? { data: null, error: null };
    this.calls.push({ table, method: "from", args: [] });
    return new QueryBuilder(this, table, response);
  }

  rpc(name: string, args?: unknown): Promise<SupabaseResponse> {
    this.calls.push({ table: "rpc", method: name, args: [args] });
    const response = this.responses.shift() ?? { data: null, error: null };
    return Promise.resolve(response);
  }

  setResponses(responses: SupabaseResponse[]): void {
    this.responses = responses.map((response) => ({
      data: response.data,
      error: response.error ?? null,
      count: response.count ?? null,
    }));
  }

  setStorageResponses(responses: StorageResponse[]): void {
    this.storageResponses = responses.map((response) => ({
      data: response.data ?? null,
      error: response.error ?? null,
    }));
  }

  setStorageUploadResponses(responses: StorageUploadResponse[]): void {
    this.storageUploadResponses = responses.map((response) => ({
      error: response.error ?? null,
    }));
  }

  setStoragePublicResponses(responses: StoragePublicResponse[]): void {
    this.storagePublicResponses = responses.map((response) => ({
      data: response.data ?? null,
      error: response.error ?? null,
    }));
  }

  reset(): void {
    this.calls = [];
    this.storageCalls = [];
    this.responses = [];
    this.storageResponses = [];
    this.storageUploadResponses = [];
    this.storagePublicResponses = [];
  }

  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, _file: unknown, _options?: unknown) => {
        this.storageCalls.push({ bucket, path, method: "upload" });
        const response = this.storageUploadResponses.shift() ?? { error: null };
        return {
          data: null,
          error: response.error ?? null,
        };
      },
      getPublicUrl: (path: string) => {
        this.storageCalls.push({ bucket, path, method: "getPublicUrl" });
        const response =
          this.storagePublicResponses.shift() ??
          ({ data: { publicUrl: null }, error: null } as StoragePublicResponse);
        return {
          data: response.data ?? null,
          error: response.error ?? null,
        };
      },
      createSignedUrl: async (path: string, expiresIn: number) => {
        this.storageCalls.push({ bucket, path, method: "createSignedUrl", expiresIn });
        const response =
          this.storageResponses.shift() ??
          ({ data: { signedUrl: null }, error: null } as StorageResponse);
        return {
          data: response.data ?? null,
          error: response.error ?? null,
        };
      },
    }),
  };
}
