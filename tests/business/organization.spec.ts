import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { uniqueName } from '../../src/data/builders';

function extractId(data: unknown, ...keys: string[]): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const row = data as Record<string, unknown>;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  }
  for (const nestedKey of ['data', 'item', 'result']) {
    if (row[nestedKey] && typeof row[nestedKey] === 'object') {
      const nested = extractId(row[nestedKey], ...keys);
      if (nested) return nested;
    }
  }
  return undefined;
}

test.describe('Business organization CRUD', () => {
  test('business owner can create, update, and delete a department', async ({
    request,
    businessOwnerTenant,
  }) => {
    const token = businessOwnerTenant.session.bearerToken;
    const name = uniqueName('dept');

    const create = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      token,
      data: {
        departmentInitial: 'AT',
        departmentName: name,
      },
    });
    expectSuccess(create, 200);
    const departmentId = extractId(create.body.data, 'departmentId', 'id');
    expect(departmentId).toBeTruthy();

    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/department', {
      token,
      data: {
        departmentId,
        departmentInitial: 'AU',
        departmentName: `${name}-updated`,
      },
    });
    expectSuccess(update, 200);

    const list = await apiRequest(request, 'GET', '/api/v1/Administration/departments', {
      token,
    });
    expectSuccess(list, 200);

    const del = await apiRequest(request, 'DELETE', `/api/v1/Administration/department/${departmentId}`, {
      token,
    });
    expectSuccess(del, 200);
  });

  test('business owner can create unit under a department', async ({
    request,
    businessOwnerTenant,
  }) => {
    const token = businessOwnerTenant.session.bearerToken;

    const dept = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      token,
      data: {
        departmentInitial: 'UT',
        departmentName: uniqueName('dept-unit'),
      },
    });
    expectSuccess(dept, 200);
    const departmentId = extractId(dept.body.data, 'departmentId', 'id');
    expect(departmentId).toBeTruthy();

    const unit = await apiRequest(request, 'POST', '/api/v1/Administration/unit', {
      token,
      data: {
        departmentId,
        unitInitial: 'UN',
        unitName: uniqueName('unit'),
      },
    });
    expectSuccess(unit, 200);
    const unitId = extractId(unit.body.data, 'unitId', 'id');
    expect(unitId).toBeTruthy();

    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/unit', {
      token,
      data: {
        departmentId,
        unitId,
        unitInitial: 'UU',
        unitName: uniqueName('unit-upd'),
      },
    });
    expectSuccess(update, 200);

    await apiRequest(request, 'DELETE', `/api/v1/Administration/unit/${unitId}`, { token });
    await apiRequest(request, 'DELETE', `/api/v1/Administration/department/${departmentId}`, {
      token,
    });
  });

  test('business owner can create, update, and delete a position', async ({
    request,
    businessOwnerTenant,
  }) => {
    const token = businessOwnerTenant.session.bearerToken;
    const create = await apiRequest(request, 'POST', '/api/v1/Administration/position', {
      token,
      data: { positionName: uniqueName('pos') },
    });
    expectSuccess(create, 200);
    const positionId = extractId(create.body.data, 'positionId', 'id');
    expect(positionId).toBeTruthy();

    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/position', {
      token,
      data: {
        positionId,
        positionName: uniqueName('pos-upd'),
      },
    });
    expectSuccess(update, 200);

    const list = await apiRequest(request, 'GET', '/api/v1/Administration/positions', { token });
    expectSuccess(list, 200);

    const del = await apiRequest(request, 'DELETE', `/api/v1/Administration/position/${positionId}`, {
      token,
    });
    expectSuccess(del, 200);
  });

  test('business owner can create, update, and delete a channel', async ({
    request,
    businessOwnerTenant,
  }) => {
    const token = businessOwnerTenant.session.bearerToken;
    const create = await apiRequest(request, 'POST', '/api/v1/Administration/channel', {
      token,
      data: { channelName: uniqueName('chan') },
    });
    expectSuccess(create, 200);
    const channelId = extractId(create.body.data, 'channelId', 'id');
    expect(channelId).toBeTruthy();

    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/channel', {
      token,
      data: {
        channelId,
        channelName: uniqueName('chan-upd'),
      },
    });
    expectSuccess(update, 200);

    const list = await apiRequest(request, 'GET', '/api/v1/Administration/channels', { token });
    expectSuccess(list, 200);

    const del = await apiRequest(request, 'DELETE', `/api/v1/Administration/channel/${channelId}`, {
      token,
    });
    expectSuccess(del, 200);
  });

  test('unauthenticated department create is rejected', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
      data: {
        departmentInitial: 'XX',
        departmentName: uniqueName('noauth'),
      },
    });
    expectFailure(result, [401, 403]);
  });
});
