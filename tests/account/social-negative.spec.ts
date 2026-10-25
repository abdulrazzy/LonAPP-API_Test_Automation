import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, responseText } from '../../src/client/api';
import { firstId } from '../../src/data/reference';

test.describe('Social auth negative cases', () => {
  test('Google register rejects missing token', async ({ request, referenceData }) => {
    const channelId = firstId(referenceData.channels as Array<Record<string, unknown>>, 'channelId', 'id');
    const result = await apiRequest(request, 'POST', '/api/v1/Account/register/google', {
      data: {
        idToken: '',
        name: 'Api Tester',
        email: 'social-neg@example.com',
        channelId,
      },
    });
    expectFailure(result, [400, 401, 422]);
  });

  test('Google login rejects garbage token', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Account/login/google', {
      data: {
        idToken: 'not-a-real-google-token',
      },
    });
    expectFailure(result, [400, 401, 422]);
    expect(responseText(result.body)).not.toMatch(/bearerToken":"[^"]{20,}/);
  });

  test('Facebook register rejects garbage token', async ({ request, referenceData }) => {
    const channelId = firstId(referenceData.channels as Array<Record<string, unknown>>, 'channelId', 'id');
    const result = await apiRequest(request, 'POST', '/api/v1/Account/register/facebook', {
      data: {
        token: 'garbage-facebook-token',
        channelId,
      },
    });
    expectFailure(result, [400, 401, 422]);
  });

  test('Apple login rejects garbage token', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Account/login/apple', {
      data: {
        identityToken: 'garbage-apple-token',
        userIdentifier: 'api-test-user',
      },
    });
    expectFailure(result, [400, 401, 422]);
  });
});
