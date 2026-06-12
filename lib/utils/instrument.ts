export function formatInstrumentLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return raw;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
