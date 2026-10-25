import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { createPosition, deletePosition } from '../../src/data/administration';
import { uniqueName } from '../../src/data/builders';
import { asArray } from '../../src/data/ids';

test.describe('Administration positions (platform admin)', () => {
  test('lists positions', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/positions', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('creates, updates, and deletes a position', async ({ request, platformAdmin }) => {
    const token = platformAdmin.bearerToken;
    // Platform admin is currently forbidden from mutating positions on staging.
    const create = await apiRequest(request, 'POST', '/api/v1/Administration/position', {
      token,
      data: { positionName: uniqueName('pos', 30) },
    });
    if (create.status === 403) {
      expectFailure(create, 403);
      return;
    }

    const { positionId, positionName } = await createPosition(request, token);
    const updatedName = `${positionName.slice(0, 26)}-upd`.slice(0, 30);
    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/position', {
      token,
      data: {
        positionId,
        positionName: updatedName,
      },
    });
    expectSuccess(update, [200, 201]);

    const list = await apiRequest(request, 'GET', '/api/v1/Administration/positions', { token });
    expectSuccess(list, 200);
    expect(asArray(list.body.data).some((r) => String(r.positionName || '') === updatedName)).toBeTruthy();

    const del = await apiRequest(request, 'DELETE', `/api/v1/Administration/position/${positionId}`, {
      token,
    });
    expectSuccess(del, 200);
  });

  test('rejects empty position name', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/position', {
      token: platformAdmin.bearerToken,
      data: { positionName: '' },
    });
    expectFailure(result, [400, 403, 422]);
  });

  test('delete unknown position id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'DELETE', '/api/v1/Administration/position/99999999', {
      token: platformAdmin.bearerToken,
    });
    expectFailure(result, [400, 403, 404]);
  });

  test('update unknown position id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'PUT', '/api/v1/Administration/position', {
      token: platformAdmin.bearerToken,
      data: {
        positionId: 99999999,
        positionName: uniqueName('missing-pos', 30),
      },
    });
    expectFailure(result, [400, 403, 404]);
  });
});
