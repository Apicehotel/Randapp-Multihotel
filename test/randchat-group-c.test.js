import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const integration = readFileSync(new URL('../supabase/migrations/20260905110000_randchat_group_c_operational_integration.sql', import.meta.url), 'utf8')
const mediaHardening = readFileSync(new URL('../supabase/migrations/20260905110100_randchat_group_c_media_hardening.sql', import.meta.url), 'utf8')
const procedureDrafts = readFileSync(new URL('../supabase/migrations/20260905110200_randchat_group_c_procedure_drafts.sql', import.meta.url), 'utf8')
const ciphertextHeadroom = readFileSync(new URL('../supabase/migrations/20260905110300_randchat_dm_ciphertext_headroom.sql', import.meta.url), 'utf8')
const dmUi = readFileSync(new URL('../src/randapp/chat/DirectMessages.jsx', import.meta.url), 'utf8')
const mediaProvider = readFileSync(new URL('../src/randapp/chat/randmedia.js', import.meta.url), 'utf8')
const cleanupWorker = readFileSync(new URL('../supabase/functions/randchat-media-cleanup/index.ts', import.meta.url), 'utf8')
const supabaseConfig = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8')

test('RandMedia keeps provider APIs behind one abstraction and DM media encrypted', () => {
  assert.match(mediaProvider, /getRandMediaProvider/)
  assert.match(mediaProvider, /encryptDmAttachmentBlob/)
  assert.match(mediaProvider, /application\/octet-stream/)
  assert.match(integration, /scope in \('group','dm'\)/i)
  assert.match(integration, /encrypted=true/i)
  assert.match(integration, /chat_dm_send_message_v2/i)
  assert.match(mediaHardening, /queue_orphaned_chat_media/i)
})

test('RandMedia deletion is coupled to chat retention and cleanup is server-authenticated', () => {
  assert.match(integration, /chat_attachments_queue_storage_cleanup/i)
  assert.match(integration, /chat_media_gc_queue/i)
  assert.match(integration, /randchat-media-gc-hourly/i)
  assert.match(cleanupWorker, /x-cron-secret/)
  assert.match(cleanupWorker, /randchat_media_cron_secret/)
  assert.match(cleanupWorker, /queue_orphaned_chat_media/)
  assert.match(supabaseConfig, /\[functions\.randchat-media-cleanup\][\s\S]*verify_jwt\s*=\s*false/i)
})

test('DM ciphertext headroom supports Unicode and encrypted media payload expansion', () => {
  assert.match(ciphertextHeadroom, /between 1 and 65536/i)
  assert.match(ciphertextHeadroom, /chat_dm_send_message\(/i)
  assert.match(ciphertextHeadroom, /revoke all on function public\.chat_dm_send_message/i)
})

test('new Group C SECURITY DEFINER RPCs explicitly revoke anonymous execution', () => {
  for (const name of [
    'chat_list_shareable_procedures',
    'chat_share_procedure',
    'chat_list_group_procedures',
    'chat_group_ai_context',
    'chat_media_path_allowed',
    'chat_register_group_attachment',
    'chat_dm_send_message_v2',
    'chat_create_procedure_draft',
  ]) {
    assert.match(`${integration}\n${mediaHardening}\n${procedureDrafts}`, new RegExp(`revoke all on function public\\.${name}\\(`, 'i'))
  }
})
