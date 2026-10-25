import { APIRequestContext, expect } from '@playwright/test';
import type { ApiEnvelope } from '../types/api';

export interface ApiCallResult<T> {
  status: number;
  body: ApiEnvelope<T>;
  headers: Record<string, string>;
}

export type JsonBody = Record<string, unknown> | unknown[] | null | undefined;

function authHeaders(token?: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiRequest<T = unknown>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: {
    token?: string | null;
    data?: JsonBody;
    params?: Record<string, string | number | boolean | undefined | null>;
    multipart?: {
      [key: string]:
        | string
        | number
        | boolean
        | { name: string; mimeType: string; buffer: Buffer };
    };
    headers?: Record<string, string>;
  } = {},
): Promise<ApiCallResult<T>> {
  const response = await request.fetch(path, {
    method,
    headers: {
      ...authHeaders(options.token),
      ...(options.data !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    data: options.data,
    params: options.params as Record<string, string | number | boolean> | undefined,
    multipart: options.multipart,
    failOnStatusCode: false,
  });

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(response.headers())) {
    headers[key] = value;
  }

  let body: ApiEnvelope<T>;
  const text = await response.text();
  try {
    body = text ? (JSON.parse(text) as ApiEnvelope<T>) : ({ isSuccess: false } as ApiEnvelope<T>);
  } catch {
    body = {
      isSuccess: false,
      error: { message: text.slice(0, 500) || 'Non-JSON response' },
      errors: [{ message: text.slice(0, 500) || 'Non-JSON response' }],
    };
  }

  return { status: response.status(), body, headers };
}

export function expectSuccess<T>(
  result: ApiCallResult<T>,
  expectedStatus: number | number[] = 200,
): ApiEnvelope<T> {
  const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  expect(allowed, JSON.stringify(result.body)).toContain(result.status);
  expect(result.body.isSuccess, JSON.stringify(result.body)).toBe(true);
  expect(result.body.correlationId).toBeTruthy();
  return result.body;
}

export function expectFailure(
  result: ApiCallResult<unknown>,
  expectedStatus: number | number[],
): ApiEnvelope {
  const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  expect(allowed, JSON.stringify(result.body)).toContain(result.status);
  expect(result.body.isSuccess, JSON.stringify(result.body)).toBe(false);
  return result.body;
}

export function errorCodes(body: ApiEnvelope): string[] {
  const codes: string[] = [];
  if (body.error?.code) codes.push(body.error.code);
  for (const item of body.errors ?? []) {
    if (item.code) codes.push(item.code);
  }
  return codes;
}

export function responseText(body: ApiEnvelope): string {
  return JSON.stringify(body);
}
