import { APIRequestContext } from '@playwright/test';
import { apiRequest, expectSuccess } from '../client/api';
import { uniqueName } from './builders';
import { asArray, extractId, findByName } from './ids';

async function listRows(
  request: APIRequestContext,
  token: string,
  path: string,
): Promise<Array<Record<string, unknown>>> {
  const result = await apiRequest(request, 'GET', path, { token });
  expectSuccess(result, 200);
  return asArray(result.body.data);
}

function uniqueInitial(prefix = 'A'): string {
  // API stores short initials; keep 2–3 chars and avoid collisions across runs.
  const chars = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${prefix}${chars.slice(-2)}`.slice(0, 3);
}

export async function createDepartment(
  request: APIRequestContext,
  token: string,
  overrides: { departmentInitial?: string; departmentName?: string } = {},
): Promise<{ departmentId: number; departmentName: string }> {
  const departmentName = overrides.departmentName || uniqueName('dept');
  const create = await apiRequest(request, 'POST', '/api/v1/Administration/department', {
    token,
    data: {
      departmentInitial: overrides.departmentInitial || uniqueInitial('D'),
      departmentName,
    },
  });
  expectSuccess(create, [200, 201]);

  let departmentId = extractId(create.body.data, 'departmentId', 'id');
  if (!departmentId) {
    const rows = await listRows(request, token, '/api/v1/Administration/departments');
    const match = findByName(rows, departmentName, 'departmentName', 'name');
    departmentId = extractId(match, 'departmentId', 'id');
  }
  if (!departmentId) throw new Error(`Department not found after create: ${departmentName}`);
  return { departmentId, departmentName };
}

export async function deleteDepartment(
  request: APIRequestContext,
  token: string,
  departmentId: number,
): Promise<void> {
  await apiRequest(request, 'DELETE', `/api/v1/Administration/department/${departmentId}`, {
    token,
  });
}

export async function createUnit(
  request: APIRequestContext,
  token: string,
  departmentId: number,
  overrides: { unitInitial?: string; unitName?: string } = {},
): Promise<{ unitId: number; unitName: string }> {
  const unitName = (overrides.unitName || uniqueName('unit')).slice(0, 50);
  const create = await apiRequest(request, 'POST', '/api/v1/Administration/unit', {
    token,
    data: {
      departmentId,
      unitInitial: overrides.unitInitial || uniqueInitial('U'),
      unitName,
    },
  });
  expectSuccess(create, [200, 201]);

  let unitId = extractId(create.body.data, 'unitId', 'id');
  if (!unitId) {
    const rows = await listRows(
      request,
      token,
      `/api/v1/Administration/units-by-department/${departmentId}`,
    );
    const match = findByName(rows, unitName, 'unitName', 'name');
    unitId = extractId(match, 'unitId', 'id');
  }
  if (!unitId) {
    const all = await listRows(request, token, '/api/v1/Administration/units');
    const match = findByName(all, unitName, 'unitName', 'name');
    unitId = extractId(match, 'unitId', 'id');
  }
  if (!unitId) throw new Error(`Unit not found after create: ${unitName}`);
  return { unitId, unitName };
}

export async function deleteUnit(
  request: APIRequestContext,
  token: string,
  unitId: number,
): Promise<void> {
  await apiRequest(request, 'DELETE', `/api/v1/Administration/unit/${unitId}`, { token });
}

export async function createPosition(
  request: APIRequestContext,
  token: string,
  overrides: { positionName?: string } = {},
): Promise<{ positionId: number; positionName: string }> {
  const positionName = overrides.positionName || uniqueName('pos');
  const create = await apiRequest(request, 'POST', '/api/v1/Administration/position', {
    token,
    data: { positionName },
  });
  expectSuccess(create, [200, 201]);

  let positionId = extractId(create.body.data, 'positionId', 'id');
  if (!positionId) {
    const rows = await listRows(request, token, '/api/v1/Administration/positions');
    const match = findByName(rows, positionName, 'positionName', 'name');
    positionId = extractId(match, 'positionId', 'id');
  }
  if (!positionId) throw new Error(`Position not found after create: ${positionName}`);
  return { positionId, positionName };
}

export async function deletePosition(
  request: APIRequestContext,
  token: string,
  positionId: number,
): Promise<void> {
  await apiRequest(request, 'DELETE', `/api/v1/Administration/position/${positionId}`, {
    token,
  });
}

export async function createChannel(
  request: APIRequestContext,
  token: string,
  overrides: { channelName?: string } = {},
): Promise<{ channelId: number; channelName: string }> {
  const channelName = overrides.channelName || uniqueName('chan');
  const create = await apiRequest(request, 'POST', '/api/v1/Administration/channel', {
    token,
    data: { channelName },
  });
  expectSuccess(create, [200, 201]);

  let channelId = extractId(create.body.data, 'channelId', 'id');
  if (!channelId) {
    const rows = await listRows(request, token, '/api/v1/Administration/channels');
    const match = findByName(rows, channelName, 'channelName', 'name');
    channelId = extractId(match, 'channelId', 'id');
  }
  if (!channelId) throw new Error(`Channel not found after create: ${channelName}`);
  return { channelId, channelName };
}

export async function deleteChannel(
  request: APIRequestContext,
  token: string,
  channelId: number,
): Promise<void> {
  await apiRequest(request, 'DELETE', `/api/v1/Administration/channel/${channelId}`, {
    token,
  });
}
