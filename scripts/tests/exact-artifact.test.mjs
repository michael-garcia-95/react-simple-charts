import assert from 'node:assert/strict';
import { manifestPolicy, packageName } from '../artifact/manifest-policy.mjs';
import { test } from 'node:test';
import { gzipSync, gunzipSync } from 'node:zlib';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  chmod,
  symlink,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  archiveBytes,
  inspectArchive,
  inventory,
  sha256,
  verifyInstalledInventory,
  verifyCanonicalContent,
} from '../artifact/archive.mjs';
import {
  artifactOptions,
  selectArtifact,
  forbidExactRepack,
} from '../artifact/selection.mjs';
import { prepareExactArchive } from '../consumers/installed-package.mjs';
import {
  requiredEngines,
  smokeScenarios,
  validateGateReport,
} from '../artifact/results.mjs';
import { consumerConfigurations } from '../consumers/fixtures.mjs';

const root = resolve(import.meta.dirname, '../..');
const selectedOptions =
  process.env.RSC_VERIFICATION_POLICY === 'release-candidate'
    ? {
        policy: 'release-candidate',
        'expected-name': packageName,
        'expected-version': process.env.RSC_EXPECTED_VERSION,
      }
    : {};
function tar(entries) {
  const parts = [];
  for (const {
    name,
    bytes = Buffer.from('x'),
    type = '0',
    link = '',
    mode = 0o644,
  } of entries) {
    const header = Buffer.alloc(512);
    header.write(name, 0, 100);
    header.write(mode.toString(8).padStart(7, '0') + '\0', 100);
    header.write('0000000\0', 108);
    header.write('0000000\0', 116);
    header.write(bytes.length.toString(8).padStart(11, '0') + '\0', 124);
    header.write('00000000000\0', 136);
    header.fill(32, 148, 156);
    header.write(type, 156);
    header.write(link, 157, 100);
    header.write('ustar\0', 257);
    header.write('00', 263);
    const sum = header.reduce((a, b) => a + b, 0);
    header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
    parts.push(header, bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512));
  }
  return gzipSync(Buffer.concat([...parts, Buffer.alloc(1024)]));
}
const entries = inventory.map((path) => ({
  name: 'package/' + path,
  bytes: Buffer.from(path),
}));
async function fixture(action) {
  const directory = await mkdtemp(join(tmpdir(), 'rsc-artifact spaces-'));
  try {
    return await action(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
test('bounded real gzip/tar reader accepts exactly six regular files', () => {
  assert.deepEqual([...inspectArchive(tar(entries)).keys()], [...inventory]);
});
for (const [name, mutate] of [
  ['missing file', (rows) => rows.slice(1)],
  ['extra file', (rows) => [...rows, { name: 'package/.npmrc' }]],
  ['duplicate entry', (rows) => [rows[0], rows[0], ...rows.slice(2)]],
  [
    'traversal',
    (rows) => [{ ...rows[0], name: 'package/../LICENSE' }, ...rows.slice(1)],
  ],
  [
    'absolute path',
    (rows) => [{ ...rows[0], name: '/package/LICENSE' }, ...rows.slice(1)],
  ],
  [
    'backslash path',
    (rows) => [{ ...rows[0], name: 'package\\LICENSE' }, ...rows.slice(1)],
  ],
  [
    'symlink',
    (rows) => [
      { ...rows[0], type: '2', link: '/etc/passwd' },
      ...rows.slice(1),
    ],
  ],
  [
    'hardlink',
    (rows) => [
      { ...rows[0], type: '1', link: 'package/README.md' },
      ...rows.slice(1),
    ],
  ],
  [
    'unsafe permissions',
    (rows) => [{ ...rows[0], mode: 0o6777 }, ...rows.slice(1)],
  ],
  ['directory entry', (rows) => [{ ...rows[0], type: '5' }, ...rows.slice(1)]],
  ['extended header', (rows) => [{ ...rows[0], type: 'x' }, ...rows.slice(1)]],
])
  test(`real archive rejects ${name}`, () =>
    assert.throws(() => inspectArchive(tar(mutate(entries)))));
test('rejects malformed, modified, excessive and truncated archive bytes', () => {
  for (const bytes of [
    Buffer.from('not gzip'),
    tar(entries).subarray(0, 20),
    Buffer.alloc(2 * 1024 * 1024 + 1),
    gzipSync(Buffer.alloc(9 * 1024 * 1024)),
    gzipSync(Buffer.alloc(513)),
  ])
    assert.throws(() => inspectArchive(bytes));
});
test('missing and symbolic-link input archives fail closed', () =>
  fixture(async (dir) => {
    await assert.rejects(archiveBytes(join(dir, 'missing.tgz')));
    await writeFile(join(dir, 'regular.tgz'), tar(entries));
    await symlink(join(dir, 'regular.tgz'), join(dir, 'link.tgz'));
    await assert.rejects(
      archiveBytes(join(dir, 'link.tgz')),
      /regular local file/,
    );
  }));
test('complete installed inventory/bytes and missing/modified/extra files', () =>
  fixture(async (dir) => {
    const files = inspectArchive(tar(entries));
    for (const [name, bytes] of files) {
      await mkdir(join(dir, name, '..'), { recursive: true });
      await writeFile(join(dir, name), bytes);
    }
    await verifyInstalledInventory(dir, files);
    await writeFile(join(dir, 'LICENSE'), 'changed');
    await assert.rejects(
      verifyInstalledInventory(dir, files),
      /Installed bytes differ: LICENSE/,
    );
    await writeFile(join(dir, 'LICENSE'), files.get('LICENSE'));
    await rm(join(dir, 'README.md'));
    await assert.rejects(
      verifyInstalledInventory(dir, files),
      /complete six-file inventory/,
    );
    await writeFile(join(dir, 'README.md'), files.get('README.md'));
    await writeFile(join(dir, '.npmrc'), 'bad');
    await assert.rejects(
      verifyInstalledInventory(dir, files),
      /Unexpected installed file/,
    );
  }));
test('exact options require explicit identity and reject repacking without fallback', () => {
  assert.throws(() => artifactOptions(['--artifact', 'a.tgz']), /requires/);
  assert.throws(
    () =>
      artifactOptions([
        '--artifact',
        'a',
        '--sha256',
        'wrong',
        '--source-sha',
        'a'.repeat(40),
      ]),
    /SHA-256/,
  );
  assert.throws(() => forbidExactRepack({}, 'npm', ['pack']), /forbidden/);
  assert.doesNotThrow(() => forbidExactRepack(undefined, 'npm', ['pack']));
});
test('real checkout archive: identity, copied bytes, no repack and mutation rejection', () =>
  fixture(async (dir) => {
    const rows = await Promise.all(
      inventory.map(async (path) => ({
        name: 'package/' + path,
        bytes: await readFile(join(root, path)),
      })),
    );
    const bytes = tar(rows);
    const input = join(dir, 'candidate with spaces.tgz');
    await writeFile(input, bytes);
    const options = {
      ...selectedOptions,
      artifact: input,
      sha256: sha256(bytes),
      'source-sha': execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
    };
    await mkdir(join(dir, 'owned'));
    const artifact = await prepareExactArchive({
      root,
      work: join(dir, 'owned'),
      options,
      run: () => {
        throw new Error('must never repack');
      },
    });
    assert.equal(artifact.identity.sha256, options.sha256);
    assert.deepEqual(await readFile(artifact.genuine), bytes);
    await artifact.verify();
    await writeFile(input, Buffer.concat([bytes, Buffer.from('mutation')]));
    await assert.rejects(artifact.verify(), /changed during verification/);
    await writeFile(input, bytes);
    await chmod(artifact.genuine, 0o644);
    await writeFile(
      artifact.genuine,
      Buffer.concat([bytes, Buffer.from('mutation')]),
    );
    await assert.rejects(artifact.verify(), /changed during verification/);
  }));
for (const bad of ['sha256', 'source', 'name', 'version'])
  test(`real archive rejects wrong ${bad}`, () =>
    fixture(async (dir) => {
      const rows = await Promise.all(
        inventory.map(async (path) => ({
          name: 'package/' + path,
          bytes: await readFile(join(root, path)),
        })),
      );
      if (bad === 'name' || bad === 'version') {
        const entry = rows.find((row) => row.name === 'package/package.json');
        entry.bytes = Buffer.from(
          JSON.stringify({ ...JSON.parse(entry.bytes), [bad]: 'wrong' }),
        );
      }
      const bytes = tar(rows);
      const input = join(dir, 'candidate.tgz');
      await writeFile(input, bytes);
      const options = {
        ...selectedOptions,
        artifact: input,
        sha256: bad === 'sha256' ? '0'.repeat(64) : sha256(bytes),
        'source-sha':
          bad === 'source'
            ? '0'.repeat(40)
            : execFileSync('git', ['rev-parse', 'HEAD'], {
                cwd: root,
                encoding: 'utf8',
              }).trim(),
      };
      await assert.rejects(
        selectArtifact({ root, work: dir, options }),
        bad === 'sha256'
          ? /SHA-256 mismatch/
          : bad === 'source'
            ? /Source SHA claim/
            : /package name|version/,
      );
    }));
const identity = {
  sha256: 'a'.repeat(64),
  size: 123,
  name: packageName,
  private: true,
  version: '0.0.0',
  policy: manifestPolicy(),
  inventory: [],
  source: {
    checkoutSha: 'b'.repeat(40),
    claimedSourceSha: 'b'.repeat(40),
    sourceWorktreeClean: true,
  },
};
const context = {
  name: 'browser-smoke',
  parent: 'parent',
  identity,
  startedAt: '2026-01-01T00:00:00Z',
  finishedAt: '2026-01-01T00:00:03Z',
};
function goodReport() {
  return {
    name: 'browser-smoke',
    mode: 'exact-artifact',
    policy: manifestPolicy(),
    parentRunId: 'parent',
    runId: 'child',
    startedAt: '2026-01-01T00:00:01Z',
    finishedAt: '2026-01-01T00:00:02Z',
    status: 'passed',
    phases: [
      { name: 'cleanup', status: 'passed' },
      { name: 'final outcome', status: 'passed' },
    ],
    cleanupErrors: [],
    diagnosticErrors: [],
    artifact: structuredClone(identity),
    browsers: requiredEngines.map((engine) => ({
      engine,
      status: 'pass',
      artifactSha256: identity.sha256,
      checks: [...smokeScenarios],
      version: '1',
      pageErrors: [],
      axeViolations: 0,
    })),
    server: { status: 'stopped' },
  };
}
test('exact consolidated browser evidence requires all three successful engines', () =>
  validateGateReport(goodReport(), context));
test('manual fixture evidence cannot pass a full gate even with forged browser outcomes', () => {
  for (const marker of [
    { preparedFixture: 'retained-app' },
    { manualVerification: { status: 'not executed' } },
  ])
    assert.throws(
      () => validateGateReport({ ...goodReport(), ...marker }, context),
      /Manual fixture preparation/,
    );
  assert.throws(
    () =>
      validateGateReport(
        {
          ...goodReport(),
          name: 'browser-fixture-preparation',
          mode: 'manual-fixture-preparation',
        },
        context,
      ),
    /Wrong gate name/,
  );
});
for (const [name, change] of [
  [
    'wrong digest',
    (r) => {
      r.artifact.sha256 = 'wrong';
    },
  ],
  [
    'mismatched browser digest',
    (r) => {
      r.browsers[0].artifactSha256 = 'wrong';
    },
  ],
  [
    'failed engine',
    (r) => {
      r.browsers[0].status = 'fail';
    },
  ],
  [
    'unexecuted engine',
    (r) => {
      r.browsers[0].status = 'unexecuted';
    },
  ],
  [
    'missing engine',
    (r) => {
      r.browsers.pop();
    },
  ],
  [
    'duplicate engine',
    (r) => {
      r.browsers[1] = r.browsers[0];
    },
  ],
  [
    'stale report',
    (r) => {
      r.startedAt = '2025-01-01T00:00:00Z';
    },
  ],
  [
    'unrelated parent',
    (r) => {
      r.parentRunId = 'old';
    },
  ],
  [
    'running report',
    (r) => {
      r.status = 'running';
    },
  ],
  [
    'failed report',
    (r) => {
      r.status = 'failed';
    },
  ],
  [
    'missing cleanup',
    (r) => {
      r.phases.shift();
    },
  ],
  [
    'recorded cleanup error',
    (r) => {
      r.cleanupErrors.push({ message: 'bad' });
    },
  ],
  [
    'malformed timestamp',
    (r) => {
      r.finishedAt = 'bad';
    },
  ],
  [
    'missing scenario',
    (r) => {
      r.browsers[0].checks.pop();
    },
  ],
])
  test(`consolidation rejects ${name}`, () => {
    const report = goodReport();
    change(report);
    assert.throws(() => validateGateReport(report, context));
  });
function consumerReport() {
  return {
    ...goodReport(),
    name: 'installed-consumers',
    configurations: consumerConfigurations.map(({ kind, major }) => ({
      kind,
      react: major,
      status: 'passed',
      artifactSha256: identity.sha256,
    })),
    checks: consumerConfigurations.map(({ kind, major }) => ({
      kind,
      react: major,
      status: 'pass',
      artifactSha256: identity.sha256,
    })),
    versions: consumerConfigurations.map(
      ({ kind, react, types, domTypes, framework, compiler, nodeTypes }) => ({
        kind,
        react,
        types,
        domTypes,
        framework,
        typescript: compiler,
        nodeTypes,
      }),
    ),
    servers: consumerConfigurations.map(() => ({ status: 'stopped' })),
  };
}
test('complete pinned consumer evidence is accepted', () =>
  validateGateReport(consumerReport(), {
    ...context,
    name: 'installed-consumers',
  }));
for (const [name, change] of [
  [
    'missing consumer',
    (r) => {
      r.checks.pop();
    },
  ],
  [
    'duplicate consumer',
    (r) => {
      r.checks[1] = r.checks[0];
    },
  ],
  [
    'wrong consumer artifact',
    (r) => {
      r.configurations[0].artifactSha256 = 'wrong';
    },
  ],
  [
    'failed consumer',
    (r) => {
      r.configurations[0].status = 'failed';
    },
  ],
  [
    'wrong framework version',
    (r) => {
      r.versions[0].framework = 'wrong';
    },
  ],
])
  test(`consolidation rejects ${name}`, () => {
    const report = consumerReport();
    change(report);
    assert.throws(() =>
      validateGateReport(report, { ...context, name: 'installed-consumers' }),
    );
  });

test('real legacy validator rejects exact input instead of silently packing', () => {
  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        [
          join(root, 'scripts/verify-package.mjs'),
          '--artifact',
          'missing.tgz',
          '--sha256',
          'a'.repeat(64),
          '--source-sha',
          'b'.repeat(40),
        ],
        { cwd: root, stdio: 'pipe' },
      ),
    (error) =>
      error.status === 1 &&
      /cannot use development packing/.test(error.stderr.toString()),
  );
});
test('header checksum and missing terminator fail before extraction', () => {
  const bytes = tar(entries);
  const raw = gunzipSync(bytes);
  raw[100] ^= 1;
  assert.throws(() => inspectArchive(gzipSync(raw)), /checksum/);
  const truncated = gunzipSync(bytes).subarray(
    0,
    gunzipSync(bytes).length - 1024,
  );
  assert.throws(() => inspectArchive(gzipSync(truncated)), /terminator/);
});

function canonicalFixture() {
  const files = new Map(inventory.map((path) => [path, Buffer.from('text\n')]));
  files.set(
    'dist/index.js.map',
    Buffer.from(
      JSON.stringify({
        sources: ['../src/index.ts'],
        sourcesContent: ['source\n'],
      }),
    ),
  );
  return files;
}
test('canonical content accepts six LF members with parsed LF embedded sources', () => {
  verifyCanonicalContent(canonicalFixture());
});
for (const path of inventory)
  test(`canonical content rejects physical CRLF in ${path}`, () => {
    const files = canonicalFixture();
    files.set(path, Buffer.from(files.get(path).toString() + '\r\n'));
    assert.throws(() => verifyCanonicalContent(files), /Canonical LF required/);
  });
test('canonical content rejects escaped CRLF in sourcesContent despite physical LF map', () => {
  const files = canonicalFixture();
  files.set(
    'dist/index.js.map',
    Buffer.from(
      JSON.stringify({
        sources: ['../src/index.ts'],
        sourcesContent: ['source\r\n'],
      }),
    ),
  );
  assert(!files.get('dist/index.js.map').includes(13));
  assert.throws(
    () => verifyCanonicalContent(files),
    /Canonical LF sourcesContent/,
  );
});
test('canonical content rejects missing/extra members and incomplete/nontext map content', () => {
  const missing = canonicalFixture();
  missing.delete('LICENSE');
  const extra = canonicalFixture();
  extra.set('extra.txt', Buffer.from('text'));
  for (const files of [missing, extra])
    assert.throws(() => verifyCanonicalContent(files), /six-file inventory/);
  for (const content of [undefined, [], [null]]) {
    const files = canonicalFixture();
    files.set(
      'dist/index.js.map',
      Buffer.from(
        JSON.stringify({
          sources: ['../src/index.ts'],
          sourcesContent: content,
        }),
      ),
    );
    assert.throws(() => verifyCanonicalContent(files));
  }
});
test('Git attributes govern all actual embedded sources and package metadata only', async () => {
  const map = JSON.parse(
    await readFile(join(root, 'dist/index.js.map'), 'utf8'),
  );
  const paths = [
    'LICENSE',
    'README.md',
    'package.json',
    ...map.sources.map((path) => path.slice(3)),
  ];
  const result = execFileSync(
    'git',
    ['check-attr', '-z', 'text', 'eol', '--', ...paths],
    { cwd: root },
  )
    .toString()
    .split('\0');
  for (let index = 0; index < result.length - 1; index += 3)
    assert.equal(
      result[index + 2],
      result[index + 1] === 'text' ? 'set' : 'lf',
      result[index],
    );
  const unrelated = execFileSync(
    'git',
    [
      'check-attr',
      '-z',
      'text',
      'eol',
      '--',
      'package-lock.json',
      'scripts/artifact/archive.mjs',
      'tests/package.test.ts',
    ],
    { cwd: root },
  )
    .toString()
    .split('\0');
  for (let index = 0; index < unrelated.length - 1; index += 3)
    assert.equal(unrelated[index + 2], 'unspecified');
});
