import { APIRequestContext } from '@playwright/test';
import { apiRequest, expectSuccess } from '../client/api';
import { getPlatformAdminCredentials } from '../config/env';
import type { AuthSession, LoginData } from '../types/api';

let cached: AuthSession | null = null;

export async function loginAsPlatformAdmin(request: APIRequestContext): Promise<AuthSession> {
  if (cached?.bearerToken) {
    return cached;
  }

  const { email, password } = getPlatformAdminCredentials();
  const result = await apiRequest<LoginData>(request, 'POST', '/api/v1/Account/login', {
    data: {
      phone_OR_Email: email,
      password,
    },
  });

  const body = expectSuccess(result, 200);
  const data = body.data;
  if (!data?.bearerToken || !data.userId) {
    throw new Error(`Platform admin login did not return tokens: ${JSON.stringify(body)}`);
  }

  cached = {
    userId: data.userId,
    bearerToken: data.bearerToken,
    refreshToken: data.refreshToken || '',
    sessionId: data.sessionId,
    tenantId: data.tenant?.tenantId ?? undefined,
    email,
    password,
  };

  return cached;
}

export function clearPlatformAdminCache(): void {
  cached = null;
}

export async function loginWithPassword(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<AuthSession> {
  const result = await apiRequest<LoginData>(request, 'POST', '/api/v1/Account/login', {
    data: {
      phone_OR_Email: email,
      password,
    },
  });

  const body = expectSuccess(result, 200);
  const data = body.data;
  if (!data?.bearerToken || !data.userId) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }

  return {
    userId: data.userId,
    bearerToken: data.bearerToken,
    refreshToken: data.refreshToken || '',
    sessionId: data.sessionId,
    tenantId: data.tenant?.tenantId ?? undefined,
    email,
    password,
  };
}
