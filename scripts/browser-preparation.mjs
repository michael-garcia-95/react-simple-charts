import assert from 'node:assert/strict';

// Preparation may retain a human fixture, but can never be a coordinator child.
export function browserExecutionMode({
  exact,
  policy,
  setupOnly,
  prepareOnly,
}) {
  assert(
    !(setupOnly && prepareOnly),
    'Choose driver setup or fixture preparation',
  );
  assert(!(exact && setupOnly), 'Exact mode cannot be driver setup');
  if (exact && prepareOnly) {
    assert.equal(
      policy.name,
      'release-candidate',
      'Exact manual preparation requires explicit release-candidate policy',
    );
    assert(
      !exact['parent-run'],
      'Manual preparation cannot be a coordinator child',
    );
  }
  return {
    name: setupOnly
      ? 'browser-driver-setup'
      : prepareOnly
        ? 'browser-fixture-preparation'
        : 'browser-smoke',
    mode:
      exact && prepareOnly
        ? 'manual-fixture-preparation'
        : exact
          ? 'exact-artifact'
          : 'development',
  };
}
