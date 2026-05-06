// src/types/api.ts
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export type UserRole = 'asdos' | 'koordinator';

export interface UserData {
  id: string;
  email: string;
  id_asisten?: string | null;
  id_koordinator?: string | null;
}