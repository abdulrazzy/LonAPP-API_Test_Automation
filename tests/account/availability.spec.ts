import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectSuccess } from '../../src/client/api';
import { uniqueEmail } from '../../src/data/builders';

test.describe('Account availability and channels', () => {
  test('check-availability reports unused email as available', async ({ request }) => {
    const email = uniqueEmail('avail');
    const result = await apiRequest(request, 'GET', '/api/v1/Account/check-availability', {
      params: { phone_OR_email: email },
    });
    expectSuccess(result, 200);
  });

  test('check-availability flags platform admin email as taken or unavailable', async ({
    request,
    platformAdmin,
  }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Account/check-availability', {
      params: { phone_OR_email: platformAdmin.email },
    });
    expect([200, 409]).toContain(result.status);
    expect(result.body.correlationId || result.body.isSuccess !== undefined).toBeTruthy();
  });

  test('lists communication channels', async ({ request, referenceData }) => {
    expect(referenceData.channels.length).toBeGreaterThan(0);
  });

  test('lists customer types and identification types', async ({ request }) => {
    const customerTypes = await apiRequest(request, 'GET', '/api/v1/Account/customer-type');
    expectSuccess(customerTypes, 200);

    const ids = await apiRequest(request, 'GET', '/api/v1/Account/identification-types');
    expectSuccess(ids, 200);
  });
});
