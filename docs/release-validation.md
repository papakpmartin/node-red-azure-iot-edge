# Candidate validation and publishing

## Test 1.0.0-rc.1 without npm publication

Use Node 22.16.0 or a newer supported 22.x patch and Node-RED 4.1.14 or newer
within 4.x. Prefer current security patches in actual deployments. Node 24/25
and Node-RED 5 are not supported by this candidate.

1. Preserve the known-good beta.3 tarball, application lockfile, container image
   digest, flows, encrypted credentials/settings secret, certificate references,
   environment, and Edge deployment manifest. Keep secrets outside this repo.
2. Verify the tarball against its `.sha256` file (macOS: `shasum -a 256 -c ...`;
   Linux: `sha256sum -c ...`), running from `dist/`.
3. Copy `dist/node-red-contrib-azure-iot-edge-kpm-1.0.0-rc.1.tgz` into the
   application's `packages/` directory. Change the existing dependency to:

   ```json
   "node-red-contrib-azure-iot-edge-kpm": "file:packages/node-red-contrib-azure-iot-edge-kpm-1.0.0-rc.1.tgz"
   ```

4. Run the application's normal dependency/lockfile update and immutable image
   build. Keep its resolved lockfile and image digest; this library's lockfile
   does not constrain the application's installation.
5. Fully restart Node-RED/the container. Confirm the installed version is rc.1,
   all expected nodes load, and there are no duplicate node-set warnings.
6. Do not operate beta.3 and rc.1 concurrently under the same IoT identity.

The rc.1 method contract is unchanged from beta.3: preserve `msg.requestId`,
return an integer `msg.status` from 100 through 599 and a native JSON payload,
and respond within 25 seconds. Set cloud caller timeouts to at least 30 seconds.

## Live acceptance still required

Capture artifact SHA-256, runtime/SDK/Edge/image versions, architecture, sanitized
routes/config, start/end times, and observed results. Offline fakes cannot prove
Azure connectivity, trust, token renewal, or delivery.

- **Normal operation:** module input/output routes, initial and changed desired
  properties, reported updates, concurrent/reversed method responses, and direct
  device X.509 twin access where used. Confirm there are no silent message losses
  or wrong-request responses.
- **Workload renewal outage:** in an isolated deployment, make the workload API
  unavailable during SAS renewal, then restore it. The process must remain alive,
  log a controlled authentication failure, close/recreate the module client, and
  resume operation without manual redeploy. Never weaken TLS to run this test.
- **Other recovery:** offline boot, short/long network outages, DNS/Edge Hub
  restart, and transient twin failures. Observe recovery after infrastructure
  returns; use the agreed field recovery SLO (proposed: within five minutes).
- **Load:** burst output traffic while methods arrive. Method responses must not
  disappear when telemetry slots are full. Count rejected/uncertain sends rather
  than treating queue admission as downstream delivery.
- **Redeploy/credentials:** child-only and full deploys; repeated method-node
  replacement; certificate replacement followed by config recreation or process
  restart. Check listeners, process memory, and absence of stale messages.
- **Soak/canary:** at least 72 hours across real renewals and a representative
  seven-day canary unless a different gate is explicitly approved. Record CPU,
  memory, reconnect time, method timeouts, and accepted/observed/rejected traffic.
- **Rollback:** stop the candidate and restore the known-good image/package plus
  matching application lock and flow/config snapshot. Verify service returns.

If an SDK close fails or times out, the owner intentionally stops reconnecting
and rejects new work: restart the Node-RED process/container. A timed-out close
is not proof that the old connection has terminated.

## Rebuild and qualify locally

Use npm 11.21.1 with Node 22 (matching `packageManager` and `.nvmrc`):

```sh
npm ci
npm run lint
npm test
npm audit --omit=dev --audit-level=high
RELEASE_TAG=v1.0.0-rc.1 CHECK_NPM_VERSION=1 npm run release:check
npm run pack:release
RELEASE_TAG=v1.0.0-rc.1 npm run release:check -- dist
npm run test:package -- dist/node-red-contrib-azure-iot-edge-kpm-1.0.0-rc.1.tgz
npm publish dist/node-red-contrib-azure-iot-edge-kpm-1.0.0-rc.1.tgz --dry-run --ignore-scripts --tag next
```

`dist/` must contain exactly one release tarball when checked. Preserve old
candidates elsewhere rather than mixing them in this directory. `test:package`
installs the supplied tarball with a fresh consumer dependency resolution,
discovers/deploys all seven types in real Node-RED using fake Azure clients, and
audits the consumer's production tree. It requires registry access and OpenSSL.
Use `NODE_RED_TEST_VERSION=4.1.14` to repeat the packed test at the supported
Node-RED minimum. It is not a live Azure test.

## GitHub/npm setup (maintainer action)

1. Configure an npm trusted publisher for
   `papakpmartin/node-red-contrib-azure-iot-edge-kpm`, workflow `npmpublish.yml`,
   environment `npm`, with direct `npm publish` allowed. This is a one-time npm
   account setting; it cannot be established by a dry-run. Newly configured
   publishers must complete their first publish within npm's validation window.
2. Configure the GitHub `npm` environment with required reviewer protection and
   release-tag restrictions. Protect release tags and review source before tagging.
3. Deliberately create/push `v1.0.0-rc.1` only after local/live qualification is
   acceptable. Use the manual **Node.js Package** workflow with that existing tag
   to exercise the GitHub build/qualification/dry-run path **without publishing**.
4. Only when authorized, publish a GitHub release for that exact tag, marked
   **prerelease**. The `published` event rebuilds/qualifies one artifact and passes
   its tarball/checksum to the approved OIDC job, which verifies them again and
   publishes under `next`. Authentication is tokenless; no npm token is required.
5. Confirm registry integrity/version and install the registry artifact before
   claiming end-to-end npm publication success. Dry-runs do not test OIDC access.

A stable release needs a new `1.0.0` manifest/lock/changelog commit and tag
`v1.0.0`, its own packed-artifact qualification, and a GitHub release **not**
marked prerelease. It publishes under `latest`. Never relabel a beta tarball as
1.0.0 or republish an existing npm version. See `dependency-risk.md` for explicit
security acceptance still needed before stable promotion.
