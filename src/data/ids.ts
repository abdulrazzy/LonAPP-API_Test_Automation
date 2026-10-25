export function asArray<T = Record<string, unknown>>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'value', 'records']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

export function extractId(data: unknown, ...keys: string[]): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const row = data as Record<string, unknown>;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  for (const nestedKey of ['data', 'item', 'result']) {
    if (row[nestedKey] && typeof row[nestedKey] === 'object') {
      const nested = extractId(row[nestedKey], ...keys);
      if (nested) return nested;
    }
  }
  return undefined;
}

export function findByName(
  rows: Array<Record<string, unknown>>,
  name: string,
  ...nameKeys: string[]
): Record<string, unknown> | undefined {
  const keys = nameKeys.length ? nameKeys : ['name'];
  return rows.find((row) =>
    keys.some((key) => String(row[key] ?? '') === name || String(row[key] ?? '').includes(name)),
  );
}
