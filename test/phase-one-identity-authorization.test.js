import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

test('Phase 1 PIN authentication is hash-only and fails closed',()=>{
  const source=read('supabase/functions/pin-auth/index.ts')
  assert.match(source,/bcrypt\.compare\(pin,credential\.pin_hash\)/)
  assert.doesNotMatch(source,/ruolo,pin,hotels/)
  assert.doesNotMatch(source,/legacy\.pin/)
  assert.match(source,/CREDENTIAL_REQUIRED/)
})
