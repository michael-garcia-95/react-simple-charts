// @vitest-environment node
// JSON is a YAML 1.2 subset: parse the workflow without an extra YAML dependency.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = JSON.parse(
  readFileSync(
    new URL('../.github/workflows/deploy-pages.yml', import.meta.url),
    'utf8',
  ),
);
const { build, deploy } = workflow.jobs;

describe('Pages deployment policy', () => {
  it('requires an explicit dispatch on main for both jobs', () => {
    expect(workflow.on).toEqual({ workflow_dispatch: {} });
    expect(Object.keys(workflow.jobs).sort()).toEqual(['build', 'deploy']);
    for (const job of [build, deploy]) {
      expect(job.if).toBe("${{ github.ref == 'refs/heads/main' }}");
      expect(job['continue-on-error']).toBeUndefined();
    }
    expect(deploy.needs).toBe('build');
    expect(workflow.concurrency).toEqual({
      group: 'github-pages',
      'cancel-in-progress': false,
    });
  });

  it('grants only the permissions each job needs', () => {
    expect(workflow.permissions).toEqual({});
    expect(build.permissions).toEqual({ contents: 'read' });
    expect(deploy.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
    expect(build.environment).toBeUndefined();
    expect(deploy.environment).toEqual({
      name: 'github-pages',
      url: '${{ steps.deployment.outputs.page_url }}',
    });
  });

  it('verifies the project artifact before its only upload', () => {
    expect(build.steps).toEqual([
      {
        uses: 'actions/checkout@v6',
        with: { ref: '${{ github.sha }}', 'persist-credentials': false },
      },
      {
        uses: 'actions/setup-node@v6',
        with: { 'node-version': '24', cache: 'npm' },
      },
      { uses: 'actions/configure-pages@v5' },
      { run: 'npm ci' },
      { run: 'npm run build:site:pages' },
      { run: 'node scripts/verify-site-build.mjs /react-simple-charts/' },
      {
        uses: 'actions/upload-pages-artifact@v4',
        with: { path: 'site-dist/' },
      },
    ]);
    expect(deploy.steps).toEqual([
      {
        name: 'Deploy Pages',
        id: 'deployment',
        uses: 'actions/deploy-pages@v4',
      },
    ]);
  });
});
