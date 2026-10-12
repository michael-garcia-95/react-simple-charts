// Focused QA contracts; no browser driver or production modules are loaded here.
/* global document -- focus callbacks execute in the browser */
import assert from 'node:assert/strict';

export function assertApprovedExternalLink(href) {
  const url = new URL(href);
  assert.equal(url.protocol, 'https:', `External link requires HTTPS: ${href}`);
  assert.equal(url.username, '', 'External links must not include credentials');
  assert.equal(url.password, '', 'External links must not include credentials');
  const approved = [
    ['https://github.com', '/michael-garcia-95/react-simple-charts'],
    ['https://michael-garcia-95.github.io', '/react-simple-charts'],
  ];
  assert.ok(
    approved.some(
      ([origin, path]) =>
        url.origin === origin &&
        (url.pathname === path || url.pathname.startsWith(path + '/')),
    ),
    `Unapproved external destination: ${href}`,
  );
}

export async function verifyDocumentationTabOrder(page, examplesPath) {
  const destinations = [
    [
      page.getByRole('link', {
        name: 'interactive examples gallery',
        exact: true,
      }),
      examplesPath,
    ],
    [
      page.getByRole('link', {
        name: 'website is live on GitHub Pages',
        exact: true,
      }),
      'https://michael-garcia-95.github.io/react-simple-charts/',
    ],
    [
      page.getByRole('button', {
        name: 'Copy code: Local repository workflow',
        exact: true,
      }),
    ],
    [page.getByLabel('Local repository workflow', { exact: true })],
  ];
  for (const [index, [target, href]] of destinations.entries()) {
    const label = `Documentation Tab destination ${index + 1}`;
    assert.equal(await target.count(), 1, `${label} must exist uniquely`);
    await page.keyboard.press('Tab');
    assert.ok(
      await target.evaluate((el) => el === document.activeElement),
      `${label} must receive native Tab focus`,
    );
    if (href)
      assert.equal(await target.getAttribute('href'), href, `${label} href`);
  }
}
