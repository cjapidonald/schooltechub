import { adminRequest, AdminApiError } from "./api";

export type DirectoryUserStatus = "enabled" | "disabled";

export interface DirectoryUser {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  status: DirectoryUserStatus;
  isAdmin: boolean;
}

export interface DirectoryResponse {
  users: DirectoryUser[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  nextPage: number | null;
}

export interface AdminRole {
  userId: string;
  email: string | null;
  grantedAt: string | null;
}

export interface AdminRoleResponse {
  admins: AdminRole[];
}

export async function fetchDirectory(page = 1, perPage = 25): Promise<DirectoryResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  return adminRequest<DirectoryResponse>(`/api/admin/users?${params.toString()}`);
}

export async function inviteUser(email: string): Promise<{ success: boolean; userId: string | null }> {
  return adminRequest<{ success: boolean; userId: string | null }>("/api/admin/users/invite", {
    method: "POST",
    json: { email },
  });
}

export async function disableUser(userId: string): Promise<{ success: boolean }> {
  return adminRequest<{ success: boolean }>("/api/admin/users/disable", {
    method: "POST",
    json: { userId },
  });
}

export async function enableUser(userId: string): Promise<{ success: boolean }> {
  return adminRequest<{ success: boolean }>("/api/admin/users/enable", {
    method: "POST",
    json: { userId },
  });
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  return adminRequest<{ success: boolean }>("/api/admin/users/delete", {
    method: "POST",
    json: { userId },
  });
}

export async function sendPasswordReset(userId: string): Promise<{ success: boolean }> {
  return adminRequest<{ success: boolean }>("/api/admin/users/reset-password", {
    method: "POST",
    json: { userId },
  });
}

export async function grantAdminRole(params: { userId?: string; email?: string }): Promise<{ success: boolean }> {
  if (!params.userId && !params.email) {
    throw new AdminApiError("A user id or email address is required", 400);
  }

  return adminRequest<{ success: boolean }>("/api/admin/roles/grant", {
    method: "POST",
    json: params,
  });
}

export async function revokeAdminRole(params: { userId?: string; email?: string }): Promise<{ success: boolean }> {
  if (!params.userId && !params.email) {
    throw new AdminApiError("A user id or email address is required", 400);
  }

  return adminRequest<{ success: boolean }>("/api/admin/roles/revoke", {
    method: "POST",
    json: params,
  });
}

export async function fetchAdminRoles(): Promise<AdminRoleResponse> {
  return adminRequest<AdminRoleResponse>("/api/admin/roles");
}
