export function uniqueTag(prefix = 't'): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function uniqueName(kind: string): string {
  return `api-test-${kind}-${Date.now()}`;
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
