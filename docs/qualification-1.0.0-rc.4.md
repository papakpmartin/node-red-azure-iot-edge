# Final-metadata rc.4 local qualification

Date: October 16, 2026. Result: **local qualification passed; nothing published**.

## Artifact

- Package: `@papakpmartin/node-red-azure-iot-edge@1.0.0-rc.4`.
- Source packed: `b29791d` on `master`.
- Canonical repository: `papakpmartin/node-red-azure-iot-edge`.
- Tarball: `dist/papakpmartin-node-red-azure-iot-edge-1.0.0-rc.4.tgz`.
- SHA-256: `b100278dec5b5c65f63976c5196d496c8ade2234115024c16aab90f8c02a0920`.
- SHA-1 from npm dry-run: `307af05d7ba77f30146d3bad636e5ebf1b0291ed`.
- `.sha256` and `.pack.json` sidecars are alongside the tarball. The artifact and
  sidecars are ignored build output, not committed binaries. This report is
  excluded from packaging to avoid a self-referential checksum.
- Packed manifest explicitly verified: correct scoped name/version,
  `publishConfig.access=public`, repository URL
  `git+https://github.com/papakpmartin/node-red-azure-iot-edge.git`, and author URL
  `https://github.com/papakpmartin/node-red-azure-iot-edge`.
- 24 packed files, including all six examples and current user documentation.
  Package-content checks exclude internal tools/tests/todo, qualification
  records, nested tarballs, and dependency directories.

rc.3 remains intact with SHA-256
`e7df9eee79790fef2f72a32621cdf35e6af980929991804c797cb7589cf8a4fd`.
Unscoped rc.2 remains intact with SHA-256
`d4c3f64ffc9789b3ec4cd029c7f69711b978812d48672c2b9f149755c8f928ef`.
All three checksum sidecars passed after rc.4 qualification.

## What changed and what did not

rc.4 is a separate publication candidate containing the final GitHub metadata
after the repository rename, plus updated candidate/version documentation. It is
not a relabeled or overwritten rc.3 artifact.

Both runtime JS files, both editor HTML files and `lib/supervised-mqtt.js` were
compared to the rc.3 source baseline (`65f4d55`) and are byte-for-byte unchanged.
Every resolved lockfile dependency entry was compared to `d3e4c96` and is
unchanged; the lockfile only changes the root package version to rc.4. All seven
node types, `client` references, ports, method names, message contracts, support
bounds and runtime policies are preserved.

## Passing checks

Local environment: macOS ARM64, Node.js **22.16.0**, npm **11.21.1**. Runtime
tests use Node-RED 4.1.16; fresh consumer/migration checks cover both patches below.

1. Clean `npm ci`, `npm run lint`, and `npm test`: **38 passed, zero failed/skipped**.
2. The exact rc.4 tarball passed fresh `test:package` installs on Node-RED
   **4.1.13** and **4.1.16**. All six examples were deployed independently;
   discovery, node construction, message/twin/method behavior, scalar forwarding,
   and Catch/Status/Complete diagnostics passed using fake Azure clients.
3. The exact tarball passed `test:migration` on **both patches**: original rc.2 →
   scoped rc.4 → original rc.2. Existing flow IDs, wiring, config links, twins,
   routed messaging and the original `setValue` method were preserved, with only
   one installed package owning the types and no registry-cache edits.
4. The 4.1.16 migration forced reconstruction of the original rc.2 fixture from
   its pinned historical commit and verified its exact recorded artifact digest.
5. Production audit: repository **five moderate**, zero high/critical. Each fresh
   consumer tree: **six moderate**, zero high/critical. Clean install reported
   the unchanged full development findings: **nine moderate, 17 high, zero
   critical**. These risks remain documented, not implicitly accepted for stable
   release or fixed by this metadata update.
6. Source/tag/lock/packed identity, public access, checksum and runtime checks
   passed with expected tag `v1.0.0-rc.4`. Registry availability check returned
   404 for rc.4; this is not proof of scope ownership. No Git tag was created.
7. Exact-tarball `npm publish --dry-run --ignore-scripts --access public --tag next`
   passed and reported the correct scoped name/version, public access and `next`.
   npm warned that actual publication requires authentication.
8. `actionlint@1.7.12` accepted both workflows with unavailable optional
   shellcheck/pyflakes integrations disabled. Git diff whitespace checks passed.

## Remaining owner actions

- Check the new artifact/image on the actual Linux ARM/Node 22.23.2 deployment.
  No live Azure/Edge tests, renewal/network fault injection, new soak/canary, or
  field rollback drill were performed here. Existing rc.2/rc.3 field results
  remain relevant to the unchanged runtime but do not prove registry delivery.
- Confirm npm scope ownership and explicitly authorize the first publication.
  The release guide describes interactive prerelease bootstrap under `next`,
  followed by trusted-publisher setup on the new scoped package. A manually
  published rc.4 cannot then be republished through the GitHub workflow; use a
  subsequent version for that workflow.
- Verify the registry artifact after real publication. Configure the publisher
  against repository `node-red-azure-iot-edge`, workflow `npmpublish.yml` and
  environment `npm`, keeping approval protections. Dry-run does not prove login,
  2FA, OIDC access or provenance; no new workflow was run on GitHub.
- Complete field acceptance and explicit residual-risk approval before preparing
  stable 1.0.0. Submit the scoped identity to the Node-RED Flow Library only after
  publication is verified; decide old-package deprecation separately.

No push, Git tag, GitHub release, npm publication/staging/deprecation, Flow Library
submission or account/security setting change was performed in this step.
