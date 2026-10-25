import { APIRequestContext } from '@playwright/test';
import { apiRequest, expectSuccess } from '../client/api';
import { OTP_MAILBOX } from '../config/env';
import { waitForTenantOtp } from '../mail/otp';
import type { AuthSession, LoginData, ReferenceData } from '../types/api';
import { loginWithPassword } from '../auth/platformAdmin';
import { findSignupRole, firstId } from './reference';
import { strongPassword, tinyPngBuffer, uniqueName, uniquePhone } from './builders';

export interface RegisteredTenant {
  session: AuthSession;
  tenantId?: string;
  businessName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
  roleLabel: string;
  otp: string;
}

async function uploadTinyDocument(request: APIRequestContext, token?: string): Promise<string | null> {
  const result = await apiRequest<{ path?: string; url?: string; filePath?: string } | string[] | string>(
    request,
    'POST',
    '/api/v1/FileManager/upload-file-documents',
    {
      token,
      multipart: {
        files: {
          name: 'api-test.png',
          mimeType: 'image/png',
          buffer: tinyPngBuffer(),
        },
      },
    },
  );

  if (!result.body.isSuccess) {
    return null;
  }

  const data = result.body.data;
  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.length) {
    const first = data[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const row = first as Record<string, unknown>;
      return String(row.path || row.url || row.filePath || row.publicUrl || '');
    }
  }
  if (data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    if (Array.isArray(row.paths) && row.paths[0]) return String(row.paths[0]);
    if (Array.isArray(row.urls) && row.urls[0]) return String(row.urls[0]);
    return String(row.path || row.url || row.filePath || row.publicUrl || '') || null;
  }
  return null;
}

function buildPayload(
  refs: ReferenceData,
  options: {
    roleLabel: string;
    adminEmail: string;
    adminPhone: string;
    password: string;
    otp: string;
    documentUrl?: string | null;
  },
): Record<string, unknown> {
  const countryId = firstId(refs.countries as Array<Record<string, unknown>>, 'countryId', 'id');
  const currency =
    refs.currencies.find((c) => !c.countryId || c.countryId === countryId) || refs.currencies[0];
  const currencyId = firstId([currency as Record<string, unknown>], 'currencyId', 'id');
  const businessRegistrationTypeId = firstId(
    refs.businessRegistrationTypes as Array<Record<string, unknown>>,
    'businessRegistrationTypeId',
    'id',
  );
  const businessIdentificationTypeId = firstId(
    refs.businessIdentificationTypes as Array<Record<string, unknown>>,
    'businessIdentificationTypeId',
    'id',
  );
  const identificationTypeId = firstId(
    refs.identificationTypes as Array<Record<string, unknown>>,
    'identificationTypeId',
    'id',
  );
  const businessModel =
    refs.businessModels.find((m) => !m.countryId || m.countryId === countryId) || refs.businessModels[0];
  const businessModelId = firstId([businessModel as Record<string, unknown>], 'businessModelId', 'id');
  const role = findSignupRole(refs.signupRoles, options.roleLabel);
  const roleId = String(role.roleId || role.id);
  const region =
    refs.regions.find((r) => !r.countryId || r.countryId === countryId) || refs.regions[0];
  const regionId = region ? Number(region.regionId || region.id) : undefined;
  const district =
    refs.districts.find((d) => !regionId || d.regionId === regionId) || refs.districts[0];
  const districtId = district ? Number(district.districtId || district.id) : undefined;
  const businessTypeId = refs.businessTypes[0]
    ? Number(refs.businessTypes[0].businessTypeId || refs.businessTypes[0].id)
    : null;

  const businessName = uniqueName('tenant');
  const docs = options.documentUrl ? [options.documentUrl] : [];

  const factories =
    regionId && districtId
      ? [
          {
            factoryAbbreviatedName: 'ATF',
            factoryName: `${businessName} Factory`,
            phoneNumber: options.adminPhone,
            regionId,
            districtId,
            digitalAddress: 'GA-000-0000',
            factoryAddress: 'Api Test Factory Address',
            longitude: -0.186964,
            latitude: 5.603717,
            timeZoneId: 'Africa/Accra',
            isActive: true,
            operatingHours: [],
          },
        ]
      : [];

  const outlets =
    regionId && districtId
      ? [
          {
            outletAbbreviatedName: 'ATO',
            outletName: `${businessName} Outlet`,
            phoneNumber: options.adminPhone,
            regionId,
            districtId,
            digitalAddress: 'GA-000-0001',
            physicalAddress: 'Api Test Outlet Address',
            longitude: -0.186964,
            latitude: 5.603717,
            timeZoneId: 'Africa/Accra',
            offersPickup: true,
            offersDelivery: true,
            isActive: true,
            operatingHours: [],
          },
        ]
      : [];

  const paymentMethods = refs.paymentMethods.slice(0, 1).map((pm) => ({
    paymentMethodId: Number(pm.paymentMethodId || pm.id),
  }));

  const turnaroundOptions = refs.turnaroundOptions.slice(0, 1).map((to) => ({
    turnaroundOptionId: Number(to.turnaroundOptionId || to.id),
  }));

  return {
    logoUrl: options.documentUrl || null,
    businessName,
    currencyId,
    businessRegistrationTypeId,
    businessRegistrationNumber: `REG-${Date.now()}`,
    businessIdentificationTypeId,
    businessIdentificationNumber: `BID-${Date.now()}`,
    businessDocumentImages: docs,
    countryId,
    digitalAddress: 'GA-123-4567',
    longitude: -0.186964,
    latitude: 5.603717,
    businessAddress: 'Api Test Business Address, Accra',
    businessEmailAddress: options.adminEmail,
    businessPhoneNumber: options.adminPhone,
    businessWhatsAppNumber: options.adminPhone,
    firstName: 'Api',
    lastName: 'Tester',
    roleId,
    position: 'Owner',
    adminPhoneNumber: options.adminPhone,
    adminWhatsAppNumber: options.adminPhone,
    adminEmailAddress: options.adminEmail,
    identificationTypeId,
    identificationNumber: `ID-${Date.now()}`,
    identificationDocumentImages: docs,
    otp: options.otp,
    password: options.password,
    confirmPassword: options.password,
    businessModelId,
    businessTypeId,
    factories,
    outlets,
    services: [],
    turnaroundOptions,
    paymentMethods,
  };
}

export async function registerTenantViaOtp(
  request: APIRequestContext,
  refs: ReferenceData,
  roleLabel: 'Business Owner' | 'Business Admin',
  platformToken?: string,
): Promise<RegisteredTenant> {
  const adminEmail = OTP_MAILBOX;
  const adminPhone = uniquePhone();
  const password = strongPassword();
  const countryId = firstId(refs.countries as Array<Record<string, unknown>>, 'countryId', 'id');

  const afterMs = Date.now();
  const otpRequest = await apiRequest(request, 'POST', '/api/v1/Tenants/register/request-otp', {
    data: {
      adminEmailAddress: adminEmail,
      adminPhoneNumber: adminPhone,
      countryId,
    },
  });
  expectSuccess(otpRequest, 200);

  const otp = await waitForTenantOtp({ afterMs });

  const verify = await apiRequest(request, 'POST', '/api/v1/Tenants/register/verify-otp', {
    data: {
      adminEmailAddress: adminEmail,
      adminPhoneNumber: adminPhone,
      countryId,
      otp,
    },
  });
  expectSuccess(verify, 200);

  const documentUrl = await uploadTinyDocument(request, platformToken);
  const payload = buildPayload(refs, {
    roleLabel,
    adminEmail,
    adminPhone,
    password,
    otp,
    documentUrl,
  });

  const register = await apiRequest<LoginData | { tenantId?: string; userId?: string }>(
    request,
    'POST',
    '/api/v1/Tenants/register',
    { data: payload },
  );
  expectSuccess(register, 200);

  const session = await loginWithPassword(request, adminEmail, password);
  const tenantId =
    session.tenantId ||
    (register.body.data as { tenantId?: string } | null)?.tenantId ||
    undefined;

  return {
    session: { ...session, tenantId },
    tenantId,
    businessName: String(payload.businessName),
    adminEmail,
    adminPhone,
    password,
    roleLabel,
    otp,
  };
}

export async function deactivateOrDeleteTenant(
  request: APIRequestContext,
  platformToken: string,
  tenantId?: string,
): Promise<void> {
  if (!tenantId) return;

  const deactivate = await apiRequest(request, 'PUT', `/api/v1/Tenants/${tenantId}/deactivate`, {
    token: platformToken,
  });
  if (deactivate.status >= 200 && deactivate.status < 300) return;

  await apiRequest(request, 'DELETE', `/api/v1/Tenants/${tenantId}`, {
    token: platformToken,
  });
}
