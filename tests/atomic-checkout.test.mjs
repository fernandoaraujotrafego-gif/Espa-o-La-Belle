import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('financial checkout uses one Firestore transaction', async () => {
  const context = await read('src/context/AppContext.tsx');
  const checkout = context.slice(
    context.indexOf('const checkoutBooking ='),
    context.indexOf('// Products stock management')
  );

  assert.equal((checkout.match(/runTransaction\(db/g) || []).length, 1);
  assert.match(checkout, /transaction\.get\(bookingRef\)/);
  assert.match(checkout, /transaction\.get\(cashierRef\)/);
  assert.match(checkout, /productRefs\.map\(ref => transaction\.get\(ref\)\)/);
  assert.match(checkout, /transaction\.get\(packageRef\)/);
});

test('payment, stock, cashier, commission and package are written inside checkout transaction', async () => {
  const context = await read('src/context/AppContext.tsx');
  const checkout = context.slice(
    context.indexOf('const checkoutBooking ='),
    context.indexOf('// Products stock management')
  );

  assert.match(checkout, /transaction\.update\(productRefs\[index\]/);
  assert.match(checkout, /transaction\.update\(bookingRef/);
  assert.match(checkout, /transaction\.update\(cashierRef/);
  assert.match(checkout, /commission,/);
  assert.match(checkout, /transaction\.update\(packageRef/);
  assert.doesNotMatch(checkout, /await adjustStock|await addCashierTransaction|await usePackageSession/);
});

test('concurrent and invalid checkout states abort the entire transaction', async () => {
  const context = await read('src/context/AppContext.tsx');
  const checkout = context.slice(
    context.indexOf('const checkoutBooking ='),
    context.indexOf('// Products stock management')
  );

  assert.match(checkout, /if \(booking\.isPaid\)/);
  assert.match(checkout, /product\.quantity < sale\.quantity/);
  assert.match(checkout, /pkg\.sessionsRemaining <= 0/);
  assert.match(checkout, /packageMatchesBooking/);
});
