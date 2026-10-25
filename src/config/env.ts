function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill in values.`);
  }
  return value;
}

export function getPlatformAdminCredentials(): { email: string; password: string } {
  return {
    email: required('PLATFORM_ADMIN_EMAIL'),
    password: required('PLATFORM_ADMIN_PASSWORD'),
  };
}

export function getGmailConfig(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
  mailbox: string;
} {
  return {
    clientId: required('GMAIL_CLIENT_ID'),
    clientSecret: required('GMAIL_CLIENT_SECRET'),
    refreshToken: required('GMAIL_REFRESH_TOKEN'),
    redirectUri: process.env.GMAIL_REDIRECT_URI?.trim() || 'https://google.com',
    mailbox: OTP_MAILBOX,
  };
}

/** Inbox used only for tenant-registration OTP. */
export const OTP_MAILBOX = 'jayphadit@gmail.com';
