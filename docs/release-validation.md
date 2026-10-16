# Stable release migration, validation and publishing

## Release 1.0.0

Release: **`@papakpmartin/node-red-azure-iot-edge@1.0.0`**.
The GitHub repository is now `papakpmartin/node-red-azure-iot-edge`.

**Release context:** the owner published rc.4 to npm on October 16, 2026. Its
registry tarball was verified byte-for-byte against the qualified local artifact,
and all six examples passed a clean registry-name installation on Node-RED 4.1.13.
The owner then explicitly approved current field testing and accepted the
documented dependency risks for stable 1.0.0, deferring unfinished formal field
checks. See `dependency-risk.md` and the source qualification records. This is
not evidence that all recommended live/fault/soak/canary/rollback tests ran.

Stable publication targets `latest`, leaving `next` unchanged. Verify actual
registry availability/tags before rollout. For a registry dependency use version
`1.0.0` rather than the local `file:` value below. Do not republish immutable
versions or overwrite preserved artifacts. The local commands below are release
gates/reproduction instructions, not permission to publish manually after CI.

**Repository-rename status:** 1.0.0 retains rc.4's final repository URLs, runtime,
editor files and resolved dependencies unchanged. Earlier tarballs/reports are
preserved; historical records describe the repository name at packing time.

Use Node 22.16.0 or a newer supported 22.x patch and Node-RED 4.1.13 or newer
within 4.x. Prefer current qualified security patches. Node 24/25 and Node-RED 5
are not qualified. The field deployment reports Node-RED 4.1.13 and Node 22.23.2
on Linux ARM32. rc.1 excluded that Node-RED patch; rc.2 fixed the gate. The scoped
candidate keeps the same support range and runtime/editor code.

### Before changing the deployment

1. Preserve the current known-good scoped rc.4 artifact/image and the unscoped
   rc.2 rollback artifact, application `package.json` and lockfile, image digest,
   flows, encrypted credentials/settings secret,
   certificate references, environment, and Edge deployment manifest. Keep secrets
   outside this repository. Preserve existing beta.3 backups too, where relevant.
2. Verify the new tarball against its `.sha256` sidecar. Run from its directory:

   ```sh
   shasum -a 256 -c papakpmartin-node-red-azure-iot-edge-1.0.0.tgz.sha256
   ```

   On Linux use `sha256sum -c` instead. Retain the `.pack.json` sidecar for release
   identity checks. It records npm's actual filename, not a path containing `@` or `/`.
3. Prefer the exact registry version for normal application builds. For local
   artifact testing, copy `dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz`
   into the application's `packages/` directory.

### Replace the dependency — do not add a second owner

Remove `node-red-contrib-azure-iot-edge-kpm` from application dependencies and add:

```json
{
  "dependencies": {
    "@papakpmartin/node-red-azure-iot-edge": "1.0.0"
  }
}
```

For local artifact testing the dependency value can instead be
`file:packages/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz`.
The two packages register the **same node types**. Do not leave both installed,
use an npm alias, or add a compatibility wrapper. Existing node IDs, type names,
`client` references, wires, ports, and configured method names are unchanged.
Do not edit flow nodes simply to reflect the npm rename.

- **Conventional user directory:** stop Node-RED, run `npm uninstall
  node-red-contrib-azure-iot-edge-kpm`, then run
  `npm install --save-exact @papakpmartin/node-red-azure-iot-edge@1.0.0`.
- **Immutable container:** replace the dependency key, run the application's
  normal dependency/lockfile update and image build, then deploy the replacement
  image. Avoid modifying a running production container.
- **Node-RED Projects:** update the active project's dependency manifest/lockfile
  and dependency metadata through its normal workflow. Changing a different user
  directory does not update a project's dependencies. Keep project backups.

Preserve the resolved application lock and new image digest; a library lockfile
does not constrain consumer installations. Fully restart Node-RED/the container.
Verify the installed scoped package is 1.0.0, the old dependency is absent from
the effective tree, all seven types load, and no duplicate/missing types are
reported. Use `npm ls @papakpmartin/node-red-azure-iot-edge
node-red-contrib-azure-iot-edge-kpm` from the relevant application directory.
Do not hand-edit Node-RED's private registry cache.

The scoped name is a **new npm identity**: old users do not receive it via an
ordinary update of the old package. Version history, download counts, package
access settings and trusted publishers do not transfer. Old published versions
should remain available. Any deprecation notice is a separate maintainer decision
after the new package is established; no old version is unpublished by this work.

The method contract is unchanged from rc.2: preserve `msg.requestId`, return an
integer `msg.status` from 100 through 599 and a native JSON payload within 25
seconds. Caller response timeouts should be at least 30 seconds. A legacy flow
using `setValue` remains `setValue`; `echo` is the name in the newer tutorial
flows, not an automatic migration of existing user configuration.

### Rollback

Stop the scoped candidate. Restore the known-good old image, or restore the old
application manifest/lock and install the unscoped rc.2 artifact with the normal
locked build process. Restore the matching protected flow/config snapshot as
needed. Verify the scoped dependency is removed and existing nodes load. Never
operate old and new clients concurrently under the same IoT identity.

## Field validation: approved gate and deferred checks

Capture artifact SHA-256, runtime/SDK/Edge/image versions, architecture, sanitized
routes/config, start/end times, and observed results. Successful rc.2 field
testing remains useful evidence for the unchanged runtime, but does not itself
qualify every rebuilt image or deployment. Offline fakes cannot prove Azure
connectivity, trust, token renewal, or delivery. On October 16, 2026, the owner
approved current field results as the 1.0.0 release gate and explicitly deferred
any unfinished checks below. Continue these recommendations after release;
do not report deferred tests as passed.

- **Normal operation:** module input/output routes, initial/changed desired state,
  reported updates, concurrent/reversed method responses, and direct X.509 device
  twin access where used. Confirm no silent losses or wrong-request responses.
- **Workload renewal outage:** in an isolated deployment, interrupt the workload
  API at renewal, then restore it. The process must remain alive, log a controlled
  error, close/recreate the module client and resume without manual redeploy.
  Do not weaken TLS to test this.
- **Other recovery:** offline boot, network/DNS outages, Edge Hub restart, and
  transient twin failures. Observe recovery after infrastructure returns against
  the agreed field SLO (proposed: within five minutes).
- **Load:** burst output traffic while methods arrive. Method responses must not
  disappear when telemetry slots are full. Account for rejected/uncertain sends;
  SDK completion is not downstream processing.
- **Redeploy/credentials:** child-only/full deploys, method-node replacement, and
  certificate replacement followed by config recreation or process restart.
  Check listener/memory growth and stale messages.
- **Soak/canary:** at least 72 hours across real renewals and a representative
  seven-day canary, or an explicitly approved alternate gate. Record CPU, memory,
  recovery time, timeouts, and accepted/observed/rejected traffic.
- **Rollback:** rehearse the procedure above under an induced failure.

If an SDK close fails or times out, the owner intentionally refuses a replacement
connection: restart the process/container. A timeout is not proof the old client
terminated.

## Local qualification

Use npm 11.21.1 and Node 22, matching `packageManager` and `.nvmrc`:

```sh
npm ci
npm run lint
npm test
npm audit --omit=dev --audit-level=high
RELEASE_TAG=v1.0.0 CHECK_NPM_VERSION=1 npm run release:check
npm run pack:release
RELEASE_TAG=v1.0.0 RELEASE_PRERELEASE=false npm run release:check -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz
NODE_RED_TEST_VERSION=4.1.13 npm run test:package -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz
NODE_RED_TEST_VERSION=4.1.16 npm run test:package -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz
NODE_RED_TEST_VERSION=4.1.13 npm run test:migration -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz
NODE_RED_TEST_VERSION=4.1.16 npm run test:migration -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz
npm publish ./dist/papakpmartin-node-red-azure-iot-edge-1.0.0.tgz --dry-run --ignore-scripts --access public --tag latest
```

The commands above do not publish. Keep `--dry-run` unless publication is
explicitly authorized. `npm pack --json` supplies the filename; release checks
verify its `.pack.json`, checksum, manifest identity and runtime/editor/helper
bytes. The directory form (`release:check -- dist`) requires exactly one tarball;
pass the exact path when preserving older candidates in the same local directory.
Availability checks deliberately fail once the version is published. Do not
repack/republish an existing version or bypass that guard to rerun a release.

`test:package` resolves a fresh consumer installation, discovers and deploys all
six source examples in real Node-RED with fake Azure clients, exercises their
diagnostics, and audits production dependencies. `test:migration` runs the
original rc.2 flow before/after dependency replacement and after rollback, keeping
its original IDs, wires, config links and `setValue` method. It verifies only one
package owner is present. Neither script connects to Azure.

The migration baseline defaults to the original `dist/...rc.2.tgz`, verified
against its recorded SHA-256. `LEGACY_PACKAGE_TARBALL` can specify that exact
baseline elsewhere. In a clean CI checkout, the script reconstructs the tarball
from commit `f62530dfe2bd1ed1a7b3557fa7a9ced353b0de87` and requires the identical
recorded hash. Full Git history, registry access, OpenSSL and tar are required;
failure to obtain/verify the baseline fails the gate, not a skipped test. Set
`RECONSTRUCT_LEGACY_BASELINE=1` to exercise this path locally.

## npm/GitHub setup — maintainer actions, not automated by local tests

First confirm that you control the npm **`papakpmartin` scope**; the matching
GitHub username alone is not proof. The scoped package is public and needs no
paid private-package plan. Its trusted publisher is separate from the old package.

### First-package bootstrap (historical)

**Completed for rc.4.** The scoped package exists. The owner reports its trusted
publisher is configured. Stable 1.0.0 uses GitHub OIDC, not another local bootstrap.
The explanation below is retained for context; do not repeat the first publish.

If the scoped package does not yet exist, its npm settings may need a bootstrap
publication before trusted publishing can be configured. The straightforward
option is an **explicitly authorized interactive first prerelease publish** of the
final-metadata rc.4 candidate, using its tested tarball, npm
account login/2FA and `--access public --tag next`. Do not
paste account credentials or tokens into this repository or agent output.

After that first publication, configure the package's trusted publisher for a
**subsequent new version**. Do not then try to republish that first version through a GitHub
release: the availability check correctly rejects an already-published version.
A supported staged-package/placeholder bootstrap is another possible route, but
requires separate review/authorization and compatible tooling; this workflow
uses direct publishing and does not create placeholders or stage packages.

No first publication, staging, publisher setup or account changes are performed
by preparing or qualifying this candidate. A dry-run does not bootstrap a package
or prove scope ownership, 2FA permission, or OIDC authorization.

### Trusted publishing once package settings are available

The configured publisher must use these exact fields on the **scoped package**:

| Field | Value |
| --- | --- |
| Organization/user | `papakpmartin` |
| Repository | `node-red-azure-iot-edge` |
| Workflow filename | `npmpublish.yml` |
| Environment | `npm` |
| Allowed action | Direct `npm publish` |

Configure GitHub's `npm` environment with required-reviewer/tag protections. npm
currently requires a new trusted publisher's first successful publish within two
days; create it when ready to publish the next candidate, not weeks in advance.
Dry-runs and `npm whoami` do not validate OIDC publishing access.

For a version not already published, deliberately create/push its matching
`v<version>` tag only when authorized. The manual **Node.js Package** workflow
qualifies that existing tag without publication. Publishing a GitHub release
marked **prerelease** runs exact-artifact qualification and the approved OIDC job,
publishing under `next` with public access. It transfers the tarball, checksum
and pack identity metadata rather than rebuilding during the publish job.
Provenance is generated by supported public GitHub OIDC publishing, not proven
by a local dry-run.

Verify registry identity/integrity and install the registry artifact before
claiming end-to-end publication success. Then manually submit the new npm
identity at https://flows.nodered.org/add/node; the `node-red` keyword does not
automatically create or migrate a Flow Library entry. Decide on any old-package
deprecation message separately after successful adoption; leave old versions
available for existing users and rollback.

For 1.0.0, push the approved manifest/lock/changelog and qualification commits,
wait for CI, create `v1.0.0`, and run the manual tag qualification workflow before
publishing the GitHub release **not** marked prerelease. Approve the protected
`npm` environment when requested. The publish job uses OIDC and `latest`; it must
not be bypassed with local credentials if authentication or approval fails.
Verify registry bytes/integrity and a clean registry-name installation afterward.
The owner has authorized these release actions and the documented risk exception;
new failures or new risks still block the release pending a separate decision.
