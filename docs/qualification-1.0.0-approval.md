# 1.0.0 owner release approval

Date: October 16, 2026. Owner: Ken Martin (`papakpmartin`).

Before preparing/publishing immutable stable 1.0.0, the owner was asked whether
he approved:

1. Current field testing as the release gate, explicitly deferring unfinished
   documented live/fault/soak/canary/rollback checks.
2. Documented residual dependency risks: five moderate production findings;
   development tree: nine moderate and 17 high, with no critical findings.
3. Pushing `master`, creating `v1.0.0`, and publishing a stable GitHub release
   that publishes to npm under `latest`, conditional on release checks/CI passing.

The owner explicitly selected **Approve and publish**.

This approval does not assert that every recommended field test was run, approve
newly discovered findings, permit runtime/dependency changes, bypass test/CI
failures or environment approval, or authorize a local-token fallback for failed
OIDC. Existing Node 22 / Node-RED 4 support bounds remain unchanged.

At approval the working tree was clean, local master was 13 commits ahead of
GitHub, the latest remote CI covered an older unscoped commit, and npm 1.0.0 /
Git tag v1.0.0 did not yet exist. The stable runtime/editor/helper and resolved
dependencies are to remain identical to the verified rc.4 distribution. Stable
artifact and CI/registry verification results are recorded separately.
