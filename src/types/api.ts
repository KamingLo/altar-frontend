// src/types/api.ts
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;      // Pesan umum dari Go
  data?: T;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;      // Pesan yang sudah final untuk UI
  data?: T;
}