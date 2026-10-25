import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { createChannel, deleteChannel } from '../../src/data/administration';
import { uniqueName } from '../../src/data/builders';
import { asArray } from '../../src/data/ids';

test.describe('Administration channels (platform admin)', () => {
  test('lists channels', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'GET', '/api/v1/Administration/channels', {
      token: platformAdmin.bearerToken,
    });
    expectSuccess(result, 200);
    expect(asArray(result.body.data).length).toBeGreaterThan(0);
  });

  test('creates, updates, and deletes a channel', async ({ request, platformAdmin }) => {
    const token = platformAdmin.bearerToken;
    const { channelId, channelName } = await createChannel(request, token);

    const updatedName = `${channelName}-upd`;
    const update = await apiRequest(request, 'PUT', '/api/v1/Administration/channel', {
      token,
      data: {
        channelId,
        channelName: updatedName,
      },
    });
    expectSuccess(update, [200, 201]);

    const list = await apiRequest(request, 'GET', '/api/v1/Administration/channels', { token });
    expectSuccess(list, 200);
    expect(asArray(list.body.data).some((r) => String(r.channelName || '') === updatedName)).toBeTruthy();

    const del = await apiRequest(request, 'DELETE', `/api/v1/Administration/channel/${channelId}`, {
      token,
    });
    expectSuccess(del, 200);
  });

  test('rejects empty channel name', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Administration/channel', {
      token: platformAdmin.bearerToken,
      data: { channelName: '' },
    });
    expectFailure(result, [400, 422]);
  });

  test('delete unknown channel id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'DELETE', '/api/v1/Administration/channel/99999999', {
      token: platformAdmin.bearerToken,
    });
    expectFailure(result, [400, 404]);
  });

  test('update unknown channel id fails', async ({ request, platformAdmin }) => {
    const result = await apiRequest(request, 'PUT', '/api/v1/Administration/channel', {
      token: platformAdmin.bearerToken,
      data: {
        channelId: 99999999,
        channelName: uniqueName('missing-chan'),
      },
    });
    expectFailure(result, [400, 404]);
  });
});
