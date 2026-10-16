# Release Follow-ups

The 1.0.0-rc.1 work addresses the previously listed startup-close, passive twin
retry, response-admission, output-status, package discovery, and editor help gaps.
It also contains authentication-provider errors missed by the installed SDK.
Source/tarball Node-RED entry-point duplication checks remain in place.

## Still Required Before Stable Release

- The owner renamed GitHub to `papakpmartin/node-red-azure-iot-edge`. Canonical
  source URLs and npm publisher instructions are updated. rc.4 packages the final
  metadata separately; rc.3 and its historical qualification record stay unchanged.
- Validate the exact scoped rc.4 artifact and dependency migration in the real deployment, including workload
  failure at renewal, X.509 twins, network/Edge Hub recovery, and redeploys.
- Record 72-hour soak and seven-day canary results or an explicit alternate gate.
- Rehearse rollback to the known-good unscoped rc.2 artifact/image and matching
  application manifest, lockfile, and flow/config backup. Do not install both names.
- Explicitly accept residual dependency risks in `docs/dependency-risk.md`.
- Confirm ownership of the npm `papakpmartin` scope, handle first-publication
  bootstrap if necessary, and configure the new package's trusted publisher plus
  the protected GitHub `npm` environment;
  a dry-run does not prove real OIDC permissions.
- Run the GitHub manual qualification workflow against a deliberately created
  release tag before authorizing publication. No tag/release/push is implicit in
  local qualification.
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
