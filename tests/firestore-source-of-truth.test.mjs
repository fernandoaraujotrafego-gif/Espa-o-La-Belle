import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('business data never uses localStorage', async () => {
  const context = await read('src/context/AppContext.tsx');
  assert.doesNotMatch(context, /localStorage/);

  const sources = await Promise.all([
    read('src/App.tsx'),
    read('src/components/Agenda.tsx'),
    read('src/components/Layout.tsx')
  ]);
  const localStorageKeys = [...sources.join('\n').matchAll(/localStorage\.(?:getItem|setItem|removeItem)\('([^']+)'/g)]
    .map(match => match[1]);

  assert.deepEqual(
    [...new Set(localStorageKeys)].sort(),
    ['pwa_ios_prompt_dismissed', 'sidebar_collapsed']
  );
});

test('Firestore snapshots replace state even when collections are empty', async () => {
  const context = await read('src/context/AppContext.tsx');

  assert.doesNotMatch(context, /snapshot\.empty|Seeding initial/);
  assert.match(context, /setBookings\(mapDocs<Booking>\(snapshot\)\)/);
  assert.match(context, /setClients\(mapDocs<Client>\(snapshot\)\)/);
  assert.match(context, /setProducts\(mapDocs<Product>\(snapshot\)\)/);
});

test('backup settings and restores are persisted in Firestore', async () => {
  const context = await read('src/context/AppContext.tsx');

  assert.match(context, /onSnapshot\(doc\(db, 'settings', 'backup'\)/);
  assert.match(context, /setDoc\(doc\(db, 'settings', 'backup'\)/);
  assert.match(context, /const replaceCollection = async/);
  assert.match(context, /writeBatch\(db\)/);
  assert.doesNotMatch(context, /belle_local_backups_log|belle_backup_settings/);
});
