# Changelog

## 1.0.0-rc.3

- Move the npm distribution to `@papakpmartin/node-red-azure-iot-edge` with explicit
  public access. The GitHub repository is unchanged. Remove the old unscoped
  dependency before installing the new package; do not keep both installed.
- Preserve all seven node types, runtime/editor/helper bytes, flow configuration,
  and resolved dependencies from rc.2. No flow rewiring or method-name migration
  is required.
- Make exact-artifact release checks scope-aware, using npm-reported filenames,
  identity metadata, and SHA-256 sidecars. Add old-to-scoped upgrade and rollback
  tests with the original rc.2 artifact and unchanged legacy flow.

- Add a newcomer-oriented README with connection selection, a routed-message
  quick start, message contracts, diagnostics, and troubleshooting. Move project
  history and attribution below the usage documentation.
- Add five focused, annotated examples for module output, twin, echo method,
  routed forwarding, and direct X.509 device twin access. Make the combined
  example self-contained and manual, with scalar-safe JSON forwarding.
- Check every example's syntax/references and deploy each packed example in
  isolated Node-RED tests, including Catch/Status/Complete diagnostics.
- No runtime, dependency, or already-built rc.2 artifact changes. The scoped
  tarball is a distinct new candidate and still needs field acceptance.

## 1.0.0-rc.2

- Restore compatibility with the deployed Node-RED 4.1.13 runtime by lowering the
  declared minimum from 4.1.14 to 4.1.13. The rc.1 gate caused Node-RED to skip
  the package entirely, reporting missing module node types.
- Add Node-RED 4.1.13 packed-install qualification to CI and update installation
  guidance. All seven types and the bundled method round-trip pass on 4.1.13.
- No runtime JavaScript or resolved dependency changes from rc.1. Existing flows
  need no node-type or wiring edits; install the new tarball and restart.

## 1.0.0-rc.1

- Contain SDK authentication-provider renewal failures through the transport
  constructor hook while retaining Azure's environment factory, signing, gateway,
  and trust-bundle behavior. Close before recreating a failed client.
- Stop startup/recovery after an uncertain client close; retain error protection
  and reject new input until Node-RED is restarted. Prevent queued sends from
  bypassing an in-progress recovery close.
- Retry transient passive Device Twin initialization failures with bounded backoff.
- Separate direct-method response capacity from telemetry and retain requests
  rejected by response admission until they complete or expire.
- Keep Module Output status synchronized with connection lifecycle changes.
- Refresh compatible dependencies, including fixed production brace-expansion;
  qualify with Node-RED 4.1.16 and retain tested 4.1.14 compatibility.
- Align support with Node.js >=22.16.0 <23 and Node-RED >=4.1.14 <5.
- Add exact-tarball installation/discovery, editor syntax, fault-path, and release
  identity/checksum tests. Pin npm 11.21.1 and prepare OIDC trusted publishing.

This is a local qualification candidate, not an assertion of live Azure/Edge
acceptance. See `docs/release-validation.md` for installation, fault/soak checks,
rollback, residual dependency risks, and npm publishing setup.

## 1.0.0-beta.3

- Restore one Node-RED manifest entry per runtime/editor pair so the combined
  Module Client node set is loaded only once.
- Add source and packed-artifact checks that reject duplicate Node-RED entry
  points.

## 1.0.0-beta.2

- Restore Azure's official `ModuleClient.fromEnvironment` construction path for
  IoT Edge workload authentication and trust-bundle configuration.
- Retain the refactored connection ownership, retry, shutdown, messaging, and
  Direct Method correlation behavior from beta.1.

## 1.0.0-beta.1

- Require Node.js 22 and Node-RED 4.
- Upgrade to `azure-iot-device@1.18.4` and
  `azure-iot-device-mqtt@1.16.4`.
- Remove the unused AMQP transport.
- Preserve the node types and flow configuration references from 0.6.1.
- Give each Device Client configuration its own validated X.509 client and twin.
- Give the single supported Module Client configuration explicit lifecycle and
  child registration ownership while retaining Azure's official environment and
  workload authentication factory.
- Bound pending operations and direct-method requests.
- Add direct-method request correlation with `msg.requestId`; send native JSON
  response payloads rather than double-encoded objects.
- Add Node-RED runtime tests, Node 22 CI, package-content checks, and updated
  X.509, workload, migration, and rollback guidance.

This is a prerelease. Live IoT Hub/IoT Edge qualification, soak testing, and a
field canary are required before promotion to 1.0.0.
