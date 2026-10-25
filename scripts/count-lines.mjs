// Counts the code lines of the two spec files that test the same five behaviours,
// and fails if the numbers drift from the ones the write-up quotes.
// A code line is any line that is not blank and not a // comment.
import { readFileSync } from 'node:fs';

const expected = {
  'src/app/copy-button.host.spec.ts': 72,
  'src/app/copy-button.direct.spec.ts': 73,
};

let failed = false;
for (const [file, want] of Object.entries(expected)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const code = lines.filter((l) => l.trim() !== '' && !l.trim().startsWith('//')).length;
  const tests = lines.filter((l) => /^\s*it\(/.test(l)).length;
  const ok = code === want;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${file}: ${code} code lines (expected ${want}), ${tests} tests`);
}
process.exit(failed ? 1 : 0);
