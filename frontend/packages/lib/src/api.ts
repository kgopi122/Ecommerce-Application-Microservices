import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Origin of the API gateway (Apache APISIX). The browser talks to APISIX directly
// — NOT through this Next.js server. The API always lives at api.<root-domain>,
// so we strip any existing subdomain (admin., app., …) and prepend "api.":
//   ecommerce.local       → api.ecommerce.local
//   admin.ecommerce.local → api.ecommerce.local  (not api.admin.ecommerce.local)
//   api.ecommerce.local   → api.ecommerce.local  (already correct)
// Set NEXT_PUBLIC_API_URL at build time only if the API lives on an unrelated host.
function resolveApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL as string;
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".localhost")
    ) {
      return "http://localhost:9080";
    }
    const parts = hostname.split(".");
    const rootDomain = parts.length > 2 ? parts.slice(1).join(".") : hostname;
    const apiHost = `api.${rootDomain}`;
    return `${protocol}//${apiHost}${port ? `:${port}` : ""}`;
  }
  return "http://localhost:9080";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!originalRequest) return Promise.reject(error);

    // If refresh itself failed with 401, don't loop
    if (originalRequest.url?.includes("/api/v1/auth/refresh")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });
          const newToken = data.data?.access_token;
          if (newToken) {
            localStorage.setItem("access_token", newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          // Only redirect if current route is protected; never redirect from public pages or /login
          const path = window.location.pathname;
          const isAuthPage = path.includes("/login") || path.includes("/register") || path.includes("/auth/callback");
          const isProtected = path.includes("/profile") || path.includes("/checkout") || path.includes("/orders") || path.includes("/admin");
          const isOptionalProfile = originalRequest.url?.includes("/api/v1/users/me");

          if (!isAuthPage && isProtected && !isOptionalProfile) {
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?redirect=${redirectUrl}`;
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Token bundle returned by the backend SSO `/session` exchange (Keycloak shape).
export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  gender: string;
  phone?: string;
  avatar?: string;
  roles?: string[];
}

export interface SsoTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  scope?: string;
}

/**
 * Builds the URL that kicks off backend-mediated Keycloak SSO. Navigating the
 * browser here → backend `/auth/login` → Keycloak login page → backend `/auth/callback`
 * → back to `callbackPath` on this origin carrying a single-use `ticket`.
 */
export function buildSsoLoginUrl(callbackPath = "/auth/callback"): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = `${origin}${callbackPath}`;
  return `${API_BASE_URL}/api/v1/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

// Auth API
export const authApi = {
  // Direct self-service signup
  signup: (payload: RegisterPayload) =>
    apiClient.post<{ success: boolean; message: string }>("/api/v1/auth/signup", payload),
  // SSO: exchange the single-use ticket from the callback redirect for real tokens.
  getSession: (ticket: string) =>
    apiClient.get<{ data: SsoTokenResponse }>("/api/v1/auth/session", { params: { ticket } }),
  logout: (refreshToken: string) =>
    apiClient.post("/api/v1/auth/logout", { refreshToken }),
  refreshToken: (refreshToken: string) =>
    apiClient.post("/api/v1/auth/refresh", { refreshToken }),
  getProfile: () => apiClient.get("/api/v1/users/me"),
};

// Product API
export const productApi = {
  getAll: (params?: { page?: number; size?: number; sort?: string; categoryId?: number }) =>
    apiClient.get("/api/products", { params }),
  getById: (id: number) => apiClient.get(`/api/products/${id}`),
  create: (data: unknown) => apiClient.post("/api/products", data),
  update: (id: number, data: unknown) => apiClient.put(`/api/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/products/${id}`),
};

// Category API
export const categoryApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    apiClient.get("/api/categories", { params }),
  getById: (id: number) => apiClient.get(`/api/categories/${id}`),
  create: (data: unknown) => apiClient.post("/api/categories", data),
  update: (id: number, data: unknown) => apiClient.put(`/api/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/categories/${id}`),
};

// Order API
export const orderApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    apiClient.get("/api/orders", { params }),
  getById: (id: number) => apiClient.get(`/api/orders/${id}`),
  create: (data: unknown) => apiClient.post("/api/orders", data),
  update: (id: number, data: unknown) => apiClient.put(`/api/orders/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/orders/${id}`),
};

// Cart API
export const cartApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    apiClient.get("/api/carts", { params }),
  getById: (id: number) => apiClient.get(`/api/carts/${id}`),
  create: (data: unknown) => apiClient.post("/api/carts", data),
  update: (id: number, data: unknown) => apiClient.put(`/api/carts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/carts/${id}`),
};

// Payment API
export const paymentApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    apiClient.get("/api/payments", { params }),
  getById: (id: number) => apiClient.get(`/api/payments/${id}`),
  create: (data: unknown) => apiClient.post("/api/payments", data),
};

// Favourite API
export const favouriteApi = {
  getAll: () => apiClient.get("/api/favourites"),
  add: (userId: number, productId: number) =>
    apiClient.post("/api/favourites", { userId, productId }),
  remove: (userId: number, productId: number) =>
    apiClient.delete(`/api/favourites/${userId}/${productId}`),
};

// Rating API
export const ratingApi = {
  getByProduct: (productId: number) =>
    apiClient.get(`/storefront/ratings/products/${productId}`),
  getAverageStar: (productId: number) =>
    apiClient.get(`/storefront/ratings/product/${productId}/average-star`),
  getBackofficeRatings: (params?: { pageNo?: number; pageSize?: number }) =>
    apiClient.get("/backoffice/ratings", { params }),
  create: (data: unknown) => apiClient.post("/storefront/ratings", data),
};

// Inventory API
export const inventoryApi = {
  checkStock: (skuCode: string) =>
    apiClient.get(`/api/inventory`, { params: { skuCode } }),
};

// Search API
export const searchApi = {
  search: (keyword: string, params?: { page?: number; size?: number; sort?: string }) =>
    apiClient.get("/storefront/catalog-search", { params: { keyword, ...params } }),
  suggest: (keyword: string) =>
    apiClient.get("/storefront/search_suggest", { params: { keyword } }),
};

// User API

export const userApi = {

  getAll: (params?: { page?: number; size?: number; sortBy?: string; sortOrder?: string }) =>

    apiClient.get("/api/v1/users/all", { params }),

  getById: (id: number) => apiClient.get(`/api/v1/users/${id}`),

};



// Shipping API

export const shippingApi = {

  getAll: () => apiClient.get("/api/shippings"),

  getById: (orderId: number, productId: number) =>

    apiClient.get(`/api/shippings/${orderId}/${productId}`),

  create: (data: unknown) => apiClient.post("/api/shippings", data),

};



// Tax API

export const taxApi = {

  getTaxClasses: () => apiClient.get("/backoffice/tax-classes"),

};



// Promotion API

export const promotionApi = {

  getPromotions: () => apiClient.get("/backoffice/promotions"),

};



// Notification API

export const notificationApi = {

  getAll: () => apiClient.get("/api/notifications"),

};

