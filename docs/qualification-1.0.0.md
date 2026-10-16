# 1.0.0 local stable-artifact qualification

Date: October 16, 2026. Result: **local release gates passed**. GitHub CI, manual
tag qualification and OIDC/registry verification are separate subsequent gates;
this pre-publication record does not claim they have completed.

## Artifact

- Package: `@papakpmartin/node-red-azure-iot-edge@1.0.0`.
- Source packed: `2c3aeba` on `master`.
- Tarball: `dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz`.
- SHA-256: `06bd0e8e6a89d79445fed94255ab6c1ad968b9825558fac19c7e96b58f96a714`.
- SHA-1 from npm dry-run: `acc70130e93b621b6372a7cdec031e4edb835c9f`.
- `.sha256` and `.pack.json` sidecars are alongside the artifact. This report and
  owner-approval record are excluded from npm packaging, avoiding self-reference.
- Canonical repository: `papakpmartin/node-red-azure-iot-edge`; public access is
  explicit. Expected release tag: `v1.0.0`, non-prerelease, npm dist-tag `latest`.
- 24 packed files with all six examples and user docs; previous prerelease
  artifacts are preserved, not relabeled or overwritten.

## Preserved behavior and approval

Both runtime JS files, both editor HTML files and `lib/supervised-mqtt.js` are
byte-for-byte identical to rc.4 source `b29791d`. Every resolved lockfile
dependency entry is unchanged; only the root package version changes. All seven
types, flow config references, ports, method correlation/encoding, lifecycle
policies and Node/Node-RED support bounds are preserved.

The owner explicitly approved and authorized stable publication, accepted the
documented dependency risks and current field testing as the release gate, and
deferred unfinished formal live/fault/soak/canary/rollback checks. See
`qualification-1.0.0-approval.md` and `dependency-risk.md`. This is not evidence
that deferred checks ran or that all target deployments are qualified.

## Passing local gates

Environment: macOS ARM64, Node 22.16.0, npm 11.21.1. Root tests use Node-RED
4.1.16; disposable consumer tests cover both supported patches below.

1. Clean `npm ci`, JavaScript/editor/example syntax checks, **38 passing automated
   tests with zero skipped/failed**, and diff whitespace checks.
2. The exact tarball passed fresh installation/discovery/deployment of all six
   examples on Node-RED **4.1.13** and **4.1.16** with fake Azure clients, including
   messages, twins, methods, scalar forwarding and diagnostic wiring.
3. The same tarball passed original unscoped rc.2 → stable scoped 1.0.0 → rc.2
   upgrade/rollback on both patches. Flow IDs, wires, config links and the legacy
   `setValue` method remained unchanged; no competing package/registry-cache edit.
4. The 4.1.16 migration forced historical reconstruction of rc.2 and verified the
   identical original artifact digest. Full-history CI will enforce the same gate.
5. Current repository production audit: five moderate affected-package entries,
   zero high/critical. Each fresh consumer: six moderate, zero high/critical.
   Clean install retains the approved development findings: nine moderate,
   17 high, zero critical. No new dependency fix/override/downgrade was introduced.
6. Source/tag/lock/packed identity, public access, checksum and runtime checks
   passed with `RELEASE_TAG=v1.0.0`, `RELEASE_PRERELEASE=false`. npm availability
   check returned 404 for 1.0.0 before publication.
7. Exact-tarball publication **dry-run** succeeded with public access and `latest`.
   No actual local publication of 1.0.0 was performed or authorized as fallback.
8. `actionlint@1.7.12` accepted both workflows with unavailable optional
   shellcheck/pyflakes disabled.

## External gates still to verify

The owner authorized pushing master, creating v1.0.0 and publishing its stable
GitHub release conditional on passing checks/CI. GitHub's `npm` environment was
inspected: only `v*` tags are allowed; there is no required-reviewer rule. No
environment settings were changed or bypassed. Publication must use the existing
OIDC job rather than local npm credentials.

Wait for pushed-master CI, run the manual workflow on the exact release tag,
verify its downloaded artifact against the local digest, and only then publish
the non-prerelease GitHub release. Verify registry bytes/integrity, provenance,
dist-tags and a clean registry-name install after the actual publishing job.
Record those results separately; no new live Azure/Edge tests are claimed here.
