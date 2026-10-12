// @vitest-environment node
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const { assertApprovedExternalLink } = createRequire(import.meta.url)(
  '../scripts/site-verification-contracts.mjs',
);

describe('production website external destination policy', () => {
  it.each([
    'https://github.com/michael-garcia-95/react-simple-charts',
    'https://github.com/michael-garcia-95/react-simple-charts/issues',
    'https://github.com/michael-garcia-95/react-simple-charts/blob/main/docs/API_TYPE_CONTRACTS.md#types',
    'https://github.com/michael-garcia-95/react-simple-charts/tree/main/docs',
    'https://michael-garcia-95.github.io/react-simple-charts/',
    'https://michael-garcia-95.github.io/react-simple-charts/documentation/?view=reference',
  ])('accepts an approved origin and project path: %s', (href) => {
    expect(() => assertApprovedExternalLink(href)).not.toThrow();
  });
  it.each([
    'http://github.com/michael-garcia-95/react-simple-charts',
    'http://michael-garcia-95.github.io/react-simple-charts/',
    'https://github.com.evil.example/michael-garcia-95/react-simple-charts',
    'https://michael-garcia-95.github.io.evil.example/react-simple-charts/',
    'https://evil.example/https://github.com/michael-garcia-95/react-simple-charts',
    'https://github.com/michael-garcia-95/react-simple-charts-evil',
    'https://github.com/michael-garcia-95/react-simple-charts-evil/docs',
    'https://michael-garcia-95.github.io/react-simple-charts-evil/',
    'https://michael-garcia-95.github.io/another-project/',
    'https://github.com/another-owner/react-simple-charts',
    'https://github.com:8443/michael-garcia-95/react-simple-charts',
    'https://user@github.com/michael-garcia-95/react-simple-charts',
    'https://github.com/michael-garcia-95/react-simple-charts/../other',
    'https://michael-garcia-95.github.io/react-simple-charts/%2e%2e/other/',
    'https://github.com/michael-garcia-95/react-simple-charts%2fother',
    'javascript:alert(1)',
    '//github.com/michael-garcia-95/react-simple-charts',
    'not a URL',
  ])(
    'rejects unauthorized, misleading or malformed destination: %s',
    (href) => {
      expect(() => assertApprovedExternalLink(href)).toThrow();
    },
  );
});

const { verifyDocumentationTabOrder } = createRequire(import.meta.url)(
  '../scripts/site-verification-contracts.mjs',
);
const gallery = 'interactive examples gallery';
const live = 'website is live on GitHub Pages';
const copy = 'Copy code: Local repository workflow';
const code = 'Local repository workflow';
function focusPage(order: string[], examplesPath: string) {
  let index = -1;
  const target = (name: string) => ({
    count: async () => (order.includes(name) ? 1 : 0),
    evaluate: async () => order[index] === name,
    getAttribute: async () =>
      name === gallery
        ? examplesPath
        : 'https://michael-garcia-95.github.io/react-simple-charts/',
  });
  return {
    keyboard: {
      press: async (key: string) => {
        expect(key).toBe('Tab');
        index++;
      },
    },
    getByRole: (_role: string, options: { name: string }) =>
      target(options.name),
    getByLabel: (name: string) => target(name),
  };
}
describe.each(['/', '/react-simple-charts/'])(
  'documentation focus contract under %s',
  (base) => {
    it('requires every expected destination in native Tab order', async () => {
      const path = base + 'examples/';
      await expect(
        verifyDocumentationTabOrder(
          focusPage([gallery, live, copy, code], path),
          path,
        ),
      ).resolves.toBeUndefined();
    });
    it.each([
      ['missing live link', [gallery, copy, code]],
      ['missing copy button', [gallery, live, code]],
      [
        'unexpected intermediate stop',
        [gallery, 'Unexpected link', live, copy, code],
      ],
      ['reordered destinations', [live, gallery, copy, code]],
    ])('rejects %s without skipping focus stops', async (_case, order) => {
      const path = base + 'examples/';
      await expect(
        verifyDocumentationTabOrder(focusPage(order as string[], path), path),
      ).rejects.toThrow(/Documentation Tab destination/);
    });
  },
);
