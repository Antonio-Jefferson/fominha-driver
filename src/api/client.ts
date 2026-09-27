import { API_URL, buildApiUrl } from "../lib/env";
import { ApiError, extractErrorMessage } from "./errors";
import { clearSession, loadSession, saveSession } from "../auth/session-storage";
import type { Session } from "../@types/auth";

/**
 * Callback avisado quando a sessão morre de vez (refresh falhou).
 * O AuthContext registra o seu para derrubar o usuário para o login.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setOnUnauthorized(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/** Alias usado pelos testes. */
export const __setOnUnauthorized = setOnUnauthorized;

/**
 * Refresh em andamento. Requisições concorrentes que tomam 401 ao mesmo tempo
 * compartilham esta promise — um único POST a `auth/refresh-token`, evitando
 * queimar o refresh token rotacionado e derrubar o usuário sem motivo.
 */
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefreshAccessToken(): Promise<string | null> {
  const session = await loadSession();
  if (!session?.refresh_token) return null;

  try {
    const res = await fetch(buildApiUrl(API_URL, "auth/refresh-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (!res.ok) {
      await clearSession();
      onUnauthorized?.();
      return null;
    }

    const data = (await res.json()) as Partial<Session>;
    if (!data.access_token) {
      await clearSession();
      onUnauthorized?.();
      return null;
    }

    await saveSession({
      ...session,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? session.refresh_token,
      expires_in: data.expires_in ?? session.expires_in,
      expires_at: data.expires_at ?? session.expires_at,
    });

    return data.access_token;
  } catch {
    await clearSession();
    onUnauthorized?.();
    return null;
  }
}

type QueryValue = string | number | boolean | null | undefined;
export type RequestOptions = {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
};

function withQuery(path: string, query?: Record<string, QueryValue>): string {
  if (!query) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `${path}${path.includes("?") ? "&" : "?"}${s}` : path;
}

async function request<T>(
  path: string,
  options: {
    method: string;
    body?: unknown;
    query?: Record<string, QueryValue>;
    signal?: AbortSignal;
  } = { method: "GET" },
  isRetry = false,
  overrideToken?: string
): Promise<T> {
  const session = await loadSession();
  const accessToken = overrideToken ?? session?.access_token;
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(buildApiUrl(API_URL, withQuery(path, options.query)), {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new ApiError(401, "Sessão expirada. Faça login novamente.");
    }
    return request<T>(path, options, true, newToken);
  }

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(await res.text()));
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await res.json()) as T;
  }
  return undefined as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body, ...options }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};
