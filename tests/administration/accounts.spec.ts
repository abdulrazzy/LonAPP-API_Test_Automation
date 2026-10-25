import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';

test.describe('Administration accounts (platform admin)', () => {
  test('lists staff accounts', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/staff-accounts', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('lists customer accounts', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/customer-accounts', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('lists third-party accounts', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/third-party-accounts', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('staff-accounts accepts search query', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/staff-accounts', {
      token: platformAdmin.bearerToken,
      params: { searchParameter: 'api-test-no-match' },
    });
    expectSuccess(result, 200);
  });

  test('customer-accounts accepts status filter', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/customer-accounts', {
      token: platformAdmin.bearerToken,
      params: { status: 'Active' },
    });
    expect([200, 400]).toContain(result.status);
    expect(result.body).toHaveProperty('isSuccess');
  });

  test('staff registration details without userId fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(
      request,
      'GET',
      '/api/v1/Administration/staff-registration-details',
      { token: platformAdmin.bearerToken },
    );
    expectFailure(result, [400, 404, 422]);
  });

  test('customer registration details for unknown user fails', async ({
    request,
    platformAdmin,
  }) => {
    const result = await apiRequest(
      request,
      'GET',
      '/api/v1/Administration/customer-registration-details',
      {
        token: platformAdmin.bearerToken,
        params: { userId: '00000000-0000-4000-8000-000000000099' },
      },
    );
    expectFailure(result, [400, 404]);
  });

  test('verify-user-account with empty userId fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'PUT', '/api/v1/Administration/verify-user-account', {
      token: platformAdmin.bearerToken,
      data: { userId: '' },
    });
    expectFailure(result, [400, 404, 422]);
  });

  test('deactivate-user-account with unknown userId fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(
      request,
      'PUT',
      '/api/v1/Administration/deactivate-user-account',
      {
        token: platformAdmin.bearerToken,
        data: {
          userId: '00000000-0000-4000-8000-000000000099',
          deactivatedReasons: 'api-test',
        },
      },
    );
    expectFailure(result, [400, 404]);
  });

  test('reset-staff-password with unknown userId fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'PUT', '/api/v1/Administration/reset-staff-password', {
      token: platformAdmin.bearerToken,
      data: { userId: '00000000-0000-4000-8000-000000000099' },
    });
    expectFailure(result, [400, 404]);
  });

  test('department-staff-accounts for unknown department fails or empty', async ({
    request,
    platformAdmin,
  }) => {
    const result = await apiRequest(
      request,
      'GET',
      '/api/v1/Administration/department-staff-accounts/99999999',
      { token: platformAdmin.bearerToken },
    );
    expect([200, 400, 404]).toContain(result.status);
    expect(result.body).toHaveProperty('isSuccess');
  });

  test('downloads staff import template', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/staff-import/template', {
      token: platformAdmin.bearerToken,
    });
    expect([200, 204]).toContain(result.status);
  });
});
