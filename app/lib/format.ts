// Utility formatting functions
// Human-readable file size formatter

export function formatSize(bytes: number, fractionDigits: number = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const thresh = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let u = 0;
  let value = bytes;

  while (value >= thresh && u < units.length - 1) {
    value /= thresh;
    u++;
  }

  // For bytes (B), show integer, else fixed fractionDigits
  const formatted = u === 0 ? Math.round(value).toString() : value.toFixed(fractionDigits);

  // Remove trailing zeros and possible dot if not needed (for non-B units)
  const cleaned = u === 0 ? formatted : Number(formatted).toString();

  return `${cleaned} ${units[u]}`;
}

export const generateUUID = () => crypto.randomUUID();