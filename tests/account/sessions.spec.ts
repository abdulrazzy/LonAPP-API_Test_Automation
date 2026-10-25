import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { loginWithPassword } from '../../src/auth/platformAdmin';

test.describe('Account sessions and logout', () => {
  test('logout revokes the current device session for a tenant user', async ({
    request,
    businessOwnerTenant,
  }) => {
    const secondary = await loginWithPassword(
      request,
      businessOwnerTenant.adminEmail,
      businessOwnerTenant.password,
    );

    const logout = await apiRequest(request, 'POST', '/api/v1/Account/logout', {
      token: secondary.bearerToken,
    });
    expectSuccess(logout, 200);

    const session = await apiRequest(request, 'GET', '/api/v1/Account/session', {
      token: secondary.bearerToken,
    });
    expectFailure(session, [401, 403]);
  });

  test('revoking a random session id matches not-found style failure', async ({
    request,
    businessOwnerTenant,
  }) => {
    const fakeSessionId = '00000000-0000-4000-8000-000000000099';

    const revoke = await apiRequest(
      request,
      'POST',
      `/api/v1/Account/sessions/${fakeSessionId}/revoke`,
      { token: businessOwnerTenant.session.bearerToken },
    );
    expectFailure(revoke, [400, 404]);
  });

  test('revoke-others succeeds for authenticated tenant user', async ({
    request,
    businessOwnerTenant,
  }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Account/sessions/revoke-others', {
      token: businessOwnerTenant.session.bearerToken,
    });
    expect([200, 204]).toContain(result.status);
    expect(result.body.isSuccess !== false || result.status === 204).toBeTruthy();
  });
});
