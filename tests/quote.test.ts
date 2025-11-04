import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createQuote } from '../lib/quote';
import { QuoteValidationError } from '../lib/validation';

test('createQuote returns pricing and eta information', async () => {
  const result = await createQuote({
    items: [
      {
        productType: 'bonfilet',
        messageText: 'TEAM BONFILET',
        bodyColor: 'black',
        textColor: 'white',
        finish: 'normal',
        size: '12mm/202mm',
        qty: 10,
        options: []
      }
    ],
    shipTo: { country: 'US' }
  });

  assert.equal(result.currency, 'JPY');
  assert.equal(result.needsReview, false);
  assert.deepEqual(result.errors, []);
  assert.ok(result.total > 0);
  assert.deepEqual(result.etaDays, [6, 9]);
});

test('createQuote throws when no items provided', async () => {
  await assert.rejects(async () => {
    await createQuote({ items: [], shipTo: { country: 'US' } });
  }, (error) => {
    assert.ok(error instanceof QuoteValidationError);
    assert.equal(error.body.message, 'No item provided');
    return true;
  });
});
