# 1.0.0 GitHub/OIDC publication and registry verification

Date: October 16, 2026. **Stable release completed and verified.**

## Published identities and immutable artifacts

- npm: `@papakpmartin/node-red-azure-iot-edge@1.0.0`.
- npm page: https://www.npmjs.com/package/@papakpmartin/node-red-azure-iot-edge/v/1.0.0
- GitHub release: https://github.com/papakpmartin/node-red-azure-iot-edge/releases/tag/v1.0.0
- Release is published, non-draft, non-prerelease and marked latest on GitHub.
- Tag commit: `d9dcbd3e4bc63b5fad0b5e57a06c89699c685562`.
- GitHub release time: `2026-10-16T18:59:11Z`.
- npm publication time: `2026-10-16T19:02:25.828Z`, after registry processing.
- npm tags: **`latest=1.0.0`**, **`next=1.0.0-rc.4`**. No separate tag cleanup or
  prerelease republish was performed.
- File: `papakpmartin-node-red-azure-iot-edge-1.0.0.tgz`.
- SHA-256: `06bd0e8e6a89d79445fed94255ab6c1ad968b9825558fac19c7e96b58f96a714`.
- SHA-1: `acc70130e93b621b6372a7cdec031e4edb835c9f`.

The registry download, local qualified tarball, and artifact downloaded from
GitHub tag qualification are byte-for-byte identical. GitHub release assets
include that tarball, SHA-256 sidecar and pack metadata. They were not replaced
after publication. Earlier rc.4/rc.3/rc.2 artifacts remain preserved.

## Owner authorization and checks before publication

The owner explicitly approved the stable release, accepted documented residual
dependency risks, and approved current field testing as the release gate with
unfinished formal checks deferred. See `qualification-1.0.0-approval.md` and
`dependency-risk.md`. No new live/fault/soak/canary/field rollback tests are claimed.

The approved commits were pushed normally (no force push) before tagging. Gates:

1. [Master CI — passed](https://github.com/papakpmartin/node-red-azure-iot-edge/actions/runs/38950956158).
   Both Node 22 / Node-RED 4.1.16 and Node 22.16.0 / Node-RED 4.1.13 jobs passed,
   including 38 tests, all six packed examples, and legacy upgrade/rollback.
2. Created annotated `v1.0.0` on the qualified commit and pushed that tag.
3. [Manual tag qualification — passed](https://github.com/papakpmartin/node-red-azure-iot-edge/actions/runs/38951204225).
   The publish job was correctly skipped for workflow_dispatch. Downloaded the
   artifact, validated its metadata/checksum/runtime and compared it to the local
   qualified bytes before creating the public GitHub release.
4. [Release publication workflow — passed](https://github.com/papakpmartin/node-red-azure-iot-edge/actions/runs/38951518260).
   The build requalified its exact artifact; the separate npm job verified the
   downloaded artifact and published under `latest` with public access via OIDC.

The `npm` environment's existing `v*` tag restriction was honored. No
required-reviewer rule was configured; no environment setting was added, removed or bypassed.
The owner's explicit release approval authorized these actions. No local stable
publish or token-based fallback was used.

## Provenance and distribution verification

- The npm job signed provenance from GitHub Actions and published it to the
  transparency log: https://search.sigstore.dev/?logIndex=3283442264
- Registry attestations:
  https://registry.npmjs.org/-/npm/v1/attestations/@papakpmartin%2fnode-red-azure-iot-edge@1.0.0
- Inspected the SLSA v1 statement and matched its SHA-512 subject to the qualified
  bytes, repository to `papakpmartin/node-red-azure-iot-edge`, workflow to
  `.github/workflows/npmpublish.yml`, ref to `refs/tags/v1.0.0`, source commit to
  `d9dcbd3e4bc63b5fad0b5e57a06c89699c685562`, and invocation to publishing run
  `38951518260`.
- A clean disposable application installed the registry version string `1.0.0`,
  not a file dependency, using Node 22.16.0/npm 11.21.1 and Node-RED 4.1.13.
- The resulting lockfile has the correct version and registry integrity, and
  does not include the old unscoped package. All six published examples passed
  discovery/behavior/diagnostics against real Node-RED with fake Azure clients.
- `npm audit signatures --omit=dev` succeeded: **202 packages have verified
  registry signatures; three packages have verified attestations**.
- Registry consumer production audit: six moderate affected-package entries,
  zero high/critical, matching the accepted risk record. No dependency changes
  or vulnerability overrides were introduced.

The registry initially returned 404 while npm processed the accepted publication;
no duplicate publish was attempted. Temporary consumer files were removed.

## Maintenance and limits

GitHub Dependabot reported 13 open advisories: 12 development-scope alerts and
the already-reviewed runtime UUID advisory. These align with the existing risk
assessment; they are not new high-severity production findings.

CI succeeded with maintenance warnings: v4 actions target deprecated Node 20 and
are currently forced onto Node 24, and ubuntu-latest is scheduled to migrate to
Ubuntu 26 on October 19, 2026. Update/qualify those action/runner choices in a
separate maintenance change, not by altering the immutable 1.0.0 release.

The actual Linux ARM/Node 22.23.2 deployment still benefits from the recommended
continuing field checks. The owner-approved deferrals and security exception do
not prove unexecuted tests passed or apply automatically to future releases.
Flow Library submission, old-package deprecation and additional account-policy
changes remain separate owner decisions.

This is post-publication documentation, excluded from packaging. The v1.0.0 tag,
published package and release assets are not moved/rebuilt by this record.
