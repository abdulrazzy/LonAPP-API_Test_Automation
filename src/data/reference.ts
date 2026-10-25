import { APIRequestContext } from '@playwright/test';
import { apiRequest, expectSuccess } from '../client/api';
import type { ReferenceData, SignupRole } from '../types/api';

function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'value', 'records']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

function pickId(row: Record<string, unknown>, ...keys: string[]): number | string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value as number | string;
  }
  return undefined;
}

function pickName(row: Record<string, unknown>): string {
  for (const key of ['name', 'roleName', 'displayName', 'countryName', 'currencyName', 'channelName', 'title']) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

async function getList(
  request: APIRequestContext,
  path: string,
  token: string,
): Promise<Record<string, unknown>[]> {
  const result = await apiRequest(request, 'GET', path, { token });
  if (!result.body.isSuccess) {
    // Some lookups may be public or require no token; retry without auth once.
    const publicResult = await apiRequest(request, 'GET', path);
    if (!publicResult.body.isSuccess) {
      return [];
    }
    return asArray(publicResult.body.data);
  }
  return asArray(result.body.data);
}

let cached: ReferenceData | null = null;

export async function loadReferenceData(
  request: APIRequestContext,
  token: string,
): Promise<ReferenceData> {
  if (cached) return cached;

  const [
    channels,
    signupRoles,
    countries,
    currencies,
    identificationTypes,
    businessRegistrationTypes,
    businessIdentificationTypes,
    businessModels,
    businessTypes,
    regions,
    paymentMethods,
    turnaroundOptions,
  ] = await Promise.all([
    getList(request, '/api/v1/Account/channels', token),
    getList(request, '/api/v1/Administration/signup-roles', token),
    getList(request, '/api/v1/configuration/countries', token),
    getList(request, '/api/v1/configuration/currencies', token),
    getList(request, '/api/v1/configuration/identification-types', token),
    getList(request, '/api/v1/configuration/business-registration-types', token),
    getList(request, '/api/v1/configuration/business-identification-types', token),
    getList(request, '/api/v1/configuration/business-models', token),
    getList(request, '/api/v1/configuration/business-types', token),
    getList(request, '/api/v1/configuration/regions', token),
    getList(request, '/api/v1/configuration/payment-methods', token),
    getList(request, '/api/v1/configuration/turnaround-options', token),
  ]);

  const countryId = Number(
    pickId(countries[0] || {}, 'countryId', 'id') ?? 0,
  );
  let districts: Record<string, unknown>[] = [];
  const regionId = Number(pickId(regions[0] || {}, 'regionId', 'id') ?? 0);
  if (regionId) {
    districts = await getList(request, `/api/v1/configuration/districts/by-region/${regionId}`, token);
    if (!districts.length) {
      districts = await getList(request, '/api/v1/configuration/districts', token);
    }
  }

  cached = {
    channels: channels.map((row) => ({
      channelId: Number(pickId(row, 'channelId', 'id')),
      id: Number(pickId(row, 'channelId', 'id')),
      channelName: pickName(row),
      name: pickName(row),
    })),
    signupRoles: signupRoles.map((row) => ({
      roleId: String(pickId(row, 'roleId', 'id') ?? ''),
      id: String(pickId(row, 'roleId', 'id') ?? ''),
      name: pickName(row),
      roleName: pickName(row),
      displayName: pickName(row),
    })) as SignupRole[],
    countries: countries.map((row) => ({
      countryId: Number(pickId(row, 'countryId', 'id')),
      id: Number(pickId(row, 'countryId', 'id')),
      countryName: pickName(row),
      name: pickName(row),
    })),
    currencies: currencies.map((row) => ({
      currencyId: Number(pickId(row, 'currencyId', 'id')),
      id: Number(pickId(row, 'currencyId', 'id')),
      currencyName: pickName(row),
      name: pickName(row),
      countryId: Number(pickId(row, 'countryId') ?? countryId),
    })),
    identificationTypes: identificationTypes.map((row) => ({
      identificationTypeId: Number(pickId(row, 'identificationTypeId', 'id')),
      id: Number(pickId(row, 'identificationTypeId', 'id')),
      name: pickName(row),
    })),
    businessRegistrationTypes: businessRegistrationTypes.map((row) => ({
      businessRegistrationTypeId: Number(pickId(row, 'businessRegistrationTypeId', 'id')),
      id: Number(pickId(row, 'businessRegistrationTypeId', 'id')),
      name: pickName(row),
    })),
    businessIdentificationTypes: businessIdentificationTypes.map((row) => ({
      businessIdentificationTypeId: Number(pickId(row, 'businessIdentificationTypeId', 'id')),
      id: Number(pickId(row, 'businessIdentificationTypeId', 'id')),
      name: pickName(row),
    })),
    businessModels: businessModels.map((row) => ({
      businessModelId: Number(pickId(row, 'businessModelId', 'id')),
      id: Number(pickId(row, 'businessModelId', 'id')),
      name: pickName(row),
      countryId: Number(pickId(row, 'countryId') ?? countryId),
    })),
    businessTypes: businessTypes.map((row) => ({
      businessTypeId: Number(pickId(row, 'businessTypeId', 'id')),
      id: Number(pickId(row, 'businessTypeId', 'id')),
      name: pickName(row),
    })),
    regions: regions.map((row) => ({
      regionId: Number(pickId(row, 'regionId', 'id')),
      id: Number(pickId(row, 'regionId', 'id')),
      countryId: Number(pickId(row, 'countryId') ?? countryId),
      name: pickName(row),
    })),
    districts: districts.map((row) => ({
      districtId: Number(pickId(row, 'districtId', 'id')),
      id: Number(pickId(row, 'districtId', 'id')),
      regionId: Number(pickId(row, 'regionId') ?? regionId),
      name: pickName(row),
    })),
    paymentMethods: paymentMethods.map((row) => ({
      paymentMethodId: Number(pickId(row, 'paymentMethodId', 'id')),
      id: Number(pickId(row, 'paymentMethodId', 'id')),
      name: pickName(row),
    })),
    turnaroundOptions: turnaroundOptions.map((row) => ({
      turnaroundOptionId: Number(pickId(row, 'turnaroundOptionId', 'id')),
      id: Number(pickId(row, 'turnaroundOptionId', 'id')),
      name: pickName(row),
    })),
  };

  return cached;
}

export function findSignupRole(roles: SignupRole[], needle: string): SignupRole {
  const lower = needle.toLowerCase();
  const found = roles.find((role) => {
    const label = `${role.name || ''} ${role.roleName || ''} ${role.displayName || ''}`.toLowerCase();
    return label.includes(lower);
  });
  if (!found?.roleId && !found?.id) {
    throw new Error(`Signup role not found for "${needle}". Available: ${JSON.stringify(roles)}`);
  }
  return found;
}

export function firstId(rows: Array<Record<string, unknown>>, ...keys: string[]): number {
  for (const row of rows) {
    const id = pickId(row, ...keys);
    if (typeof id === 'number' && !Number.isNaN(id) && id > 0) return id;
    if (typeof id === 'string' && id.trim() && !Number.isNaN(Number(id))) return Number(id);
  }
  throw new Error(`No usable id found among keys ${keys.join(', ')}`);
}
