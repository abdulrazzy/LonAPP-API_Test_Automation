import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { uniqueName, uniqueTag } from '../../src/data/builders';
import { asArray, extractId, findByName } from '../../src/data/ids';

test.describe('Administration platform services (platform admin)', () => {
  test('lists platform services', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/platform-services', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('lists active-only platform services', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/platform-services', {
      token: platformAdmin.bearerToken,
      params: { activeOnly: true },
    });
    expectSuccess(result, 200);
  });

  test('creates, updates, and deactivates a platform service', async ({
    request,
    platformAdmin,
  }) => {
    const token = platformAdmin.bearerToken;
    const tag = uniqueTag('svc');
    const serviceName = uniqueName('platsvc');
    const serviceCode = `API${tag}`.slice(0, 20).toUpperCase();

    const create = await apiRequest(request, 'POST', '/api/v1/Administration/platform-services', {
      token,
      data: {
        serviceCode,
        serviceInitial: 'AS',
        serviceName,
        description: 'api-test platform service',
        icon: null,
        displayOrder: 99,
        isCore: false,
        isActive: true,
      },
    });
    expectSuccess(create, [200, 201]);

    let serviceId = extractId(create.body.data, 'serviceId', 'id', 'platformServiceId');
    if (!serviceId) {
      const list = await apiRequest(request, 'GET', '/api/v1/Administration/platform-services', {
        token,
      });
      expectSuccess(list, 200);
      const match = findByName(asArray(list.body.data), serviceName, 'serviceName', 'name');
      serviceId = extractId(match, 'serviceId', 'id', 'platformServiceId');
    }
    expect(serviceId).toBeTruthy();

    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/platform-services', {
      token,
      data: {
        serviceId,
        serviceCode,
        serviceInitial: 'AU',
        serviceName: `${serviceName}-upd`,
        description: 'api-test updated',
        icon: null,
        displayOrder: 100,
        isCore: false,
        isActive: true,
      },
    });
    expectSuccess(update, [200, 201]);

    const deactivate = await apiRequest(
      request,
      'DELETE',
      `/api/v1/Administration/deactivate-platform-services/${serviceId}`,
      { token },
    );
    expectSuccess(deactivate, 200);
  });

  test('rejects platform service create with empty name', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/platform-services', {
      token: platformAdmin.bearerToken,
      data: {
        serviceCode: `BAD${Date.now()}`.slice(0, 12),
        serviceInitial: 'BD',
        serviceName: '',
        description: 'bad',
        displayOrder: 1,
        isCore: false,
        isActive: true,
      },
    });
    expectFailure(result, [400, 422]);
  });

  test('deactivate unknown platform service fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(
      request,
      'DELETE',
      '/api/v1/Administration/deactivate-platform-services/99999999',
      { token: platformAdmin.bearerToken },
    );
    expectFailure(result, [400, 404]);
  });
});
