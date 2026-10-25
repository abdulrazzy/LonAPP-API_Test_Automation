import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess, responseText } from '../../src/client/api';
import type { LoginData } from '../../src/types/api';

test.describe('Account login', () => {
  test('platform admin can log in with valid credentials', async ({ request, platformAdmin }) => {
    expect(platformAdmin.bearerToken).toBeTruthy();
    expect(platformAdmin.userId).toBeTruthy();
  });

  test('rejects missing password', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Account/login', {
      data: {
        phone_OR_Email: platformAdmin.email,
        password: '',
      },
    });
    expectFailure(result, [400, 401]);
    expect(responseText(result.body).toLowerCase()).not.toContain(platformAdmin.password.toLowerCase());
  });

  test('rejects wrong password', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Account/login', {
      data: {
        phone_OR_Email: platformAdmin.email,
        password: 'Definitely-Wrong-Password-1!',
      },
    });
    expectFailure(result, [400, 401]);
    expect(responseText(result.body)).not.toContain('Definitely-Wrong-Password-1!');
  });

  test('rejects unknown account', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Account/login', {
      data: {
        phone_OR_Email: 'nobody-api-test@example.com',
        password: 'SomePassword1!',
      },
    });
    expectFailure(result, [400, 401, 404]);
  });

  test('refresh rotates tokens for authenticated user', async ({ request, platformAdmin }) => {
    test.skip(!platformAdmin.refreshToken, 'Login did not return a refresh token');

    const result = await apiRequest<LoginData>(request, 'POST', '/api/v1/Account/refresh', {
      data: {
        bearerToken: platformAdmin.bearerToken,
        refreshToken: platformAdmin.refreshToken,
      },
    });
    const body = expectSuccess(result, 200);
    expect(body.data?.bearerToken).toBeTruthy();
    expect(body.data?.refreshToken).toBeTruthy();
  });

  test('session endpoint returns profile for bearer token', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Account/session', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
    expect(result.body.data).toBeTruthy();
  });

  test('sessions list is available to authenticated user', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Account/sessions', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });
});
