import { cookies } from 'next/headers';
import type { ActionResponse } from '@/types/api';

const BASE_URL = process.env.BACKEND_URL ?? '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  cache?: RequestCache;
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ActionResponse<T>> {
  const { method = 'GET', body, auth = false, cache } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (auth) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  const fetchOptions: RequestInit = { method, headers, signal: controller.signal };
  if (body !== undefined) fetchOptions.body = JSON.stringify(body);
  if (cache !== undefined) fetchOptions.cache = cache;

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);

    let json: {
      success?: boolean;
      message?: string;
      data?: unknown;
      error?: unknown;
    } = {};
    try { json = await res.json(); } catch {  }
    const isSuccess = json?.success === true || (res.ok && json?.success !== false);

    if (!isSuccess) {
      return {
        success: false,
        message: (json?.message as string) ?? `Error ${res.status}`,
        data: json?.data as T,
        error: json?.error,
      };
    }

    return {
      success: true,
      message: (json?.message as string) ?? '',
      data: (json?.data !== undefined ? json.data : null) as T,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[API] ${method} ${endpoint}:`, error);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      success: false,
      message: isTimeout
        ? 'Gagal terhubung ke server: Waktu koneksi habis (Timeout)'
        : 'Gagal terhubung ke server',
    };
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
  delete: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

