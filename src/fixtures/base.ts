import { test as base } from '@playwright/test';
import { loginAsPlatformAdmin } from '../auth/platformAdmin';
import { SKIP_OTP_REASON, SKIP_OTP_TESTS } from '../config/flags';
import { loadReferenceData } from '../data/reference';
import { registerTenantViaOtp, deactivateOrDeleteTenant, type RegisteredTenant } from '../data/tenantRegistration';
import type { AuthSession, ReferenceData } from '../types/api';

type Fixtures = {
  platformAdmin: AuthSession;
  referenceData: ReferenceData;
  businessOwnerTenant: RegisteredTenant;
};

export const test = base.extend<Fixtures>({
  platformAdmin: async ({ request }, use) => {
    const admin = await loginAsPlatformAdmin(request);
    await use(admin);
  },

  referenceData: async ({ request, platformAdmin }, use) => {
    const refs = await loadReferenceData(request, platformAdmin.bearerToken);
    await use(refs);
  },

  businessOwnerTenant: async ({ request, platformAdmin, referenceData }, use) => {
    test.skip(SKIP_OTP_TESTS, SKIP_OTP_REASON);
    const tenant = await registerTenantViaOtp(
      request,
      referenceData,
      'Business Owner',
      platformAdmin.bearerToken,
    );
    await use(tenant);
    await deactivateOrDeleteTenant(request, platformAdmin.bearerToken, tenant.tenantId);
  },
});

export { expect } from '@playwright/test';
