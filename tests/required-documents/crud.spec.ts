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
  return undefined;
}

test.describe('Required documents', () => {
  test('platform admin can list required documents', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/configuration/required-documents', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
  });

  test('platform admin can create, update, and delete a required document', async ({
    request,
    platformAdmin,
  }) => {
    const token = platformAdmin.bearerToken;
    const name = uniqueName('reqdoc');

    const create = await apiRequest(request, 'POST', '/api/v1/configuration/required-documents', {
      token,
      data: {
        requiredDocumentName: name,
        isMandatory: false,
        isActive: true,
        sortOrder: 99,
      },
    });
    expectSuccess(create, [200, 201]);

    let requiredDocumentId = extractId(create.body.data, 'requiredDocumentId', 'id');
    if (!requiredDocumentId) {
      const list = await apiRequest(request, 'GET', '/api/v1/configuration/required-documents', {
        token,
      });
      expectSuccess(list, 200);
      const rows = Array.isArray(list.body.data)
        ? list.body.data
        : ((list.body.data as { items?: unknown[] } | null)?.items ?? []);
      const match = (rows as Array<Record<string, unknown>>).find((row) =>
        String(row.requiredDocumentName || row.name || '').includes(name),
      );
      requiredDocumentId = extractId(match, 'requiredDocumentId', 'id');
    }
    expect(requiredDocumentId).toBeTruthy();

    const update = await apiRequest(request, 'PUT', '/api/v1/configuration/required-documents', {
      token,
      data: {
        requiredDocumentId,
        requiredDocumentName: `${name}-updated`,
        isMandatory: true,
        isActive: true,
        sortOrder: 100,
      },
    });
    expectSuccess(update, 200);

    const del = await apiRequest(
      request,
      'DELETE',
      `/api/v1/configuration/required-documents/${requiredDocumentId}`,
      { token },
    );
    expectSuccess(del, 200);
  });

  test('rejects empty required document name', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/configuration/required-documents', {
      token: platformAdmin.bearerToken,
      data: {
        requiredDocumentName: '',
        isMandatory: false,
        isActive: true,
        sortOrder: 1,
      },
    });
    expectFailure(result, [400, 422]);
  });

  test('business owner cannot create required documents', async ({
    request,
    businessOwnerTenant,
  }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/configuration/required-documents', {
      token: businessOwnerTenant.session.bearerToken,
      data: {
        requiredDocumentName: uniqueName('forbidden'),
        isMandatory: false,
        isActive: true,
        sortOrder: 1,
      },
    });
    expectFailure(result, [401, 403]);
  });
});
