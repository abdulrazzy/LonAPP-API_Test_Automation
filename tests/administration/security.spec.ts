import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, responseText } from '../../src/client/api';
import { uniqueName } from '../../src/data/builders';

test.describe('Administration security (platform admin context)', () => {
  test('unauthenticated department create is rejected', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      data: {
        departmentInitial: 'NA',
        departmentName: uniqueName('noauth'),
      },
    });
    expectFailure(result, [401, 403]);
  });

  test('unauthenticated staff-accounts list is rejected', async ({ request }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/staff-accounts');
    expectFailure(result, [401, 403]);
  });

  test('unauthenticated user-role create is rejected', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/user-role', {
      data: {
        roleName: uniqueName('role'),
        roleKind: 0,
      },
    });
    expectFailure(result, [401, 403]);
  });

  test('tampered bearer cannot list staff accounts', async ({ request, platformAdmin }) => {
    // GET departments is publicly readable on staging; staff-accounts requires auth.
    const tampered = `${platformAdmin.bearerToken.slice(0, -6)}xxxxxx`;
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/staff-accounts', {
      token: tampered,
    });
    expectFailure(result, [401, 403]);
  });

  test('garbage bearer cannot create platform service', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/platform-services', {
      token: 'not.a.jwt',
      data: {
        serviceCode: 'GARBAGE1',
        serviceInitial: 'GB',
        serviceName: uniqueName('svc'),
        displayOrder: 1,
        isCore: false,
        isActive: true,
      },
    });
    expectFailure(result, [401, 403]);
  });

  test('error responses do not echo secrets from login-like payloads on assign-role', async ({
    request,
    platformAdmin,
  }) => {
    const secret = 'ShouldNotEcho-99!';
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/assign-role-to-user', {
      token: platformAdmin.bearerToken,
      data: {
        emailAddress: 'nobody-api-test@example.com',
        roleName: secret,
      },
    });
    expectFailure(result, [400, 404, 422]);
    expect(responseText(result.body)).not.toContain(secret);
  });
});
