export const CLIENT_COLOR_OPTIONS = [
  { hex: '#059669', name: 'Smeraldo' },
  { hex: '#0284c7', name: 'Azzurro' },
  { hex: '#2563eb', name: 'Blu Reale' },
  { hex: '#4f46e5', name: 'Indaco' },
  { hex: '#7c3aed', name: 'Viola' },
  { hex: '#9333ea', name: 'Violetto' },
  { hex: '#c026d3', name: 'Fucsia' },
  { hex: '#e11d48', name: 'Rosso Lampone' },
  { hex: '#ea580c', name: 'Arancione' },
  { hex: '#d97706', name: 'Ambra' },
  { hex: '#16a34a', name: 'Verde Bosco' },
  { hex: '#0d9488', name: 'Ottanio' },
] as const;

export const CLIENT_COLOR_PALETTE = CLIENT_COLOR_OPTIONS.map((c) => c.hex);

/**
 * Returns the client's custom color if set.
 * If not set, deterministically picks a consistent palette color from client name/id
 * so that all existing clients automatically have a distinct recognizable color.
 */
export const getClientColor = (
  client?: { id?: string; name?: string; color?: string } | null
): string => {
  if (client?.color && client.color.trim()) {
    return client.color.trim();
  }
  const key = (client?.name || client?.id || 'cliente').toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CLIENT_COLOR_PALETTE.length;
  return CLIENT_COLOR_PALETTE[index];
};

/**
 * Returns '#ffffff' or '#0f172a' depending on background luminance
 */
export const getContrastTextColor = (hexColor: string): string => {
  if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
  let c = hexColor.substring(1);
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  if (c.length !== 6) return '#ffffff';
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#0f172a' : '#ffffff';
};
