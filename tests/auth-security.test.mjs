import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('login only authenticates existing users', async () => {
  const context = await read('src/context/AppContext.tsx');
  const login = context.slice(context.indexOf('const login ='), context.indexOf('const logout ='));

  assert.match(login, /signInWithEmailAndPassword\(auth, email, password\)/);
  assert.doesNotMatch(login, /createUserWithEmailAndPassword|createNewUserAuth|setDoc/);
});

test('application startup does not bootstrap users or profiles', async () => {
  const [context, firebase] = await Promise.all([
    read('src/context/AppContext.tsx'),
    read('src/lib/firebase.ts'),
  ]);

  assert.doesNotMatch(context, /bootstrapInitialUsers|defaultRole|ensureUserProfile/);
  assert.doesNotMatch(firebase, /bootstrapInitialUsers|defaultUsersToSeed/);
});

test('registration requires an explicit password and has no password defaults', async () => {
  const [context, settings, mocks] = await Promise.all([
    read('src/context/AppContext.tsx'),
    read('src/components/Configuracoes.tsx'),
    read('src/data/mockData.ts'),
  ]);

  assert.match(context, /if \(!password\)/);
  assert.doesNotMatch(context, /password \|\|/);
  assert.doesNotMatch(settings, /useState\('123'\)|setUPassword\('123'\)|user\.password \|\|/);
  assert.doesNotMatch(mocks, /password\s*:/);
});

test('Firestore rules prevent self-registration and role escalation', async () => {
  const rules = await read('firestore.rules');

  assert.match(rules, /allow create: if isAdmin\(\);/);
  assert.match(rules, /request\.resource\.data\.role == resource\.data\.role/);
});
