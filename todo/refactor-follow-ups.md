# Release Follow-ups

The 1.0.0-rc.1 work addresses the previously listed startup-close, passive twin
retry, response-admission, output-status, package discovery, and editor help gaps.
It also contains authentication-provider errors missed by the installed SDK.
Source/tarball Node-RED entry-point duplication checks remain in place.

## Still Required Before Stable Release

- Validate the exact rc.1 artifact in the real deployment, including workload
  failure at renewal, X.509 twins, network/Edge Hub recovery, and redeploys.
- Record 72-hour soak and seven-day canary results or an explicit alternate gate.
- Rehearse rollback with the beta.3 artifact/image and matching flow/config backup.
- Explicitly accept residual dependency risks in `docs/dependency-risk.md`.
- Configure npm trusted publishing and the protected GitHub `npm` environment;
  a dry-run does not prove real OIDC permissions.
- Run the GitHub manual qualification workflow against a deliberately created
  release tag before authorizing publication. No tag/release/push is implicit in
  local qualification.

## Follow-on Qualification

- Node 24 before Node 22 support ends April 30, 2027; Node-RED 5 separately.
- IoT Edge 1.6 on deployed platforms; Edge 1.5 support ends November 10, 2026.
- Upstream Azure SDK renewal-error and dependency fixes; remove local transport
  supervision only after equivalent regression tests pass with a fixed SDK.
- Operational queue diagnostics and byte/age admission limits as field needs
  justify them. Package splitting and new authentication modes remain optional.
