# Dependency Risk Record

Assessment date: October 16, 2026.

Candidate: `@papakpmartin/node-red-azure-iot-edge@1.0.0-rc.4`
(unchanged resolved dependencies from scoped rc.3 and unscoped rc.2), Node.js 22,
Node-RED 4.1.13/4.1.16 qualification, `azure-iot-device@1.18.4`,
and `azure-iot-device-mqtt@1.16.4`.

`npm audit --omit=dev` reports **zero high/critical** and five moderate affected-package
entries after refreshing compatible transitive resolutions, including
`brace-expansion@1.1.21` and `lodash@4.18.1`. The prior production
`brace-expansion@1.1.18` denial-of-service findings are fixed without an override
or Azure SDK downgrade. The remaining moderate findings are inherited
through the latest active Azure IoT Node.js SDK:

- `azure-iot-device@1.18.4` pins `@azure/storage-blob@12.8.0`.
- That package uses unsupported `@azure/core-http@2.3.2`, which resolves
  `uuid@8.3.2` affected by `GHSA-w5hq-g745-h8pq` when callers provide an
  undersized buffer to UUID v3/v5/v6 APIs.
- The Node-RED nodes in this package do not expose Azure blob/file-upload APIs or
  call UUID generation directly. Exploitability in the implemented twin,
  messaging, and method paths has not been established.
- npm proposes downgrading the direct Azure SDK instead of a compatible fix.
  This project will not downgrade from Azure's active release or force an
  unsupported transitive major override.

Release approval must explicitly accept this residual risk or wait for an Azure
SDK release with updated transitive dependencies. Re-run the production audit at
every release and remove this exception when an upstream-compatible fix exists.

The full development audit reports nine moderate and 17 high affected-package
entries (zero critical), primarily through Node-RED 4.1.16's bundled npm and its
dependency chain. Moving to Node-RED 5 or forcing transitive major overrides is
not an approved fix in this Node-RED 4 qualification release. These development
dependencies are not shipped by this package, but CI executes them. The actual
deployment's Node-RED installation needs its own audit and restricted editor/
palette-management access; installing this package does not patch that runtime.

The library lockfile does not constrain consumer resolution. Qualification must
also install the exact tarball in a fresh directory and audit that production
tree. The fresh-consumer audit reports six moderate affected-package entries
(the same Azure chain plus this package as an affected ancestor), zero high,
and zero critical. Immutable deployment builds should preserve their application lockfile.
Audit counts are observations, not a claim that every advisory is reachable or
that the remaining risks are accepted for stable release.
