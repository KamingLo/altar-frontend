import { cookies } from 'next/headers';
import type { ActionResponse } from '@/types/api';
import {
  isSessionExpiredMessage,
  normalizeApiEndpoint,
  SESSION_EXPIRED_MESSAGE,
} from '@/lib/auth/jwt';

const BASE_URL = process.env.BACKEND_URL ?? '';

/** Ikuti redirect Django tanpa membuang header Authorization */
async function fetchWithAuthRedirects(
  url: string,
  init: RequestInit,
  headers: Record<string, string>,
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetch(currentUrl, { ...init, headers });
    if (res.status < 300 || res.status >= 400 || i === maxRedirects) return res;
    const location = res.headers.get('location');
    if (!location) return res;
    currentUrl = location.startsWith('http') ? location : new URL(location, BASE_URL).toString();
  }
  return fetch(currentUrl, { ...init, headers });
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  cache?: RequestCache;
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ActionResponse<T>> {
  const { method = 'GET', body, auth = false, cache } = options;
  const url = `${BASE_URL}${normalizeApiEndpoint(endpoint)}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  let token: string | undefined;
  if (auth) {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return {
        success: false,
        message: SESSION_EXPIRED_MESSAGE,
      };
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = { method, headers, redirect: 'manual' };
  if (body !== undefined) fetchOptions.body = JSON.stringify(body);
  if (cache !== undefined) fetchOptions.cache = cache;

  try {
    const res = await fetchWithAuthRedirects(url, fetchOptions, headers);

    let json: Record<string, unknown> = {};
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      /* non-JSON response */
    }

    const message = (json?.message as string) ?? `Error ${res.status}`;
    const isSuccess = json?.success === true || (res.ok && json?.success !== false);

    if (!isSuccess) {
      if (auth && isSessionExpiredMessage(message)) {
        return {
          success: false,
          message: SESSION_EXPIRED_MESSAGE,
          data: json?.data as T,
        };
      }
      return {
        success: false,
        message,
        data: json?.data as T,
      };
    }

    return {
      success: true,
      message: (json?.message as string) ?? '',
      data: (json?.data !== undefined ? json.data : null) as T,
    };
  } catch (error) {
    console.error(`[API] ${method} ${url}:`, error);
    return { success: false, message: 'Gagal terhubung ke server' };
  }
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(endpoint, { ...options, method: 'DELETE', body }),
};
