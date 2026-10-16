# rc.4 npm publication and registry verification

Date: October 16, 2026. **Publication and registry installation verified.**

The owner completed the interactive npm publish/2FA step as `papakpmartin` after
the agent's non-interactive attempt was rejected for requiring 2FA. npm initially
exposed a `0.0.0-stage` placeholder while processing the publication. rc.4 became
publicly available with registry timestamp `2026-10-16T18:36:20.044Z`.

## Verified distribution

- Package: `@papakpmartin/node-red-azure-iot-edge@1.0.0-rc.4`.
- Registry maintainer: `papakpmartin`.
- npm page: https://www.npmjs.com/package/@papakpmartin/node-red-azure-iot-edge/v/1.0.0-rc.4
- Repository metadata points to `papakpmartin/node-red-azure-iot-edge`; public
  access and the scoped package/version were verified.
- Downloaded the registry tarball and compared its bytes directly with the
  original qualified local artifact. They are identical.
- SHA-256: `b100278dec5b5c65f63976c5196d496c8ade2234115024c16aab90f8c02a0920`.
- Registry SHA-1: `307af05d7ba77f30146d3bad636e5ebf1b0291ed`.
- Registry SHA-512 integrity also matches the qualified artifact. The clean
  registry installation's lockfile records that same integrity value.

At verification, **both `next` and `latest` point to `1.0.0-rc.4`**. Thus an
unversioned install currently selects a prerelease, not stable 1.0.0. No dist-tag
was changed by the agent. Use the exact rc.4 version for reproducible testing;
stable 1.0.0 is still unpublished. Any tag cleanup is a separate owner decision.

## Registry-name installation test

Created a disposable application using the registry version string `1.0.0-rc.4`,
not a `file:` dependency, and Node-RED 4.1.13. Installed using Node 22.16.0 and
npm 11.21.1 with dependency lifecycle scripts disabled. Confirmed the old
unscoped package is absent from the effective lockfile.

All six published examples passed discovery, flow behavior and diagnostics
checks against real Node-RED with fake Azure clients. The consumer production
audit reports six moderate affected-package entries, zero high and zero critical,
matching the previously documented residual dependency risk.

Temporary installation files were removed. The local qualified tarball was not
rebuilt or overwritten. This record is excluded from npm packaging. The earlier
`qualification-1.0.0-rc.4.md` accurately records the pre-publication stage and is
preserved unchanged.

## Remaining release work

- Configure trusted publishing on this new scoped package, using repository
  `node-red-azure-iot-edge`, workflow `npmpublish.yml`, environment `npm` and direct
  publish permission. The old package's configuration does not transfer.
- Create the trusted publisher when ready for its first successful GitHub publish
  within npm's validation window. Local publication did not prove OIDC access or
  create GitHub provenance; registry signatures are not GitHub build provenance.
- Do not republish rc.4. Future GitHub publication must use a new version such as
  the planned 1.0.0 after field acceptance and explicit security-risk approval.
- Push/tag/GitHub release, account settings, Flow Library submission and any
  old-package deprecation remain separately authorized maintainer actions.

No new live Azure/Edge, Linux ARM, fault-injection, soak, or field rollback tests
were performed by registry verification. No Git push/tag/release, account setting
change or dist-tag modification was performed by the agent.
