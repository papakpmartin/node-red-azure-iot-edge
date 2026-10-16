# Scoped 1.0.0-rc.3 local qualification

Date: October 16, 2026. Result: **scoped packaging, fresh installs, legacy upgrade
and rollback passed locally; field acceptance and npm publication are pending**.

## Identity and artifact

- Package: `@papakpmartin/node-red-azure-iot-edge@1.0.0-rc.3`.
- Source packed: `65f4d55` on `master`.
- GitHub repository remains `papakpmartin/node-red-contrib-azure-iot-edge-kpm`.
- Tarball: `dist/papakpmartin-node-red-azure-iot-edge-1.0.0-rc.3.tgz`.
- SHA-256: `e7df9eee79790fef2f72a32621cdf35e6af980929991804c797cb7589cf8a4fd`.
- npm dry-run SHA-1: `cd70d336a590b7c293070b0a0be558426eb95468`.
- Sidecars: the tarball path plus `.sha256` and `.pack.json`. The latter records
  npm's actual scoped filename and package name/version, verified before use.
- 24 packed files, including all six source examples and updated onboarding/
  migration docs. No release tools, tests, internal todo, qualification reports,
  dependency directories, secrets, or nested tarballs.
- Public access is explicit in source and packed `publishConfig` and in workflow
  publication/dry-run commands. Prerelease selection remains `next`.

The old rc.2 tarball and sidecar were preserved. Its SHA-256 still matches
`d4c3f64ffc9789b3ec4cd029c7f69711b978812d48672c2b9f149755c8f928ef`.
This report is excluded from packaging to avoid a self-referential digest.

## Environment and preserved contracts

- Local: macOS ARM64, Node.js 22.16.0, npm 11.21.1.
- Repository runtime tests: Node-RED 4.1.16; packed/migration installs: 4.1.13 and
  4.1.16, each in disposable application directories with fake Azure clients.
- Support bounds unchanged: Node `>=22.16.0 <23`, Node-RED `>=4.1.13 <5`.
- Both runtime JS files, both editor HTML files and `lib/supervised-mqtt.js` were
  compared against starting commit `d16e3d1` and are byte-for-byte unchanged.
  Migration also compares them to the original rc.2 artifact.
- All dependency entries in `package-lock.json` were compared against `d16e3d1`
  and are unchanged. Only the root package name/version changed in the lockfile.
- All seven serialized node types, config references, message contracts, ports,
  authentication/lifecycle behavior and user method names are retained.

## Passing checks

1. `npm ci` passed from the committed lockfile. A first attempt hit a local
   macOS `.DS_Store` cleanup error; the otherwise-empty Finder metadata directory
   was preserved outside the workspace and the clean install then succeeded.
2. `npm run lint` passed for runtime/helper, tools/tests, editor scripts and every
   example Function body.
3. `npm test`: **38 passed, zero failed/skipped**. Includes scoped/unscoped npm
   artifact filename tests, wrong scope/name/version, unsafe filename, checksum,
   competing archive, root lock identity and public-access failure checks, plus
   all previous runtime/example regressions.
4. The **exact delivered tarball** passed `test:package` on Node-RED **4.1.13**
   and **4.1.16**. Each installed the scoped package fresh, discovered two node
   sets and all seven types, then deployed all six source examples separately.
   Tests exercise manual sends, twins, native/correlated method replies, scalar
   forwarding, and Catch/Status/Complete diagnostics.
5. The same tarball passed `test:migration` on **both patches**:
   - Start the original unscoped rc.2 artifact with its existing combined flow
     and an additional device-twin fixture. Manualize tutorial Inject timing once
     when constructing the baseline fixture; keep that snapshot thereafter.
   - Stop, replace the application dependency, update its lock with npm, and
     start the scoped package without rewriting the flow or registry cache.
   - Assert existing IDs, wires, config links, module/device twins and routed
     message handling; invoke the original **`setValue`** method, not `echo`.
   - Verify the absent package cannot resolve and is absent from the effective
     lockfile and Node-RED registry. Only one package owns the types at a time.
   - Stop, restore the old application manifest/lock and flow snapshot, run
     `npm ci`, and verify the original artifact operates again.
6. The Node-RED 4.1.16 run forced the clean-checkout baseline path: reconstruct
   rc.2 from `f62530dfe2bd1ed1a7b3557fa7a9ced353b0de87` and require the exact
   original tarball digest. The reconstructed artifact matched. CI uses full
   history and fails, rather than skips, when this baseline cannot be verified.
7. Production audit: repository **five moderate**, zero high/critical; both fresh
   consumer trees **six moderate**, zero high/critical. Full development audit:
   **nine moderate, 17 high, zero critical**. Existing Azure/Node-RED dependency
   risks remain documented and are not accepted automatically by this rename.
8. Source/tag/lock/packed identity, public-access and checksum/runtime checks
   passed for `v1.0.0-rc.3`. Public npm checks returned 404 for the new identity
   and version; this does not prove scope ownership.
9. A copied tarball plus both sidecars passed a simulated downloaded-artifact
   directory check. A corrupted transferred checksum was rejected.
10. `npm publish ./dist/...rc.3.tgz --dry-run --ignore-scripts --access public
    --tag next` passed and reported the correct scoped name and public access.
    npm warned that actual publication needs authentication. Nothing was published.
11. `actionlint@1.7.12` accepted both workflows with optional shellcheck/pyflakes
    disabled because those binaries were unavailable. Git diff whitespace checks
    also passed.

## Still requires owner action

- Replace the old dependency in the real application; do not install both names.
  Follow `release-validation.md` and preserve the actual old image/lock/config.
- Validate the scoped artifact/image on the real Linux ARM/Node 22.23.2 Edge
  deployment. No live Azure tests, real network/renewal fault injection, soak,
  canary or field rollback drill were performed during this local migration.
- Confirm npm scope ownership and decide the authorized first-publication/
  bootstrap path. New-package access and trusted publishers do not inherit from
  the old package. An interactive first rc.3 publish consumes that version;
  subsequent OIDC publication must use a new version, not republish rc.3.
- Configure the new package's publisher and protected `npm` GitHub environment
  when appropriate. Account access, first-publish 2FA, OIDC authorization and
  provenance are not proven by dry-run. No new workflow was executed on GitHub.
- Manually submit the scoped package to the Node-RED Flow Library after verified
  publication. Decide any old-package deprecation notice separately; retain old
  published versions for compatibility/rollback.
- Accept residual security risks explicitly before stable 1.0.0 promotion.

No push, tag, GitHub release, npm publication/staging/deprecation/unpublish,
Flow Library submission or account/security setting change was performed.
