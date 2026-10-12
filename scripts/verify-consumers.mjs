// Optional development gate: real archives, disposable apps, and retained evidence.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createEvidenceRun } from './verification-evidence.mjs';
import { installBrowserDriver, loadBrowserDriver } from './browser-driver.mjs';
import { fixtureIdentity } from './verification-server.mjs';
import {
  consumerConfigurations,
  createConsumerFixture,
} from './consumers/fixtures.mjs';
import {
  prepareDevelopmentArchive,
  installAndVerifyConsumer,
} from './consumers/installed-package.mjs';
import { verifyConsumerBrowser } from './consumers/browser.mjs';
import {
  initialConsumerReport,
  createConsumerIO,
  recordBuildEvidence,
  assertConsumerCompleteness,
} from './consumers/evidence.mjs';

const root = resolve(import.meta.dirname, '..');
const base = join(root, 'work/consumers');
const evidenceRun = await createEvidenceRun(
  base,
  'installed-consumers',
  initialConsumerReport(consumerConfigurations),
);
const report = evidenceRun.report;
let browser;
let scratch;
evidenceRun.onCancel(() => browser?.close());
await evidenceRun.execute(
  async () => {
    scratch = await mkdtemp(join(base, 'temporary-'));
    const work = scratch;
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    const packageName = pkg.name;
    const installedEntry = `node_modules/${packageName}/dist/index.js`;
    const env = {
      ...process.env,
      npm_config_cache: join(base, 'npm-cache'),
      NEXT_TELEMETRY_DISABLED: '1',
    };
    const { run, file, json } = createConsumerIO({ root, evidenceRun, env });
    const { genuine, js, metadata } = await prepareDevelopmentArchive({
      root,
      work,
      run,
    });
    report.artifacts.genuine = metadata;
    const driver = join(base, 'driver');
    await evidenceRun.phase('driver preparation', () =>
      installBrowserDriver(driver, { env, signal: evidenceRun.signal }),
    );
    const {
      engines: { chromium },
      AxeBuilder,
    } = loadBrowserDriver(driver);
    browser = await evidenceRun.phase('browser launch', () =>
      chromium.launch({
        executablePath: process.env.RSC_BROWSER_PATH,
        headless: true,
        args: ['--no-sandbox'],
        timeout: 15000,
      }),
    );
    report.browser = browser.version();
    for (const row of consumerConfigurations) {
      const { kind, major, port } = row;
      const configuration = report.configurations.find(
        (item) => item.kind === kind && item.react === major,
      );
      configuration.status = 'running';
      await evidenceRun.persist();
      const dir = join(work, `${kind}-${major}`);
      const identity = fixtureIdentity(`${kind}-${major}`);
      // Same-version tarballs must never reuse a prior installation/lockfile.
      await rm(dir, { recursive: true, force: true });
      await createConsumerFixture({
        root,
        dir,
        pkg,
        genuine,
        identity,
        configuration: row,
        file,
        json,
      });
      await installAndVerifyConsumer({
        dir,
        configuration: row,
        installedEntry,
        js,
        packageName,
        file,
        run,
      });
      await recordBuildEvidence({
        dir,
        configuration: row,
        installedEntry,
        packageName,
        report,
        file,
        json,
      });
      await evidenceRun.phase('browser assertions', () =>
        verifyConsumerBrowser({
          dir,
          kind,
          major,
          port,
          identity,
          browser,
          AxeBuilder,
          env,
          evidenceRun,
          report,
          file,
        }),
      );
      configuration.status = 'passed';
      await evidenceRun.persist();
    }
    assertConsumerCompleteness(report, consumerConfigurations);
  },
  async () => {
    const cleanup = await Promise.allSettled([
      browser?.close(),
      scratch
        ? rm(scratch, { recursive: true, force: true })
        : Promise.resolve(),
    ]);
    const errors = cleanup
      .filter((item) => item.status === 'rejected')
      .map((item) => item.reason);
    if (errors.length)
      throw new AggregateError(errors, 'Consumer cleanup failed');
  },
);
console.log(JSON.stringify(report, null, 2));
