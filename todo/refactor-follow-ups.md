# Release Follow-ups

The 1.0.0-rc.1 work addresses the previously listed startup-close, passive twin
retry, response-admission, output-status, package discovery, and editor help gaps.
It also contains authentication-provider errors missed by the installed SDK.
Source/tarball Node-RED entry-point duplication checks remain in place.

## 1.0.0 Release Approval and Remaining Operations

The owner explicitly approved and authorized 1.0.0 publication on October 16,
2026, accepting the documented dependency risks and current field validation as
the release gate, with unfinished formal checks deferred. These decisions do not
represent newly executed field tests. Runtime/editor/dependency changes are not
part of stable promotion.

- The owner renamed GitHub to `papakpmartin/node-red-azure-iot-edge`. Canonical
  source URLs and npm publisher instructions are updated. rc.4 packages the final
  metadata separately; rc.3 and its historical qualification record stay unchanged.
  See `docs/qualification-1.0.0-rc.4.md` for local results and the exact digest.
- Continue validation of the scoped release and dependency migration in real deployments, including workload
  failure at renewal, X.509 twins, network/Edge Hub recovery, and redeploys.
- Record 72-hour soak and seven-day canary results or an explicit alternate gate.
- Rehearse rollback to the known-good unscoped rc.2 artifact/image and matching
  application manifest, lockfile, and flow/config backup. Do not install both names.
- Risk acceptance for 1.0.0 is recorded in `docs/dependency-risk.md`; reassess
  at each later release and on new advisories/upstream fixes.
- The owner completed the rc.4 npm bootstrap publish; its registry tarball and
  registry-name install are verified in `docs/qualification-1.0.0-rc.4-registry.md`.
  The owner reports the new package's trusted publisher is configured. Validate
  it through the approved stable workflow, preserving protected `npm` approval.
  Local prerelease publication does not prove OIDC permissions.
- Stable publication should move `latest` to 1.0.0 and leave `next` unchanged.
- Run the GitHub manual qualification workflow against a deliberately created
  release tag before publication. The owner authorized pushing master, creating
  v1.0.0, and publishing its stable GitHub release, conditional on passing gates.
- After a verified scoped publication, manually submit the new identity to the
  Node-RED Flow Library. Decide on an old-package deprecation notice separately;
  do not unpublish old versions or create a duplicate-registering wrapper.

## Follow-on Qualification

- Keep the field-used Node-RED 4.1.13 patch in the packed-install matrix. rc.1
  excluded it through an unnecessarily raised minimum; rc.2 fixes that gate.
- Node 24 before Node 22 support ends April 30, 2027; Node-RED 5 separately.
- IoT Edge 1.6 on deployed platforms; Edge 1.5 support ends November 10, 2026.
- Upstream Azure SDK renewal-error and dependency fixes; remove local transport
  supervision only after equivalent regression tests pass with a fixed SDK.
- Operational queue diagnostics and byte/age admission limits as field needs
  justify them. Package splitting and new authentication modes remain optional.
