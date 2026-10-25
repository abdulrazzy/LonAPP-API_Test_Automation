import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { uniqueName } from '../../src/data/builders';

test.describe('Tenant platform admin access', () => {
  test('platform admin can list tenants', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Tenants', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('unauthenticated tenant list is rejected', async ({ request }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Tenants');
    expectFailure(result, [401, 403]);
  });

  test('business owner cannot list all tenants', async ({ request, businessOwnerTenant }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Tenants', {
      token: businessOwnerTenant.session.bearerToken,
    });
    expectFailure(result, [401, 403]);
  });

  test('platform admin can get tenant by id when known', async ({
    request,
    platformAdmin,
    businessOwnerTenant,
  }) => {
    test.skip(!businessOwnerTenant.tenantId, 'Tenant id was not returned from registration/login');
    const result = await apiRequest(
      request,
      'GET',
      `/api/v1/Tenants/${businessOwnerTenant.tenantId}`,
      { token: platformAdmin.bearerToken },
    );
    expectSuccess(result, 200);
  });

  test('business owner cannot update another tenant id', async ({
    request,
    businessOwnerTenant,
  }) => {
    const foreignId = '00000000-0000-4000-8000-000000000001';
    const result = await apiRequest(request, 'PUT', `/api/v1/Tenants/${foreignId}`, {
      token: businessOwnerTenant.session.bearerToken,
      data: {
        businessName: uniqueName('hijack'),
      },
    });
    expectFailure(result, [401, 403, 404]);
  });

  test('GET Tenants/me is deprecated but should not crash', async ({
    request,
    businessOwnerTenant,
  }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Tenants/me', {
      token: businessOwnerTenant.session.bearerToken,
    });
    expect([200, 400, 404, 410]).toContain(result.status);
  });
});
