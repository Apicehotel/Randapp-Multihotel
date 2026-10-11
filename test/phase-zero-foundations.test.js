import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Phase 0 keeps Vercel paused and makes main the stable Ocean deploy source', () => {
  const vercel = JSON.parse(read('vercel.json'))
  const preview = read('.github/workflows/digitalocean-preview.yml')

  assert.equal(vercel.git?.deploymentEnabled, false)
  assert.equal(existsSync(new URL('../.github/workflows/digitalocean-deploy.yml', import.meta.url)), false)
  assert.ok(preview.includes('push:'))
  assert.ok(preview.includes('- main'))
  assert.ok(preview.includes('pull_request:'))
  assert.ok(preview.includes('workflow_dispatch:'))
  assert.ok(preview.includes('environment: preview'))
  assert.ok(!preview.includes('environment: production'))
  assert.ok(preview.includes("github.event_name == 'push'"))
  assert.ok(preview.includes('refs/heads/main'))
  assert.ok(!preview.includes("if: github.event_name == 'pull_request'"))
  assert.doesNotMatch(preview, /vercel/i)
})
