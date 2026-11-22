export const BYTES_PER_MIB = 1024 * 1024;

export function formatFileSize(bytes: number): string {
  return `${(bytes / BYTES_PER_MIB).toLocaleString(undefined, {
    maximumSignificantDigits: 4,
  })} MiB`;
}
