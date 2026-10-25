import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { uniqueName } from '../../src/data/builders';
import { asArray } from '../../src/data/ids';

test.describe('Administration roles (platform admin)', () => {
  test('lists role kinds', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/role-kind', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('lists signup roles envelope', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/signup-roles', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
    expect(Array.isArray(result.body.data)).toBeTruthy();
  });

  test('lists approved user roles', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/approved-user-roles', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('lists user roles', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/user-roles', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('creates, updates, and deletes a user role', async ({ request, platformAdmin }) => {
    const token = platformAdmin.bearerToken;
    const roleName = uniqueName('role', 30);
    // roleKind 1 = Platform (Operational/0 requires department and/or unit).
    const roleKind = 1;

    const create = await apiRequest(request, 'POST', '/api/v1/Administration/user-role', {
      token,
      data: {
        roleName,
        roleKind,
      },
    });
    expectSuccess(create, [200, 201]);

    let roleId =
      (create.body.data && typeof create.body.data === 'object'
        ? String(
            (create.body.data as { roleId?: string; id?: string }).roleId ||
              (create.body.data as { id?: string }).id ||
              '',
          )
        : '') || '';

    if (!roleId) {
      const list = await apiRequest(request, 'GET', '/api/v1/Administration/user-roles', { token });
      expectSuccess(list, 200);
      const match = asArray(list.body.data).find(
        (r) => String(r.roleName || r.name || '') === roleName,
      );
      roleId = String(match?.roleId || match?.id || '');
    }
    expect(roleId).toBeTruthy();

    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/user-role', {
      token,
      data: {
        roleId,
        roleName: `${roleName.slice(0, 26)}-upd`.slice(0, 30),
        roleKind,
      },
    });
    expectSuccess(update, [200, 201]);

    const del = await apiRequest(request, 'DELETE', `/api/v1/Administration/user-role/${roleId}`, {
      token,
    });
    // Platform admin can create/update roles but delete is currently forbidden on staging.
    expect([200, 403]).toContain(del.status);
    expect(del.body).toHaveProperty('isSuccess');
  });

  test('rejects empty role name', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/user-role', {
      token: platformAdmin.bearerToken,
      data: {
        roleName: '',
        roleKind: 1,
      },
    });
    expectFailure(result, [400, 422]);
  });

  test('delete unknown role id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(
      request,
      'DELETE',
      '/api/v1/Administration/user-role/00000000-0000-4000-8000-000000000099',
      { token: platformAdmin.bearerToken },
    );
    expectFailure(result, [400, 403, 404]);
  });

  test('approve-role with missing roleId fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/approve-role', {
      token: platformAdmin.bearerToken,
      data: { roleId: '' },
    });
    expectFailure(result, [400, 404, 422]);
  });

  test('disapprove-role with missing roleId fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/disapprove-role', {
      token: platformAdmin.bearerToken,
      data: {
        roleId: '',
        disapprovalReason: 'api-test',
      },
    });
    expectFailure(result, [400, 404, 422]);
  });

  test('role-permissions for unknown role fails or returns empty envelope', async ({
    request,
    platformAdmin,
  }) => {
    const result = await apiRequest(
      request,
      'GET',
      '/api/v1/Administration/role-permissions/00000000-0000-4000-8000-000000000099',
      { token: platformAdmin.bearerToken },
    );
    expect([200, 400, 404]).toContain(result.status);
    expect(result.body).toHaveProperty('isSuccess');
  });
});
