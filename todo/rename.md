# Execution prompt: migrate to a scoped npm package

Prepared October 16, 2026.

Target package: **`@papakpmartin/node-red-azure-iot-edge`**

This file is a future implementation prompt and checklist, not a record that the
rename has happened. Writing this prompt does not authorize publishing or account
changes. When explicitly asked to execute it, follow the instructions below.

## How to use this prompt

Start a coding-agent session in this repository with file editing enabled, and
give it this instruction:

> Execute `todo/rename.md`. Implement and locally qualify the scoped-package
> migration on `master`, using separate commits for coherent fixes/actions.
> Preserve the existing runtime behavior and known-good rc.2 artifact. Deliver a
> scoped rc.3 tarball and migration instructions. Do not push, tag, create releases,
> publish/deprecate packages, or change npm/GitHub account settings without my
> separate explicit authorization.

The agent should read applicable `AGENTS.md` instructions and inspect current
repository state first. If the session is in Plan mode, discuss the work but do
not implement until the user switches to an editing agent.

---

## Task for the implementing agent

Rename the npm distribution from:

```text
node-red-contrib-azure-iot-edge-kpm
```

to:

```text
@papakpmartin/node-red-azure-iot-edge
```

Prepare **`1.0.0-rc.3`** under the new identity, preserving runtime/editor node
types and flow contracts. Make packaging, CI, tests, documentation, and local
upgrade/rollback work with the scoped name. Build and qualify the exact tarball
the owner can test using the existing file-dependency deployment procedure.

This is a packaging/distribution migration, not another runtime modernization.

## 1. Context and invariants

Recheck these facts against the current checkout rather than treating this file
as a substitute for inspection:

- The source package is currently `1.0.0-rc.2` under the old unscoped name.
- The GitHub repository remains
  `papakpmartin/node-red-contrib-azure-iot-edge-kpm`. **Do not rename the GitHub
  repository, move the checkout, or change its remote.** npm scope and GitHub
  repository name are independent.
- Keep working on **`master`**. Inspect `git status` and existing commits first;
  preserve any user work and do not reset, discard, or amend unrelated changes.
- The owner reports successful rc.2 field testing. The reported deployment is
  Node-RED **4.1.13**, Node.js **22.23.2**, on Linux ARM (`v7l+`, little-endian).
- Preserve support declarations: Node `>=22.16.0 <23`, Node-RED `>=4.1.13 <5`.
  The rc.1 minimum of 4.1.14 caused a real missing-node failure. Do not repeat that
  mistake by deriving the minimum solely from a newer development dependency.
- Preserve the exact direct Azure dependencies (`azure-iot-device@1.18.4` and
  `azure-iot-device-mqtt@1.16.4`), Node-RED test dependency `4.1.16`, and current
  npm toolchain pin (`11.21.1`) unless an independently explained blocker requires
  a decision. Do not run broad dependency upgrades during this rename.
- Preserve both Node-RED entry points, exactly once each, and their paired HTML:
  `azure-iot-edge-module-client.js` and `azure-iot-edge-device-client.js`.
- **Do not change any serialized node types:**

  ```text
  moduleclient
  moduleinput
  moduleoutput
  moduletwin
  modulemethod
  device-client
  device-twin
  ```

- Preserve `client` references, node IDs, wires, ports, palette category, method
  correlation/encoding, JSON behavior, authentication precedence, retry/shutdown
  policy, certificate handling, and admission limits. Do not rename runtime files
  or introduce aliases for node types.
- Keep `lib/supervised-mqtt.js` and both runtime/editor pairs byte-for-byte
  unchanged unless the owner separately authorizes a proven functional fix.
- Keep MIT licensing and original copyright attribution.
- New onboarding documentation and six example flows exist in source and have
  been tested; they are newer than the already-built rc.2 tarball. Include them
  in the new candidate without altering existing deployed flows.
- At prompt preparation, `npm test` had 35 passing tests. All six packed examples
  passed on Node-RED 4.1.13 and 4.1.16 with fake Azure clients. Rerun; do not merely
  copy those results into a new qualification record.

### Artifact preservation

The local rollback artifact is:

```text
dist/node-red-contrib-azure-iot-edge-kpm-1.0.0-rc.2.tgz
```

Its recorded SHA-256 is:

```text
d4c3f64ffc9789b3ec4cd029c7f69711b978812d48672c2b9f149755c8f928ef
```

Verify it if present. Preserve it and its checksum sidecar; do not overwrite,
delete, or silently rebuild it under the same name. Historical rc.1 artifacts
and qualification records should also remain intact. If the baseline artifact
is absent, report that and obtain a suitable migration fixture rather than
claiming a field-artifact upgrade was tested.

## 2. Preflight: naming and external ownership

1. Read the current Node-RED packaging and npm scoped-public-package guidance:
   - https://nodered.org/docs/creating-nodes/packaging
   - https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/
   - https://docs.npmjs.com/trusted-publishers/
2. Read-only check availability of the target package and candidate version.
   A public registry 404 is not proof the owner controls the scope; confirm the
   owner has the appropriate npm account/organization access before publication.
3. Treat npm scope ownership separately from the matching GitHub username.
4. If the target identity or rc.3 already exists incompatibly, stop for a naming/
   version decision. Do not republish or silently select a different name/version.
5. Inspect existing solutions/tooling before adding dependencies. npm's own
   `pack --json`, the existing archive reader, and current scripts should suffice;
   do not introduce a new release framework or an umbrella package.

## 3. Make release tooling scope-aware

Inspect at least:

- `scripts/pack-release.js`
- `scripts/release-check.js`
- `scripts/package-archive.js`
- `.github/workflows/npmpublish.yml`
- `test/release-check.test.js`
- `test/package-smoke.js`
- `test/fixtures/packed-discovery.js`
- `test/package-structure.test.js`

### Known filename trap

`pack-release.js` already uses npm's returned `filename`. However,
`release-check.js` currently constructs `${manifest.name}-${manifest.version}.tgz`,
and the publish workflow has a similar interpolation for the package test path.
Those assumptions break for a name containing `@` and `/`.

npm is expected to produce:

```text
papakpmartin-node-red-azure-iot-edge-1.0.0-rc.3.tgz
```

Use npm's actual `pack --json` result as the authoritative artifact filename.
Make that filename available consistently to verification, checksums, package
tests, artifact transfer, and publication. Validate filename safety and packed
identity; do not blindly trust an arbitrary metadata file or weaken checks.
Prefer a small extension of the existing scripts over a new abstraction layer.

Required behavior:

- Source name/version, lockfile identity, packed manifest, and release tag agree.
- The tag remains `v1.0.0-rc.3`; the npm scope is not part of the Git tag.
- Validate that both root and package-entry lockfile identities are consistent.
- Verify exact SHA-256 and runtime/editor/helper contents against the checkout.
- Check a fresh CI output directory contains exactly one intended release tarball.
- Preserve explicit-archive checking for local directories containing historical
  candidates; do not delete old candidates merely to make a check pass.
- Keep registry availability checks fail-closed: only a confirmed missing version
  permits publication, not a timeout, authentication failure, or HTTP 5xx.
- Keep prereleases under `next`, stable releases under `latest`, with release
  prerelease-flag validation and existing approval/OIDC safeguards.
- Publish the tested/downloaded tarball, never a replacement rebuild in the
  publish job.
- Add explicit public access for the scoped distribution, preferably
  `"publishConfig": { "access": "public" }`, and ensure the workflow/dry-run
  honors it. Public scoped packages do not require a paid private-package plan.
- Preserve an unambiguous local path such as `./dist/<filename>.tgz` when calling
  `npm publish`. Without `./`, npm can interpret `dist/name.tgz` as GitHub shorthand.
- Keep `workflow_dispatch` qualification-only. It must not publish a package.

Add automated regression coverage for scoped and unscoped artifact handling,
wrong names/versions/tags, wrong scope, checksum mismatch, multiple archives,
and registry failure/existing-version cases. Do not remove assertions simply
because they currently hardcode the old name.

## 4. Change the package identity and candidate version

1. Set `package.json` name to `@papakpmartin/node-red-azure-iot-edge` and version
   to `1.0.0-rc.3`.
2. Regenerate/update the root lockfile identity using the pinned toolchain,
   without changing the resolved dependency tree unnecessarily. Review the diff.
3. Keep `repository.url` pointing to the existing GitHub repository. Keep valid
   author/license metadata and the `node-red` keyword/manifest entries.
4. Replace active hardcoded npm identity references in tests and fixtures. The
   packed-discovery fixture currently requires examples and filters the registry
   by the old name. Derive the installed identity from a verified manifest or
   explicitly passed expected name, not from an unrelated repository slug.
5. Verify installation into the scoped path under
   `node_modules/@papakpmartin/node-red-azure-iot-edge` and normal Node-RED discovery.
6. Do not globally replace historical names. Existing GitHub links, older version
   release notes, qualification reports, rollback artifact names, and migration
   fixtures may correctly retain the old name.
7. Keep runtime JS, helper, editor files, and dependency resolutions unchanged;
   record a comparison against the starting baseline.

## 5. Prove upgrade and rollback, not just fresh installation

A scoped name is a new npm package, not an in-place registry rename. Existing
applications must replace the dependency. Installing both packages together
would register the same node types twice.

Add an isolated migration integration test covering:

1. An application/user directory containing the original unscoped rc.2 artifact
   and a representative existing flow with module config/child references.
2. Capture a sanitized flow snapshot and resolved application dependencies.
   Do not connect to real Azure or use production credentials in this test.
3. Stop that runtime. Remove/replace the old dependency in the application's
   package manifest and update its lockfile with npm; do not hand-edit Node-RED's
   private registry cache or require users to recreate their flows.
4. Install the scoped tarball with only one package owning the seven types.
5. Start real Node-RED and assert the unchanged flow is discovered/constructed,
   with the same node IDs, `client` links, wires, and relevant configuration values.
6. Assert no missing types or duplicate registration errors and no old package
   left in the effective installed production tree. Exercise messaging/twin/method
   behavior with deterministic SDK fakes.
7. Stop the runtime and restore the old manifest/lock plus baseline tarball and
   flow snapshot, then verify rollback. Keep generated fixtures disposable.

Use the old artifact's actual example/flow contract when testing its baseline;
the old combined example may use `setValue`, whereas newer source examples use
`echo`. Do not change a method name in an existing flow to make a migration test
pass. Runtime method names are user configuration, not npm identity.

Also retain fresh-install tests for all six current source examples on Node-RED
4.1.13 and 4.1.16, including scalar JSON forwarding, correlated native method
responses, and Catch/Status/Complete diagnostics. Preserve checks for exactly
one manifest entry per JS/HTML pair and secret-free package contents.

Do not add npm aliases, forwarding/compatibility packages, duplicate runtime
owners, monorepo restructuring, or a package split for this task.

## 6. Documentation and owner handoff

Update active usage documentation, including README, release validation,
changelog, dependency-risk candidate identity, and relevant follow-up notes:

- Clearly distinguish npm identity from the unchanged GitHub repository name.
- Preserve the improved brief introduction, quick start, and subordinate history.
- Update installation commands, the Import → Examples package name, candidate
  tarball paths, public-publishing instructions, and release-check examples.
- Show this application dependency fragment:

  ```json
  {
    "dependencies": {
      "@papakpmartin/node-red-azure-iot-edge": "file:packages/papakpmartin-node-red-azure-iot-edge-1.0.0-rc.3.tgz"
    }
  }
  ```

- Explicitly remove the old `node-red-contrib-azure-iot-edge-kpm` dependency;
  adding the new line while leaving the old one installed is not migration.
- Explain conventional user-directory migration versus immutable container
  rebuilds. In Node-RED Projects, include the project's dependency metadata in
  the upgrade procedure. Preserve credentials and configuration snapshots.
- State that existing flow types/references/wires should not need edits and that
  a full runtime/container restart is required after replacement.
- Include rollback to the known-good old artifact/image plus its matching app
  manifest, lockfile, and flow/config snapshot. Do not compare both identities
  concurrently under the same cloud identity.
- Document that published versions/download history/settings do not transfer to
  a new package name. Existing old-name installations will not auto-upgrade to
  the scoped package through an ordinary npm update.
- Keep old published versions available. Recommend any eventual old-package
  deprecation/migration notice only after the scoped release is verified; do not
  execute deprecation or unpublish commands as part of this task.
- Explain manual submission of the new package to the Node-RED Flow Library;
  the `node-red` keyword alone is not an automatic library submission.

### npm/GitHub administrative handoff — do not execute automatically

The new package needs its own access/trusted-publisher setup; the old package's
publisher configuration does not transfer merely because the repository matches.

Describe the current supported first-publication/bootstrap choices and identify
which steps need owner action. A first interactive, authorized prerelease publish
or an approved staging/bootstrap flow may be needed before package settings can
be configured. Do not create a placeholder package, store a token, or publish
anything just to establish those settings without authorization.

For the new package's eventual GitHub trusted publisher, the intended fields are:

| Field | Value |
| --- | --- |
| Organization/user | `papakpmartin` |
| Repository | `node-red-contrib-azure-iot-edge-kpm` |
| Workflow filename | `npmpublish.yml` |
| Environment | `npm` |
| Allowed action | Direct `npm publish`, matching the existing workflow |

Recheck npm's current bootstrap/expiry rules at execution time. A newly created
trusted publisher currently needs a successful first publish within two days.
Dry-runs do not prove OIDC authorization or activate that publisher. Do not use
`npm whoami` as an OIDC-permission test. Keep environment review/tag protections
and provenance; do not weaken them to get a first publish through.

## 7. Local validation and deliverables

Use Node 22 and npm 11.21.1. Run the existing gates and new migration tests:

```sh
npm ci
npm run lint
npm test
npm audit --omit=dev --audit-level=high
RELEASE_TAG=v1.0.0-rc.3 CHECK_NPM_VERSION=1 npm run release:check
npm run pack:release
```

Use the filename actually reported by packing for the remaining commands. For
the expected filename, the local qualification commands are:

```sh
RELEASE_TAG=v1.0.0-rc.3 RELEASE_PRERELEASE=true npm run release:check -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0-rc.3.tgz
NODE_RED_TEST_VERSION=4.1.13 npm run test:package -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0-rc.3.tgz
NODE_RED_TEST_VERSION=4.1.16 npm run test:package -- dist/papakpmartin-node-red-azure-iot-edge-1.0.0-rc.3.tgz
npm publish ./dist/papakpmartin-node-red-azure-iot-edge-1.0.0-rc.3.tgz --dry-run --ignore-scripts --access public --tag next
```

The last command **must retain `--dry-run`**. It does not grant publication
authorization. Adjust documented commands if the existing script interface is
deliberately improved, while retaining their guarantees.

Other required checks/deliverables:

- [ ] The new candidate has the correct scoped name/version and public access.
- [ ] Runtime/editor/helper bytes and resolved dependency versions are unchanged.
- [ ] Both fresh scoped installs and old-to-new upgrade/rollback pass.
- [ ] All seven types and six source examples work under both qualified Node-RED patches.
- [ ] No test is skipped merely to accommodate the rename.
- [ ] Tag, manifest, lockfile, archive identity, safe filename, and checksum checks pass.
- [ ] Current production audit and fresh-consumer audit results are recorded.
- [ ] Existing residual security risks are not silently accepted or "fixed" by
      downgrading Azure or forcing transitive major overrides. If new blockers
      appear, report them and ask for scope/risk decisions.
- [ ] Package contains runtime/editor/helper files, icons, current examples,
      license and user docs, but no secrets, tests, internal todo, release tools,
      nested tarballs, or qualification records.
- [ ] Workflows pass available validation, preferably actionlint; GitHub-hosted
      execution is explicitly marked untested if not actually run.
- [ ] Deliver a new `.tgz` and SHA-256 sidecar without altering old candidates.
- [ ] Add an accurately dated `docs/qualification-1.0.0-rc.3.md`, excluded from
      packaging, recording source commit, artifact digest, exact local versions,
      commands/results, migration evidence, audit findings, and remaining gates.

Do not claim a new local tarball is the same artifact as rc.2. Preserve field
runtime evidence but qualify the new identity/installation separately. Mocked
Azure tests and macOS runs do not establish Linux ARM, live Edge authentication,
soak/canary, OIDC publication, or rollback in the actual deployment.

## 8. Commit and communication requirements

- Make separate, coherent commits per fix/action, keeping each reasonably
  testable. Suggested boundaries: scope-aware release tooling/tests; package
  identity and migration support/docs; final artifact qualification record.
  Supporting tests can accompany the fix they protect.
- Do not commit tarballs, generated dependencies, credentials, or temporary
  installations. Do not rewrite historical qualification evidence.
- Send concise progress updates for material discoveries, blockers, and test
  outcomes. Stop for a decision if a runtime change, dependency change, new
  external service, or different naming/version choice becomes necessary.
- Do not push, create/move Git tags, publish GitHub releases, publish/stage/
  deprecate/unpublish npm packages, submit the Flow Library entry, or change
  account/security settings without separate explicit approval.

Finish with the actual outcome: new name/version, tarball and checksum paths,
commit list, migration steps the owner must perform, passing/untested gates,
and remaining npm/bootstrap/field-acceptance actions. State clearly that nothing
was published if only local qualification and dry-runs were performed.
