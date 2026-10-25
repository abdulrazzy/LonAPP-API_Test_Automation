import { google } from 'googleapis';
import { getGmailConfig, OTP_MAILBOX } from '../config/env';

const OTP_REGEX = /\b(\d{6})\b/;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeBody(data?: string | null): string {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function collectBodies(payload: {
  body?: { data?: string | null } | null;
  parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] }> | null;
} | null | undefined): string {
  if (!payload) return '';
  const chunks: string[] = [];
  if (payload.body?.data) chunks.push(decodeBody(payload.body.data));
  for (const part of payload.parts ?? []) {
    chunks.push(collectBodies(part as typeof payload));
  }
  return chunks.join('\n');
}

function headerValue(
  headers: Array<{ name?: string | null; value?: string | null }> | null | undefined,
  name: string,
): string {
  const found = headers?.find((h) => (h.name || '').toLowerCase() === name.toLowerCase());
  return found?.value || '';
}

/**
 * Polls Gmail for a tenant-registration OTP sent to jayphadit@gmail.com.
 * Used only for tenant registration flows.
 */
export async function waitForTenantOtp(options: {
  afterMs: number;
  timeoutMs?: number;
  pollMs?: number;
}): Promise<string> {
  const { clientId, clientSecret, refreshToken, redirectUri } = getGmailConfig();
  const timeoutMs = options.timeoutMs ?? 90_000;
  const pollMs = options.pollMs ?? 3_000;
  const deadline = Date.now() + timeoutMs;
  const recipient = OTP_MAILBOX.toLowerCase();

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });

  const afterSeconds = Math.floor(options.afterMs / 1000) - 5;

  while (Date.now() < deadline) {
    const list = await gmail.users.messages.list({
      userId: 'me',
      q: `to:${recipient} after:${afterSeconds}`,
      maxResults: 15,
    });

    const messages = list.data.messages ?? [];
    for (const summary of messages) {
      if (!summary.id) continue;
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: summary.id,
        format: 'full',
      });

      const internalDate = Number(full.data.internalDate || 0);
      if (internalDate && internalDate + 2000 < options.afterMs) continue;

      const headers = full.data.payload?.headers ?? [];
      const to = headerValue(headers, 'To').toLowerCase();
      const deliveredTo = headerValue(headers, 'Delivered-To').toLowerCase();
      const subject = headerValue(headers, 'Subject');
      const snippet = full.data.snippet || '';
      const body = collectBodies(full.data.payload);

      const addressedToMailbox =
        to.includes(recipient) || deliveredTo.includes(recipient);

      if (!addressedToMailbox) continue;

      const haystack = `${subject}\n${snippet}\n${body}`;
      const match = haystack.match(OTP_REGEX);
      if (match?.[1]) {
        return match[1];
      }
    }

    await sleep(pollMs);
  }

  throw new Error(
    `Timed out waiting for tenant OTP email to ${OTP_MAILBOX} after ${timeoutMs}ms`,
  );
}
