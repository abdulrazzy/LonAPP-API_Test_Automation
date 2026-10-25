import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, responseText } from '../../src/client/api';
import { uniqueName } from '../../src/data/builders';

test.describe('Security and authorization', () => {
  test('missing bearer is rejected on protected routes', async ({ request }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Account/session');
    expectFailure(result, [401, 403]);
  });

  test('tampered bearer is rejected', async ({ request, platformAdmin }) => {
    const tampered = `${platformAdmin.bearerToken.slice(0, -4)}xxxx`;
    const result = await apiRequest(request, 'GET', '/api/v1/Account/session', {
      token: tampered,
    });
    expectFailure(result, [401, 403]);
  });

  test('business owner cannot list all tenants', async ({ request, businessOwnerTenant }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Tenants', {
      token: businessOwnerTenant.session.bearerToken,
    });
    expectFailure(result, [401, 403]);
  });

  test('business owner cannot deactivate another tenant', async ({
    request,
    businessOwnerTenant,
  }) => {
    const foreignId = '00000000-0000-4000-8000-000000000001';
    const result = await apiRequest(request, 'PUT', `/api/v1/Tenants/${foreignId}/deactivate`, {
      token: businessOwnerTenant.session.bearerToken,
    });
    expectFailure(result, [401, 403, 404]);
  });

  test('business owner cannot create required documents', async ({
    request,
    businessOwnerTenant,
  }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/configuration/required-documents', {
      token: businessOwnerTenant.session.bearerToken,
      data: {
        requiredDocumentName: uniqueName('owner-forbid'),
        isMandatory: false,
        isActive: true,
        sortOrder: 1,
      },
    });
    expectFailure(result, [401, 403]);
  });

  test('garbage bearer cannot create departments', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      token: 'not.a.real.jwt',
      data: {
        departmentInitial: 'CF',
        departmentName: uniqueName('bad-dept'),
      },
    });
    expectFailure(result, [401, 403]);
  });

  test('login error responses do not echo password', async ({ request }) => {
    const password = 'SecretEchoCheck-99!';
    const result = await apiRequest(request, 'POST', '/api/v1/Account/login', {
      data: {
        phone_OR_Email: 'not-a-user@example.com',
        password,
      },
    });
    expectFailure(result, [400, 401, 404]);
    expect(responseText(result.body)).not.toContain(password);
  });

  test('hostile strings are rejected or safely enveloped on department create', async ({
    request,
    businessOwnerTenant,
  }) => {
    const hostile = `api-test<script>alert(1)</script>"'${'文'.repeat(200)}`;
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      token: businessOwnerTenant.session.bearerToken,
      data: {
        departmentInitial: 'HX',
        departmentName: hostile,
      },
    });

    expect(result.body).toHaveProperty('isSuccess');
    expect(result.body.correlationId !== undefined || result.body.isSuccess !== undefined).toBeTruthy();

    if (result.body.isSuccess) {
      const id =
        result.body.data && typeof result.body.data === 'object'
          ? (result.body.data as { departmentId?: number; id?: number }).departmentId ||
            (result.body.data as { id?: number }).id
          : undefined;
      if (id) {
        await apiRequest(request, 'DELETE', `/api/v1/Administration/department/${id}`, {
          token: businessOwnerTenant.session.bearerToken,
        });
      }
    } else {
      expect([400, 422]).toContain(result.status);
    }
  });
});
