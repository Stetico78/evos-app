(function attachBookingRules(root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.EvosBookingRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBookingRules() {
  const activeStatuses = new Set(['pending', 'confirmed']);

  function dateValue(value) {
    const parsed = value instanceof Date ? value : new Date(value);
    const timestamp = parsed.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function durationValue(value, fallback = 60) {
    const duration = Number(value);
    return Number.isFinite(duration) && duration > 0 ? duration : fallback;
  }

  function bookingDuration(booking) {
    return durationValue(booking?.evos_catalog_services?.duration_minutes);
  }

  function findConflict(start, durationMinutes, bookings = [], excludeId = null) {
    const startTime = dateValue(start);
    if (startTime === null) return null;
    const endTime = startTime + durationValue(durationMinutes) * 60000;

    return bookings.find((booking) => {
      if (!booking || booking.id === excludeId || !activeStatuses.has(booking.status)) return false;
      const existingStart = dateValue(booking.starts_at);
      if (existingStart === null) return false;
      const existingEnd = existingStart + bookingDuration(booking) * 60000;
      return startTime < existingEnd && endTime > existingStart;
    }) || null;
  }

  return { findConflict, bookingDuration, durationValue };
});
