// ─── Formatting Helpers ───────────────────────────────────────────────────────
// Section 0 of SPEC.md: ₹ everywhere, Indian number formatting,
// phones as +91 XXXXX XXXXX.

/**
 * Format a whole-rupee amount with the ₹ symbol and Indian grouping.
 * e.g. 150000 → "₹1,50,000"
 */
export function formatRupees(amount: number): string {
  return (
    '₹' +
    new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  );
}

/**
 * Format a 10-digit Indian mobile number as "+91 XXXXX XXXXX".
 * Accepts strings with or without the +91 prefix.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^91/, '');
  if (digits.length !== 10) return raw; // return as-is if unexpected
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/**
 * Format an ISO 8601 timestamp to a human-readable short form.
 * e.g. "30 Oct, 12:34 PM"
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format just the date portion.
 * e.g. "30 Oct 2026"
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format just the time portion.
 * e.g. "12:34 PM"
 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a distance in km.
 * e.g. 1.5 → "1.5 km" | 0.8 → "800 m"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Truncate a string to `max` chars, appending "…" if cut.
 */
export function truncate(str: string, max = 60): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

/**
 * Pluralise a word naively.
 * e.g. pluralise('bid', 3) → "3 bids"
 */
export function pluralise(word: string, count: number): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Generate a short order-id display string.
 * e.g. "ord_abc12" → "#ABC12"
 */
export function formatOrderId(id: string): string {
  const short = id.replace(/^ord_/, '').toUpperCase().slice(0, 6);
  return `#${short}`;
}

