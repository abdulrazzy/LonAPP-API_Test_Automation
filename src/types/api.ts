export interface ApiErrorItem {
  code?: string | null;
  message?: string | null;
  field?: string | null;
}

export interface ApiResponseDetail {
  code?: string | null;
  message?: string | null;
}

export interface ApiEnvelope<T = unknown> {
  isSuccess: boolean;
  data?: T | null;
  success?: ApiResponseDetail | null;
  error?: ApiResponseDetail | null;
  errors?: ApiErrorItem[] | null;
  meta?: unknown;
  correlationId?: string | null;
}

export interface LoginData {
  userId?: string | null;
  bearerToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
  sessionId?: string | null;
  isFirstTime?: boolean;
  tenant?: TenantOption | null;
  tenantSelection?: unknown;
}

export interface TenantOption {
  tenantId?: string | null;
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
}

export interface AuthSession {
  userId: string;
  bearerToken: string;
  refreshToken: string;
  sessionId?: string | null;
  tenantId?: string | null;
  email: string;
  password: string;
}

export interface SignupRole {
  roleId?: string | null;
  id?: string | null;
  name?: string | null;
  roleName?: string | null;
  displayName?: string | null;
}

export interface ReferenceData {
  channels: Array<{ channelId?: number; id?: number; channelName?: string; name?: string }>;
  signupRoles: SignupRole[];
  countries: Array<{ countryId?: number; id?: number; countryName?: string; name?: string }>;
  currencies: Array<{ currencyId?: number; id?: number; currencyName?: string; name?: string; countryId?: number }>;
  identificationTypes: Array<{ identificationTypeId?: number; id?: number; name?: string }>;
  businessRegistrationTypes: Array<{ businessRegistrationTypeId?: number; id?: number; name?: string }>;
  businessIdentificationTypes: Array<{ businessIdentificationTypeId?: number; id?: number; name?: string }>;
  businessModels: Array<{ businessModelId?: number; id?: number; name?: string; countryId?: number }>;
  businessTypes: Array<{ businessTypeId?: number; id?: number; name?: string }>;
  regions: Array<{ regionId?: number; id?: number; countryId?: number; name?: string }>;
  districts: Array<{ districtId?: number; id?: number; regionId?: number; name?: string }>;
  paymentMethods: Array<{ paymentMethodId?: number; id?: number; name?: string }>;
  turnaroundOptions: Array<{ turnaroundOptionId?: number; id?: number; name?: string }>;
}
