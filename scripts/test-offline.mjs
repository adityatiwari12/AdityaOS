// Previews offline-engine answers for a set of prompts. Run with tsx:
//   npx tsx scripts/test-offline.mjs
import { runOfflineEngine, createContext } from '../src/lib/copilot/index.ts';

const prompts = [
  'who are you',
  'what are your skills',
  'tell me about talkwithdb',
  'what was the hardest part of talkwithdb',
  'what tech does sanjivani use',
  'tell me about your startup',
  'what are your achievements',
  'what can you do',
  'asdkjfh random gibberish',
];

const ctx = createContext();
for (const p of prompts) {
  const r = runOfflineEngine(p, ctx);
  console.log(`\n## "${p}"  (conf ${r.confidence.toFixed(2)}, intent ${r.intentId})`);
  console.log(r.reply);
  if (r.actions?.length) console.log('actions:', JSON.stringify(r.actions));
  if (r.media) console.log('media:', r.media);
}
