const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const pad = (n) => String(n).padStart(2, '0');

/**
 * Format an ISO timestamp as "DD MMM, YYYY HH:MM:SS" (24-hour, local time).
 * Returns the original value unchanged if it can't be parsed.
 *
 * e.g. "2026-06-13T05:53:09.275209977Z" -> "13 Jun, 2026 05:53:09"
 */
export function formatDateTime(value) {
  if (!value) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return (
    `${pad(d.getDate())} ${MONTHS[d.getMonth()]}, ${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}
