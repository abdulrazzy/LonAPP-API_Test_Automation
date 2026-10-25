import { test, expect } from '../../src/fixtures/base';
import { apiRequest, errorCodes, expectFailure, expectSuccess } from '../../src/client/api';
import { SKIP_OTP_REASON, SKIP_OTP_TESTS } from '../../src/config/flags';
import { uniqueEmail, uniquePhone } from '../../src/data/builders';
import { firstId } from '../../src/data/reference';

test.describe('Customer registration OTP', () => {
  test.beforeEach(() => {
    test.skip(SKIP_OTP_TESTS, SKIP_OTP_REASON);
  });

  test('send-otp-token accepts an email payload', async ({ request }) => {
    const email = uniqueEmail('cust');
    const send = await apiRequest(request, 'POST', '/api/v1/Account/send-otp-token', {
      data: { phone_OR_email: email },
    });
    expectSuccess(send, 200);
  });

  test('rejects invalid OTP on verify without reading inbox', async ({ request }) => {
    const email = uniqueEmail('badotp');
    const send = await apiRequest(request, 'POST', '/api/v1/Account/send-otp-token', {
      data: { phone_OR_email: email },
    });
    expectSuccess(send, 200);

    const verify = await apiRequest(request, 'POST', '/api/v1/Account/verify-otp-token', {
      data: {
        phone_OR_email: email,
        token: '000000',
      },
    });
    expectFailure(verify, [400, 401, 422]);
    const codes = errorCodes(verify.body);
    expect(codes.some((c) => /OTP/i.test(c)) || verify.body.isSuccess === false).toBeTruthy();
  });

  test('register rejects password mismatch with a bogus otp', async ({ request, referenceData }) => {
    const email = uniqueEmail('pwmm');
    const phone = uniquePhone();
    const channelId = firstId(referenceData.channels as Array<Record<string, unknown>>, 'channelId', 'id');

    const register = await apiRequest(request, 'POST', '/api/v1/Account/register/customer', {
      data: {
        firstName: 'Api',
        lastName: 'Mismatch',
        phoneNumber: phone,
        emailAddress: email,
        otp: '000000',
        password: 'ValidPass1!',
        confirmPassword: 'DifferentPass1!',
        channelId,
      },
    });
    expectFailure(register, [400, 422]);
  });

  test('reset-password rejects invalid token', async ({ request }) => {
    const result = await apiRequest(request, 'POST', '/api/v1/Account/reset-password', {
      data: {
        phone_OR_Email: uniqueEmail('reset'),
        token: '000000',
        newPassword: 'ValidPass1!',
        confirmNewPassword: 'ValidPass1!',
      },
    });
    expectFailure(result, [400, 401, 404, 422]);
  });
});
