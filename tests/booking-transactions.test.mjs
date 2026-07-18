import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('booking creation atomically reserves the schedule and booking', async () => {
  const context = await read('src/context/AppContext.tsx');
  const addBooking = context.slice(context.indexOf('const addBooking ='), context.indexOf('const updateBooking ='));

  assert.match(addBooking, /runTransaction\(db/);
  assert.match(addBooking, /transaction\.get\(bookingScheduleRef\)/);
  assert.match(addBooking, /reservationOverlaps/);
  assert.match(addBooking, /transaction\.set\(bookingRef, newBooking\)/);
  assert.match(addBooking, /transaction\.set\(bookingScheduleRef/);
  assert.match(addBooking, /BOOKING_CONFLICT/);
});

test('booking updates and deletions maintain schedule reservations transactionally', async () => {
  const context = await read('src/context/AppContext.tsx');
  const updateBooking = context.slice(context.indexOf('const updateBooking ='), context.indexOf('const updateBookingStatus ='));

  assert.equal((updateBooking.match(/runTransaction\(db/g) || []).length, 2);
  assert.match(updateBooking, /oldScheduleRef/);
  assert.match(updateBooking, /newScheduleRef/);
  assert.match(updateBooking, /transaction\.delete\(bookingRef\)/);
});

test('agenda blocks use the same transactional schedule index', async () => {
  const context = await read('src/context/AppContext.tsx');
  const start = context.indexOf('const addAgendaBlock =');
  const agendaBlocks = context.slice(start, context.indexOf('// Professionals CRUD', start));

  assert.equal((agendaBlocks.match(/runTransaction\(db/g) || []).length, 2);
  assert.match(agendaBlocks, /kind: 'block'/);
  assert.match(agendaBlocks, /transaction\.set\(doc\(db, 'agenda_blocks'/);
  assert.match(agendaBlocks, /BLOCK_CONFLICT/);
});

test('Firestore rules protect the transactional schedule collection', async () => {
  const rules = await read('firestore.rules');

  assert.match(rules, /match \/booking_schedules\/\{scheduleId\}/);
  assert.match(rules, /allow create, update: if isOperationalManagement\(\)/);
});

test('the interface does not offer an unsafe overbooking bypass', async () => {
  const agenda = await read('src/components/Agenda.tsx');

  assert.doesNotMatch(agenda, /Agendar Mesmo Assim|Forçar|ignoreConflictOverride/);
  assert.match(agenda, /o sistema não permite duplicidade/);
});
