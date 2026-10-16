# Release Follow-ups

## Stable 1.0.0 Completed — October 16, 2026

- `@papakpmartin/node-red-azure-iot-edge@1.0.0` is published under `latest`;
  `next` remains 1.0.0-rc.4. The old npm package remains available and is not
  installed alongside the new package in tested migrations.
- Master CI, manual v1.0.0 qualification and the release/OIDC workflow passed.
  Registry bytes, provenance, signatures and clean registry-name installation
  were verified. See `docs/qualification-1.0.0-registry.md`.
- Runtime/editor/helper bytes and resolved dependencies are unchanged from rc.4.
  Earlier artifact digests and historical qualification records remain intact.
- The owner explicitly approved current field testing as the stable gate,
  accepted the documented dependency risks, and deferred unfinished formal
  live/fault/soak/canary/rollback checks. These decisions are not newly executed
  field tests; risk acceptance is specific to 1.0.0.

## Continuing Operations

- Continue recommended Linux ARM/Edge deployment validation: workload failure at
  renewal, X.509 twins/rotation, network/Edge Hub recovery, load and redeploys.
- Record soak/canary evidence and rehearse rollback with the matching artifact/
  image, application manifest/lock and flow/config backup. Never run competing
  clients under the same identity or install both npm package names together.
- Reassess `docs/dependency-risk.md` on every release/new advisory/upstream fix.
  Existing production findings are moderate; development dependencies and the
  separately deployed Node-RED runtime still require maintenance.
- Submit the new scoped identity manually to the Node-RED Flow Library when the
  owner authorizes it. Decide on an old-package deprecation notice separately;
  retain old versions for compatibility/rollback and avoid wrapper packages.
- Keep the verified trusted publisher, tag restrictions and OIDC/provenance
  workflow. Do not republish 1.0.0, move its tag, or bypass failing future gates.

## Follow-on Qualification

- Upgrade/qualify maintained GitHub action versions in a separate change: v4
  checkout/setup/upload/download actions currently warn about deprecated Node 20
  action runtimes being forced to Node 24. This does not expand this package's
  supported Node.js application range.
- Qualify the runner image transition: ubuntu-latest moves to Ubuntu 26 beginning
  October 19, 2026. Consider a deliberately qualified runner pin if appropriate.
- Keep field-used Node-RED 4.1.13 in the packed-install/migration matrix. rc.1
  excluded it through an unnecessary minimum; rc.2 fixed that gate.
- Node 24 before Node 22 support ends April 30, 2027; Node-RED 5 separately.
- IoT Edge 1.6 on deployed platforms; Edge 1.5 support ends November 10, 2026.
- Track upstream Azure renewal-error/dependency fixes; remove local transport
  supervision only after equivalent regression tests pass with a fixed SDK.
- Operational queue diagnostics and byte/age admission limits as field needs
  justify them. Package splitting and new authentication modes remain optional.
