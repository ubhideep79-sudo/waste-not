import {
  User,
  Ingredient,
  WasteRecord,
  DashboardData,
  TrendDataPoint,
  Recommendation,
  AuditLogItem,
  AppSettings,
} from "../types/index.ts";

const TOKEN_KEY = "waste_not_jwt_token";
const USER_KEY = "waste_not_user_data";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Event listener for session expired
type ExpiredHandler = () => void;
const expiredListeners: ExpiredHandler[] = [];
export function onSessionExpired(handler: ExpiredHandler): () => void {
  expiredListeners.push(handler);
  return () => {
    const idx = expiredListeners.indexOf(handler);
    if (idx !== -1) expiredListeners.splice(idx, 1);
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    expiredListeners.forEach((fn) => fn());
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.message ||
      `Request failed with status ${response.status} (${response.statusText})`;
    const error: any = new Error(message);
    error.status = response.status;
    error.code = data.code;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ success: boolean; token: string; user: User }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    setToken(res.token);
    setStoredUser(res.user);
    return { token: res.token, user: res.user };
  },

  async getCurrentUser(): Promise<User> {
    const res = await request<{ success: boolean; user: User }>("/api/auth/me");
    setStoredUser(res.user);
    return res.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async getDemoCredentials(): Promise<{
    manager: { email: string; password: string; role: string; title: string };
    staff: { email: string; password: string; role: string; title: string };
  }> {
    return request("/api/auth/demo-credentials");
  },

  // Ingredients
  async getIngredients(params?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  }): Promise<{
    count: number;
    totalValuationINR: number;
    lowStockCount: number;
    ingredients: Ingredient[];
  }> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.lowStock) query.set("lowStock", "true");
    if (params?.expiringSoon) query.set("expiringSoon", "true");

    const endpoint = `/api/ingredients${query.toString() ? `?${query.toString()}` : ""}`;
    return request(endpoint);
  },

  async getIngredientById(id: string): Promise<{
    ingredient: Ingredient;
    wasteSummary: {
      totalWastedQty: number;
      totalWastedCost: number;
      recordsCount: number;
    };
  }> {
    return request(`/api/ingredients/${id}`);
  },

  async createIngredient(data: Partial<Ingredient>): Promise<{
    message: string;
    ingredient: Ingredient;
  }> {
    return request("/api/ingredients", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateIngredient(
    id: string,
    data: Partial<Ingredient>
  ): Promise<{ message: string; ingredient: Ingredient }> {
    return request(`/api/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async adjustIngredientStock(
    id: string,
    newQuantity: number,
    reason: string
  ): Promise<{ message: string; ingredient: Ingredient }> {
    return request(`/api/ingredients/${id}/adjust-stock`, {
      method: "PATCH",
      body: JSON.stringify({ newQuantity, reason }),
    });
  },

  async deleteIngredient(id: string): Promise<{ message: string }> {
    return request(`/api/ingredients/${id}`, {
      method: "DELETE",
    });
  },

  // Waste Records
  async getWasteRecords(params?: {
    startDate?: string;
    endDate?: string;
    reason?: string;
    kitchenStation?: string;
    ingredientId?: string;
    myEntriesOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    count: number;
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    summary: {
      totalCostINR: number;
      totalWeightKg: number;
      recordCount: number;
    };
    records: WasteRecord[];
  }> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.reason) query.set("reason", params.reason);
    if (params?.kitchenStation) query.set("kitchenStation", params.kitchenStation);
    if (params?.ingredientId) query.set("ingredientId", params.ingredientId);
    if (params?.myEntriesOnly) query.set("myEntriesOnly", "true");
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const endpoint = `/api/waste${query.toString() ? `?${query.toString()}` : ""}`;
    return request(endpoint);
  },

  async recordWaste(data: {
    ingredientId: string;
    quantity: number;
    unit?: string;
    reason: string;
    kitchenStation?: string;
    shift?: string;
    recordDate?: string;
    notes?: string;
    deductFromStock?: boolean;
  }): Promise<{
    message: string;
    record: WasteRecord;
    stockUpdated: boolean;
    currentStock: number;
  }> {
    return request("/api/waste", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateWasteRecord(
    id: string,
    data: Partial<WasteRecord>
  ): Promise<{ message: string; record: WasteRecord }> {
    return request(`/api/waste/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteWasteRecord(id: string): Promise<{ message: string }> {
    return request(`/api/waste/${id}`, {
      method: "DELETE",
    });
  },

  // Analytics
  async getDashboard(params?: {
    period?: "today" | "week" | "month" | "custom";
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardData> {
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const endpoint = `/api/analytics/dashboard${
      query.toString() ? `?${query.toString()}` : ""
    }`;
    return request(endpoint);
  },

  async getTrends(params?: {
    period?: "today" | "week" | "month" | "custom";
    startDate?: string;
    endDate?: string;
  }): Promise<{ trends: TrendDataPoint[] }> {
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const endpoint = `/api/analytics/trends${
      query.toString() ? `?${query.toString()}` : ""
    }`;
    return request(endpoint);
  },

  async getRecommendations(): Promise<{
    totalProjectedSavingsINR: number;
    recommendationsCount: number;
    recommendations: Recommendation[];
    topWasteStation: string;
  }> {
    return request("/api/analytics/recommendations");
  },

  async downloadCsv(params?: {
    startDate?: string;
    endDate?: string;
    reason?: string;
    kitchenStation?: string;
  }): Promise<void> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.reason) query.set("reason", params.reason);
    if (params?.kitchenStation) query.set("kitchenStation", params.kitchenStation);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(
      `/api/analytics/export-csv${query.toString() ? `?${query.toString()}` : ""}`,
      { headers }
    );

    if (!res.ok) throw new Error("Failed to export CSV report");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waste_not_report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Users (Staff Management)
  async getUsers(): Promise<{ count: number; users: User[] }> {
    return request("/api/users");
  },

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: "manager" | "staff";
    kitchenStation?: string;
    employeeId?: string;
  }): Promise<{ message: string; user: User }> {
    return request("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUser(
    id: string,
    data: Partial<User> & { newPassword?: string }
  ): Promise<{ message: string; user: User }> {
    return request(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return request(`/api/users/${id}`, {
      method: "DELETE",
    });
  },

  // Settings
  async getSettings(): Promise<{ settings: AppSettings }> {
    return request("/api/settings");
  },

  async updateSettings(data: Partial<AppSettings>): Promise<{
    message: string;
    settings: AppSettings;
  }> {
    return request("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Audit
  async getAuditLogs(params?: {
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    count: number;
    total: number;
    totalPages: number;
    currentPage: number;
    logs: AuditLogItem[];
  }> {
    const query = new URLSearchParams();
    if (params?.action) query.set("action", params.action);
    if (params?.entityType) query.set("entityType", params.entityType);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const endpoint = `/api/audit${query.toString() ? `?${query.toString()}` : ""}`;
    return request(endpoint);
  },

  // Seed / Reset
  async resetDemoData(): Promise<{ message: string }> {
    return request("/api/seed/reset", {
      method: "POST",
    });
  },
};
