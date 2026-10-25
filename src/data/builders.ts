export function uniqueTag(prefix = 't'): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Short unique label for API entities.
 * Pass maxLen for endpoints with tight name limits (channel=20, unit=30).
 */
export function uniqueName(kind: string, maxLen = 40): string {
  const stamp = Date.now().toString(36);
  const base = `api-${kind}-${stamp}`;
  return base.slice(0, maxLen);
}

export function strongPassword(): string {
  return `Lon!${Date.now().toString(36)}Aa1#`;
}

export function uniquePhone(suffixDigits = 7): string {
  const n = Date.now().toString().slice(-suffixDigits);
  return `23320${n.padStart(suffixDigits, '0')}`.slice(0, 12);
}

export function uniqueEmail(kind: string): string {
  return `api-test-${kind}-${uniqueTag()}@example.com`;
}

/** Minimal valid 1x1 PNG for FileManager uploads when required. */
export const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function tinyPngBuffer(): Buffer {
  return Buffer.from(TINY_PNG_BASE64, 'base64');
}
