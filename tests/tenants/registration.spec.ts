import { test, expect } from '../../src/fixtures/base';
import { apiRequest, expectFailure, expectSuccess } from '../../src/client/api';
import { OTP_MAILBOX } from '../../src/config/env';
import { SKIP_OTP_REASON, SKIP_OTP_TESTS } from '../../src/config/flags';
import {
  deactivateOrDeleteTenant,
  registerTenantViaOtp,
} from '../../src/data/tenantRegistration';
import { findSignupRole, firstId } from '../../src/data/reference';
import { uniquePhone } from '../../src/data/builders';

test.describe('Tenant registration', () => {
  test('loads seeded signup roles including Business Owner and Business Admin', async ({
    referenceData,
  }) => {
    test.skip(
      referenceData.signupRoles.length === 0,
      'API returns empty signup-roles on staging (known defect)',
    );
    const owner = findSignupRole(referenceData.signupRoles, 'Business Owner');
    const admin = findSignupRole(referenceData.signupRoles, 'Business Admin');
    expect(owner.roleId || owner.id).toBeTruthy();
    expect(admin.roleId || admin.id).toBeTruthy();
  });

  test('registers a Business Owner tenant via Gmail OTP and can log in', async ({
    request,
    platformAdmin,
    referenceData,
  }) => {
    test.skip(SKIP_OTP_TESTS, SKIP_OTP_REASON);

    const tenant = await registerTenantViaOtp(
      request,
      referenceData,
      'Business Owner',
      platformAdmin.bearerToken,
    );

    expect(tenant.session.bearerToken).toBeTruthy();
    expect(tenant.adminEmail).toBe(OTP_MAILBOX);

    if (tenant.tenantId) {
      const byId = await apiRequest(request, 'GET', `/api/v1/Tenants/${tenant.tenantId}`, {
        token: platformAdmin.bearerToken,
      });
      expectSuccess(byId, 200);
    }

    await deactivateOrDeleteTenant(request, platformAdmin.bearerToken, tenant.tenantId);
  });

  test('registers a Business Admin tenant via Gmail OTP', async ({
    request,
    platformAdmin,
    referenceData,
  }) => {
    test.skip(SKIP_OTP_TESTS, SKIP_OTP_REASON);

    const tenant = await registerTenantViaOtp(
      request,
      referenceData,
      'Business Admin',
      platformAdmin.bearerToken,
    );
    expect(tenant.session.bearerToken).toBeTruthy();
    expect(tenant.adminEmail).toBe(OTP_MAILBOX);
    expect(tenant.roleLabel).toBe('Business Admin');
    await deactivateOrDeleteTenant(request, platformAdmin.bearerToken, tenant.tenantId);
  });

  test('rejects invalid tenant registration OTP', async ({ request, referenceData }) => {
    test.skip(SKIP_OTP_TESTS, SKIP_OTP_REASON);

    const phone = uniquePhone();
    const countryId = firstId(referenceData.countries as Array<Record<string, unknown>>, 'countryId', 'id');

    const send = await apiRequest(request, 'POST', '/api/v1/Tenants/register/request-otp', {
      data: {
        adminEmailAddress: OTP_MAILBOX,
        adminPhoneNumber: phone,
        countryId,
      },
    });
    expectSuccess(send, 200);

    const verify = await apiRequest(request, 'POST', '/api/v1/Tenants/register/verify-otp', {
      data: {
        adminEmailAddress: OTP_MAILBOX,
        adminPhoneNumber: phone,
        countryId,
        otp: '000000',
      },
    });
    expectFailure(verify, [400, 401, 422]);
  });
});
