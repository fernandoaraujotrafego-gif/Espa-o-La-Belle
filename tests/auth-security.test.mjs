import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('login only authenticates existing users', async () => {
  const context = await read('src/context/AppContext.tsx');
  const login = context.slice(context.indexOf('const login ='), context.indexOf('const logout ='));

  assert.match(login, /signInWithEmailAndPassword\(auth, normalizedEmail, passwordOrRole\)/);
  assert.doesNotMatch(login, /createUserWithEmailAndPassword|createNewUserAuth|setDoc/);
});

test('application startup does not bootstrap users or profiles', async () => {
  const [context, firebase] = await Promise.all([
    read('src/context/AppContext.tsx'),
    read('src/lib/firebase.ts')
  ]);

  assert.doesNotMatch(context, /bootstrapInitialUsers|defaultRole|ensureUserProfile|Seeding initial/);
  assert.doesNotMatch(firebase, /bootstrapInitialUsers|defaultUsersToSeed/);
});

test('registration enforces a strong explicit password and stores no defaults', async () => {
  const [firebase, settings, mocks] = await Promise.all([
    read('src/lib/firebase.ts'),
    read('src/components/Configuracoes.tsx'),
    read('src/data/mockData.ts')
  ]);

  assert.match(firebase, /password\.length < 8/);
  assert.match(firebase, /\[A-Z\]/);
  assert.match(firebase, /\[a-z\]/);
  assert.match(firebase, /\\d/);
  assert.match(firebase, /await deleteAuthUser\(userCredential\.user\)/);
  assert.doesNotMatch(settings, /useState\('123'\)|setUPassword\('123'\)|user\.password \|\|/);
  assert.doesNotMatch(mocks, /password\s*:/);
});

test('Firestore rules prevent self-registration and role escalation', async () => {
  const rules = await read('firestore.rules');
  const usersRules = rules.slice(rules.indexOf('match /users/'), rules.indexOf('match /backups/'));

  assert.match(usersRules, /allow create: if isAdmin\(\)/);
  assert.match(usersRules, /allow update: if isAdmin\(\)/);
  const privilegedWriteLines = usersRules
    .split('\n')
    .filter(line => /allow (?:create|update):/.test(line));
  privilegedWriteLines.forEach(line => assert.doesNotMatch(line, /request\.auth\.uid == userId/));
});
