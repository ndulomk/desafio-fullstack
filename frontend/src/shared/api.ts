import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';

// Helper para limpar params undefined/null antes de enviar
export function toHttpParams(obj: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      params = params.set(key, String(value));
    }
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly #http = inject(HttpClient);
  readonly #base = environment.apiUrl; // ex: http://localhost:3000/api/v1

  get<T>(path: string, params?: Record<string, unknown>) {
    return this.#http.get<T>(`${this.#base}${path}`, {
      params: params ? toHttpParams(params) : undefined,
      withCredentials: true,
    });
  }

  post<T>(path: string, body: unknown) {
    return this.#http.post<T>(`${this.#base}${path}`, body, {
      withCredentials: true,
    });
  }

  patch<T>(path: string, body: unknown) {
    return this.#http.patch<T>(`${this.#base}${path}`, body, {
      withCredentials: true,
    });
  }

  delete<T = void>(path: string) {
    return this.#http.delete<T>(`${this.#base}${path}`, {
      withCredentials: true,
    });
  }
}