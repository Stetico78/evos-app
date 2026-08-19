const test = require('node:test');
const assert = require('node:assert/strict');
const { findConflict, bookingDuration } = require('../booking-rules');

const bookings = [
  {
    id: 'active-1',
    starts_at: '2026-09-01T10:00:00.000Z',
    status: 'confirmed',
    evos_catalog_services: { name: 'Sesión EVOS', duration_minutes: 60 }
  },
  {
    id: 'cancelled-1',
    starts_at: '2026-09-01T12:00:00.000Z',
    status: 'cancelled',
    evos_catalog_services: { duration_minutes: 90 }
  }
];

test('detecta solapamientos solo con reservas activas', () => {
  assert.equal(findConflict('2026-09-01T10:30:00.000Z', 30, bookings)?.id, 'active-1');
  assert.equal(findConflict('2026-09-01T11:00:00.000Z', 30, bookings), null);
  assert.equal(findConflict('2026-09-01T12:15:00.000Z', 30, bookings), null);
});

test('permite excluir la reserva que se esta reprogramando', () => {
  assert.equal(findConflict('2026-09-01T10:15:00.000Z', 30, bookings, 'active-1'), null);
});

test('usa una duracion segura cuando el catalogo no la aporta', () => {
  assert.equal(bookingDuration({}), 60);
  assert.equal(bookingDuration({ evos_catalog_services: { duration_minutes: 45 } }), 45);
});
