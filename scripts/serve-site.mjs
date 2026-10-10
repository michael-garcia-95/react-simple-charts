// Local static verification server. No SPA fallback: only emitted directory pages exist.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve(import.meta.dirname, '..', 'site-dist');
const base =
  process.argv.find((arg) => arg.startsWith('--base='))?.slice(7) ?? '/';
const port = Number(
  process.argv.find((arg) => arg.startsWith('--port='))?.slice(7) ?? 4320,
);
if (!/^\/(?:[a-z0-9-]+\/)*$/.test(base))
  throw new Error('Invalid local mount path');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.map': 'application/json',
};
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    if (!path.startsWith(base)) throw new Error('Outside mount');
    let file = resolve(root, path.slice(base.length));
    if (file !== root && !file.startsWith(root + sep))
      throw new Error('Outside output');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Static QA: http://127.0.0.1:${port}${base}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => server.close());
