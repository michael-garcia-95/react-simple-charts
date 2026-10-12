# Public types

`contracts.ts` defines the generic props for all five runtime components, shared
accessibility/sizing options, field-key mappings, axis/series configuration,
tooltip contexts and activation payloads. Public types are re-exported through
`src/index.ts`; consumers import from the package root.

Record types are inferred from `data`. `NoInfer` prevents mappings and callbacks
from widening that inference; discriminated unions enforce exclusive single/multi
series and scale-specific keys/formatters. Internal engine and renderer types stay
with their owning modules. See [API type contracts](../../docs/API_TYPE_CONTRACTS.md).
