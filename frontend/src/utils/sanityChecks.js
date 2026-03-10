export function isValidMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function isValidTimeRange(start, end) {
  if (!start || !end) return false;
  // HH:MM 24h format compares correctly as strings
  return end > start;
}

export function clampDailyTarget(target, min = 0, max = 10000) {
  const n = Number(target);
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

