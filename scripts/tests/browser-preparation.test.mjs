import assert from 'node:assert/strict';
import { test } from 'node:test';
import { browserExecutionMode } from '../browser-preparation.mjs';
import { artifactOptions } from '../artifact/selection.mjs';
import { manifestPolicy } from '../artifact/manifest-policy.mjs';

const args = [
  '--prepare-only',
  '--policy',
  'release-candidate',
  '--expected-name',
  '@michael-garcia-95/react-simple-charts',
  '--expected-version',
  '0.1.0',
  '--artifact',
  'selected.tgz',
  '--sha256',
  'a'.repeat(64),
  '--source-sha',
  'b'.repeat(40),
];
function execution(values) {
  const exact = artifactOptions(values);
  return browserExecutionMode({
    exact,
    policy: manifestPolicy(exact ?? {}),
    setupOnly: values.includes('--install-driver-only'),
    prepareOnly: values.includes('--prepare-only'),
  });
}
test('explicit exact candidate preparation has a distinct manual evidence mode', () => {
  assert.deepEqual(execution(args), {
    name: 'browser-fixture-preparation',
    mode: 'manual-fixture-preparation',
  });
});
for (const key of [
  '--policy',
  '--expected-name',
  '--expected-version',
  '--artifact',
  '--sha256',
  '--source-sha',
])
  test(`candidate manual preparation rejects missing ${key}`, () => {
    const index = args.indexOf(key);
    const values = [...args.slice(0, index), ...args.slice(index + 2)];
    assert.throws(() => execution(values));
  });
test('candidate preparation rejects wrong policy/version/name/digest/source and coordinator parents', () => {
  for (const [key, value] of [
    ['--policy', 'development'],
    ['--expected-version', '0.2.0'],
    ['--expected-name', 'other'],
    ['--sha256', 'bad'],
    ['--source-sha', 'short'],
  ]) {
    const values = [...args];
    values[values.indexOf(key) + 1] = value;
    assert.throws(() => execution(values));
  }
  assert.throws(
    () => execution([...args, '--parent-run', 'parent']),
    /coordinator child/,
  );
  assert.throws(() => execution([...args, '--install-driver-only']), /Choose/);
});
test('development preparation, driver-only setup and exact full execution remain separate', () => {
  assert.deepEqual(execution(['--prepare-only']), {
    name: 'browser-fixture-preparation',
    mode: 'development',
  });
  assert.deepEqual(execution(['--install-driver-only']), {
    name: 'browser-driver-setup',
    mode: 'development',
  });
  assert.deepEqual(execution(args.slice(1)), {
    name: 'browser-smoke',
    mode: 'exact-artifact',
  });
  assert.throws(
    () => execution([...args.slice(1), '--install-driver-only']),
    /driver setup/,
  );
  const development = [...args];
  development[development.indexOf('--policy') + 1] = 'development';
  development[development.indexOf('--expected-version') + 1] = '0.0.0';
  assert.throws(() => execution(development), /explicit release-candidate/);
});
