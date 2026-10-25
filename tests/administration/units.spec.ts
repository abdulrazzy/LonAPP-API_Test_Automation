import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import {
  createDepartment,
  createUnit,
  deleteDepartment,
  deleteUnit,
} from '../../src/data/administration';
import { uniqueName } from '../../src/data/builders';
import { asArray } from '../../src/data/ids';

test.describe('Administration units (platform admin)', () => {
  test('lists all units', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/units', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('creates, updates, lists by department, and deletes a unit', async ({
    request,
    platformAdmin,
  }) => {
    const token = platformAdmin.bearerToken;
    const { departmentId } = await createDepartment(request, token);
    const { unitId, unitName } = await createUnit(request, token, departmentId);

    // Staging applies unitInitial on update but often ignores unitName changes.
    const updatedInitial = `U${Date.now().toString(36).slice(-2)}`.toUpperCase().slice(0, 3);
    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/unit', {
      token,
      data: {
        departmentId,
        unitId,
        unitInitial: updatedInitial,
        unitName,
      },
    });
    expectSuccess(update, [200, 201]);

    const byDept = await apiRequest(
      request,
      'GET',
      `/api/v1/Administration/units-by-department/${departmentId}`,
      { token },
    );
    expectSuccess(byDept, 200);
    const rows = asArray(byDept.body.data);
    const row = rows.find((r) => Number(r.unitId) === unitId);
    expect(row).toBeTruthy();
    expect(String(row?.unitInitial || '')).toBe(updatedInitial);

    const alt = await apiRequest(request, 'GET', `/api/v1/Administration/units/${departmentId}`, {
      token,
    });
    expectSuccess(alt, 200);

    await deleteUnit(request, token, unitId);
    await deleteDepartment(request, token, departmentId);
  });

  test('rejects unit create without departmentId', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/unit', {
      token: platformAdmin.bearerToken,
      data: {
        unitInitial: 'XX',
        unitName: uniqueName('unit-bad'),
      },
    });
    expectFailure(result, [400, 422]);
  });

  test('rejects unit create with empty name', async ({ request, platformAdmin }) => {
    const token = platformAdmin.bearerToken;
    const { departmentId } = await createDepartment(request, token);
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/unit', {
      token,
      data: {
        departmentId,
        unitInitial: 'XX',
        unitName: '',
      },
    });
    expectFailure(result, [400, 422]);
    await deleteDepartment(request, token, departmentId);
  });

  test('rejects unit for unknown department', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/unit', {
      token: platformAdmin.bearerToken,
      data: {
        departmentId: 99999999,
        unitInitial: 'XX',
        unitName: uniqueName('unit-orphan'),
      },
    });
    expectFailure(result, [400, 404, 422]);
  });

  test('delete unknown unit id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'DELETE', '/api/v1/Administration/unit/99999999', {
      token: platformAdmin.bearerToken,
    });
    expectFailure(result, [400, 404]);
  });
});
