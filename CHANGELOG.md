# Changelog

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
