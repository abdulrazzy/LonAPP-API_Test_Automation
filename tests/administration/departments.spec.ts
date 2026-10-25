import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import {
  createDepartment,
  deleteDepartment,
} from '../../src/data/administration';
import { uniqueName } from '../../src/data/builders';
import { asArray } from '../../src/data/ids';

test.describe('Administration departments (platform admin)', () => {
  test('lists departments', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/departments', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
    expect(Array.isArray(result.body.data) || result.body.data !== undefined).toBeTruthy();
  });

  test('lists departments-and-units', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/departments-and-units', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('creates, updates, and deletes a department', async ({ request, platformAdmin }) => {
    const token = platformAdmin.bearerToken;
    const { departmentId, departmentName } = await createDepartment(request, token);

    const updatedName = `${departmentName}-upd`;
    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/department', {
      token,
      data: {
        departmentId,
        departmentInitial: 'AU',
        departmentName: updatedName,
      },
    });
    expectSuccess(update, [200, 201]);

    const list = await apiRequest(request, 'GET', '/api/v1/Administration/departments', {
      token,
    });
    expectSuccess(list, 200);
    const rows = asArray(list.body.data);
    expect(rows.some((r) => String(r.departmentName || '') === updatedName)).toBeTruthy();

    const del = await apiRequest(request, 'DELETE', `/api/v1/Administration/department/${departmentId}`, {
      token,
    });
    expectSuccess(del, 200);
  });

  test('rejects empty department name', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      token: platformAdmin.bearerToken,
      data: {
        departmentInitial: `E${Date.now().toString(36).slice(-2)}`.toUpperCase().slice(0, 3),
        departmentName: '',
      },
    });
    expectFailure(result, [400, 422]);
  });

  test('rejects missing departmentName', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      token: platformAdmin.bearerToken,
      data: {
        departmentInitial: `M${Date.now().toString(36).slice(-2)}`.toUpperCase().slice(0, 3),
      },
    });
    expectFailure(result, [400, 422]);
  });

  test('delete unknown department id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'DELETE', '/api/v1/Administration/department/99999999', {
      token: platformAdmin.bearerToken,
    });
    expectFailure(result, [400, 404]);
  });

  test('update unknown department id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'PUT', '/api/v1/Administration/department', {
      token: platformAdmin.bearerToken,
      data: {
        departmentId: 99999999,
        departmentInitial: 'ZZ',
        departmentName: uniqueName('missing'),
      },
    });
    expectFailure(result, [400, 404]);
  });

  test('hostile department name is rejected or safely stored', async ({ request, platformAdmin }) => {
    const token = platformAdmin.bearerToken;
    const hostile = `api-test<script>alert(1)</script>${'文'.repeat(80)}`;
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      token,
      data: {
        departmentInitial: 'HX',
        departmentName: hostile,
      },
    });

    expect(result.body).toHaveProperty('isSuccess');
    if (result.body.isSuccess) {
      const list = await apiRequest(request, 'GET', '/api/v1/Administration/departments', { token });
      const rows = asArray(list.body.data);
      const match = rows.find((r) => String(r.departmentName || '').includes('api-test<script>'));
      if (match?.departmentId) {
        await deleteDepartment(request, token, Number(match.departmentId));
      }
    } else {
      expect([400, 422]).toContain(result.status);
    }
  });
});
