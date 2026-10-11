import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('main keeps standalone routes out of the static entry graph', async () => {
  const main = await source('src/main.jsx')
  assert.match(main, /const App = lazyWithRetry\(\(\) => import\('\.\/randapp\/App\.jsx'\)\)/)
  assert.match(main, /const TechnicianPortal = lazyWithRetry\(\(\) => import\('\.\/technician-portal\.jsx'\)\)/)
  assert.match(main, /const PublicIssueView = lazyWithRetry\(\(\) => import\('\.\/public-issue-view\.jsx'\)\)/)
  assert.match(main, /const NtfyShortLink = lazyWithRetry\(\(\) => import\('\.\/randapp\/ntfy\/NtfyShortLink\.jsx'\)\)/)
  assert.doesNotMatch(main, /import App from '\.\/randapp\/App\.jsx'/)
})

test('PWA registration remains immediate while authenticated operational services stay deferred', async () => {
  const main = await source('src/main.jsx')
  for (const module of ['push.js', 'notification-onboarding.js', 'presence-status.js', 'urgent-ownership-guard.js']) {
    assert.match(main, new RegExp(`import\\('\\./${module.replace('.', '\\.')}'\\)`))
  }
  assert.match(main, /import \{ registerPwa \} from '\.\/pwa\.js'/)
  assert.match(main, /registerPwa\(\)/)
  assert.doesNotMatch(main, /afterPageLoad\(\(\) => import\('\.\/pwa\.js'\)/)
  assert.match(main, /const session = loadSession\(\)/)
  assert.match(main, /if \(!session\) return/)
  assert.match(main, /if \(loadSession\(\)\) afterPageLoad\(startOperationalRuntime\)/)
})

test('deployment recovery and visual initialization remain immediate', async () => {
  const main = await source('src/main.jsx')
  assert.match(main, /installDeploymentRecovery\(\)/)
  assert.match(main, /initUiSize\(\)/)
  assert.match(main, /initTheme\(\)/)
})
