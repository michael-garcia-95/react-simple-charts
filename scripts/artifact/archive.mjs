// Strict, bounded npm archive reader. No tar executable or archive-controlled extraction.
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { lstat, open, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const inventory = Object.freeze([
  'LICENSE',
  'README.md',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'package.json',
]);
export const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
export async function archiveBytes(path) {
  const info = await lstat(path);
  assert(
    info.isFile() && !info.isSymbolicLink(),
    'Artifact must be a regular local file, not a link',
  );
  assert(
    info.size > 0 && info.size <= 2 * 1024 * 1024,
    'Archive exceeds 2 MiB compressed limit or is empty',
  );
  const handle = await open(path, 'r');
  try {
    const opened = await handle.stat();
    assert(
      opened.isFile() && opened.size === info.size && opened.ino === info.ino,
      'Archive changed while opening',
    );
    const buffer = Buffer.alloc(2 * 1024 * 1024 + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        length,
        buffer.length - length,
        length,
      );
      if (!bytesRead) break;
      length += bytesRead;
    }
    assert(
      length > 0 && length <= 2 * 1024 * 1024,
      'Archive grew beyond limit',
    );
    assert.equal(length, opened.size, 'Archive size changed while reading');
    const after = await handle.stat();
    assert.equal(after.size, opened.size, 'Archive size changed while reading');
    assert.equal(
      after.mtimeMs,
      opened.mtimeMs,
      'Archive modified while reading',
    );
    return Buffer.from(buffer.subarray(0, length));
  } finally {
    await handle.close();
  }
}
function text(header, start, length) {
  const field = header.subarray(start, start + length);
  const zero = field.indexOf(0);
  const data = zero < 0 ? field : field.subarray(0, zero);
  assert(
    !data.some((byte) => byte < 32 || byte > 126),
    'Non-ASCII archive header',
  );
  if (zero >= 0)
    assert(
      field.subarray(zero).every((byte) => byte === 0),
      'Malformed archive string padding',
    );
  return data.toString();
}
function octal(header, start, length) {
  const value = header
    .subarray(start, start + length)
    .toString()
    .replace(/\0/g, '')
    .trim();
  assert(/^[0-7]+$/.test(value), 'Malformed tar numeric field');
  return Number.parseInt(value, 8);
}
export function inspectArchive(bytes) {
  assert(bytes.length <= 2 * 1024 * 1024, 'Compressed archive limit');
  const tar = gunzipSync(bytes, { maxOutputLength: 8 * 1024 * 1024 });
  assert(tar.length % 512 === 0, 'Truncated tar blocks');
  const files = new Map();
  let offset = 0;
  let ended = false;
  while (offset < tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      assert(
        tar.length - offset >= 1024 &&
          tar.subarray(offset).every((byte) => byte === 0),
        'Invalid tar end/padding',
      );
      ended = true;
      break;
    }
    assert(files.size < 6, 'Too many archive entries');
    const sum = header.reduce(
      (total, byte, index) => total + (index >= 148 && index < 156 ? 32 : byte),
      0,
    );
    assert.equal(octal(header, 148, 8), sum, 'Invalid tar header checksum');
    assert.equal(
      text(header, 257, 6),
      'ustar',
      'Only ordinary ustar archives are supported',
    );
    const prefix = text(header, 345, 155);
    const name = (prefix ? prefix + '/' : '') + text(header, 0, 100);
    assert(
      /^package\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/.test(name),
      'Unsafe archive path',
    );
    assert(
      !name.split('/').some((part) => part === '.' || part === '..'),
      'Archive path traversal',
    );
    assert(
      header[156] === 0 || header[156] === 48,
      'Only regular files are supported; no links, directories or extended headers',
    );
    assert.equal(
      text(header, 157, 100),
      '',
      'Archive link target is forbidden',
    );
    const relative = name.slice('package/'.length);
    assert(
      inventory.includes(relative),
      `Unexpected archive file: ${relative}`,
    );
    assert(!files.has(relative), `Duplicate archive entry: ${relative}`);
    const mode = octal(header, 100, 8);
    assert(
      (mode & ~0o644) === 0 && (mode & 0o400) !== 0,
      'Unsafe archive permissions: executable, special or shared-writable bits',
    );
    const size = octal(header, 124, 12);
    assert(size <= 4 * 1024 * 1024, 'Archive file exceeds 4 MiB limit');
    const start = offset + 512;
    const next = start + Math.ceil(size / 512) * 512;
    assert(next <= tar.length, 'Truncated archive content');
    files.set(relative, Buffer.from(tar.subarray(start, start + size)));
    assert(
      tar.subarray(start + size, next).every((byte) => byte === 0),
      'Nonzero file padding',
    );
    offset = next;
  }
  assert(ended, 'Missing tar terminator');
  assert.deepEqual(
    [...files.keys()].sort(),
    [...inventory],
    'Exactly six approved files are required',
  );
  return files;
}
// Check actual archive bytes; checkout attributes alone cannot detect leaked CRLF.
export function verifyCanonicalContent(files) {
  assert.deepEqual(
    [...files.keys()].sort(),
    [...inventory],
    'Canonical six-file inventory',
  );
  for (const path of inventory) {
    assert(!files.get(path).includes(13), `Canonical LF required: ${path}`);
  }
  const map = JSON.parse(files.get('dist/index.js.map').toString());
  assert(
    Array.isArray(map.sources) && map.sources.length > 0,
    'Source-map sources required',
  );
  assert(
    Array.isArray(map.sourcesContent),
    'Embedded source-map content required',
  );
  assert.equal(
    map.sourcesContent.length,
    map.sources.length,
    'Complete embedded source-map content required',
  );
  for (const [index, content] of map.sourcesContent.entries()) {
    assert(typeof content === 'string', 'Embedded source must be text');
    assert(
      !content.includes('\r'),
      `Canonical LF sourcesContent required: ${map.sources[index]}`,
    );
  }
}
export async function verifyInstalledInventory(directory, files) {
  const found = [];
  async function visit(path, prefix = '') {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const name = prefix + entry.name;
      const target = join(path, entry.name);
      assert(!entry.isSymbolicLink(), `Installed symlink forbidden: ${name}`);
      if (entry.isDirectory()) {
        assert.equal(name, 'dist', `Unexpected installed directory: ${name}`);
        await visit(target, name + '/');
      } else {
        assert(entry.isFile(), `Unexpected installed type: ${name}`);
        found.push(name);
        assert(files.has(name), `Unexpected installed file: ${name}`);
        assert.deepEqual(
          await readFile(target),
          files.get(name),
          `Installed bytes differ: ${name}`,
        );
      }
    }
  }
  const root = await lstat(directory);
  assert(
    root.isDirectory() && !root.isSymbolicLink(),
    'Installed package root must be a real directory',
  );
  await visit(directory);
  assert.deepEqual(
    found.sort(),
    [...inventory],
    'Installed complete six-file inventory differs',
  );
}
