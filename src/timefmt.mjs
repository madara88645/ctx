/**
 * Formats the relative time between thenMs and nowMs.
 * 
 * @param {number} thenMs - The past epoch time in milliseconds
 * @param {number} nowMs - The current epoch time in milliseconds
 * @returns {string} The formatted relative time string
 */
export function formatRelative(thenMs, nowMs) {
  let delta = nowMs - thenMs;
  if (delta < 0) {
    delta = 0;
  }

  if (delta < 60000) {
    return 'just now';
  }

  if (delta < 3600000) {
    const n = Math.floor(delta / 60000);
    return `${n} minute${n === 1 ? '' : 's'} ago`;
  }

  if (delta < 86400000) {
    const n = Math.floor(delta / 3600000);
    return `${n} hour${n === 1 ? '' : 's'} ago`;
  }

  if (delta < 2592000000) {
    const n = Math.floor(delta / 86400000);
    return `${n} day${n === 1 ? '' : 's'} ago`;
  }

  const d = new Date(thenMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `on ${yyyy}-${mm}-${dd}`;
}
