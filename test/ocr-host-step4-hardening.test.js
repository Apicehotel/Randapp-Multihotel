import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('hotel WhatsApp test requires an explicit recipient', () => {
  const flow = read('supabase/functions/create-and-send-hotel-test-whatsapp/index.ts')
  assert.match(flow, /recipient_required/)
  assert.doesNotMatch(flow, /\+393341196935/)
})

test('offline drain validates hotel-scoped outbox envelopes', () => {
  const store = read('src/offline-store.js')
  assert.match(store, /validateOutboxOperation/)
  assert.match(store, /idempotencyKey:stableOperationId/)
  assert.match(store, /idempotencyKey: op\.idempotencyKey \|\| op\.operationId/)
})
