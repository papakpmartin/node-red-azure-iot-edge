# 1.0.0-rc.1 local qualification record

Date: October 15, 2026. Result: **offline qualification passed; field acceptance
and real npm publication are not yet established**.

## Artifact

- Source commit used to pack: `8332ba9` on `master`.
- File: `dist/node-red-contrib-azure-iot-edge-kpm-1.0.0-rc.1.tgz`.
- SHA-256: `abc3f45b7f367c56d193a51a6cbdf506a8dd83de379254931d48d18309f3b348`.
- SHA-1 reported by npm dry-run: `de3e5473c06628ccca12d740c84c5310c60e6adb`.
- Contents: 19 files; runtime/editor pairs, helper, icons/images, example, license,
  changelog, README, dependency risk and validation instructions. No tests,
  tooling, historical proposal, qualification reports, or nested tarballs.
- This record is deliberately excluded from the tarball to avoid a self-referential
  artifact checksum. The `.tgz` and checksum sidecar are local ignored build output,
  not committed binaries. No release tag was created.

## Environment

- macOS ARM64; Node.js `22.16.0`; npm `11.21.1`.
- Repository tests: Node-RED `4.1.16`, test helper `0.3.6`.
- Fresh packed installs: Node-RED `4.1.14` and `4.1.16`, each in its own disposable
  Node-RED user directory with newly resolved consumer dependencies.
- SDK: `azure-iot-device@1.18.4`, `azure-iot-device-mqtt@1.16.4`.

## Passing checks

1. Clean `npm ci` from the committed lockfile.
2. `npm run lint`: runtime, helper, tooling/tests, embedded editor scripts and
   example function JavaScript syntax.
3. `npm test`: **26 passed, zero failed/skipped**. Includes startup failed/hung
   close for both owners, no restart from new input after uncertain close,
   authentication errors during open/after readiness, passive twin retry and
   cancellation, response saturation and exact-once completion, output status,
   recovery drain admission, and release-identity/registry failure checks.
4. Real SDK subprocess with a local simulated workload HTTP API: initial signing
   succeeds, timer-driven signing failure is contained, and signing through a
   replacement SDK factory succeeds. This exercises the exact installed SDK and
   transport adapter, but not an actual MQTT connection or Azure deployment.
   Owner close/reconnect behavior is tested separately with deterministic fakes.
5. Exact tarball installation/discovery/deploy under both qualified Node-RED
   patches: two node sets, all seven types discovered and constructed, bundled
   method example responds with correlated native JSON; no Node-RED error logs.
6. Production audit: repository has five moderate affected-package entries, zero
   high/critical. Both fresh consumer trees have six moderate entries (including
   the package ancestor), zero high/critical. Fixed production brace-expansion
   resolves to `1.1.21`. See `dependency-risk.md` for unaccepted residual risks.
7. Tag/source/lock/packed version checks and SHA-256 verification passed for
   `v1.0.0-rc.1`; registry confirmed rc.1 was available.
8. Negative CLI checks rejected a wrong release tag, corrupt checksum sidecar,
   multiple tarballs, and an already-published version (`0.6.1`). Registry 503/
   network failure behavior is also covered by automated tests.
9. `npm publish ./dist/...rc.1.tgz --dry-run --ignore-scripts --tag next` passed
   against the final artifact. npm correctly warned that actual publication needs
   authentication. Nothing was published.
10. `actionlint@1.7.12` accepted both workflows; optional shellcheck/pyflakes
    integrations were disabled because those binaries were unavailable.

## Not qualified / next owner actions

- No live IoT Edge/IoT Hub tests, Linux-container/CPU qualification, certificate
  trust/rotation test, fault-at-real-renewal test, soak, canary, or rollback drill
  were performed. Follow `release-validation.md` using the exact artifact above.
- No new workflow was run on GitHub; no push, tag, GitHub release, npm publish,
  dist-tag update, or npm/GitHub account configuration change was performed.
- npm trusted publisher permissions and the protected `npm` GitHub environment
  still require maintainer setup and a real authorized publish to verify OIDC.
- Full development audit still reports nine moderate and 17 high affected-package
  entries, mostly in Node-RED 4's bundled npm chain. They are not shipped by this
  library; the deployed Node-RED runtime needs its own assessment.
- Node 22's newest patch is included in CI configuration but was not run locally;
  local evidence is for Node `22.16.0`. Node 24/25 and Node-RED 5 are not qualified.

Stable 1.0.0 promotion remains conditional on field acceptance and explicit
security-risk approval, not merely this offline report.
