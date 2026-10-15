# 1.0.0-rc.2 compatibility qualification

Date: October 15, 2026. Source packed: `f62530d` on `master`.

## Confirmed field failure and correction

The deployment logs report Node-RED 4.1.13, Node.js 22.23.2, Linux ARM
(`5.10.103-v7l+`, little-endian). Node-RED explicitly skipped rc.1 because its
manifest required `>=4.1.14 <5`, then reported missing module node types. This
was a package version gate, not evidence of an Azure authentication failure.

rc.2 lowers the Node-RED requirement to `>=4.1.13 <5` and includes 4.1.13 in the
packed-install CI matrix. Raising the minimum to the newer test-dependency patch
without first inventorying the field runtime unnecessarily blocked a working
deployment. Future minimum changes must account for actual field versions.

## Artifact and passing local checks

- Tarball: `dist/node-red-contrib-azure-iot-edge-kpm-1.0.0-rc.2.tgz`.
- SHA-256: `d4c3f64ffc9789b3ec4cd029c7f69711b978812d48672c2b9f149755c8f928ef`.
- SHA-1 from npm dry-run: `7e90960318f687da32b7fb42b94fbad659ba3af9`.
- Local environment: macOS ARM64, Node 22.16.0, npm 11.21.1.
- All 26 automated tests and JavaScript syntax checks passed.
- The exact rc.2 tarball was installed into fresh isolated user directories with
  Node-RED **4.1.13** and **4.1.16**. Both discovered two node sets, registered
  and constructed all seven types, and completed the bundled method example.
- Both fresh-consumer production audits reported six moderate affected-package
  entries, zero high and zero critical; existing risk acceptance is still needed.
- Release identity/checksum/runtime checks passed using the exact archive path.
  Both rc.1 and rc.2 are preserved in local `dist/`, so directory-wide single-
  artifact checks are intentionally not used for this local comparison.
- npm publication dry-run passed with `--tag next`. Nothing was published.
- Runtime JS, helper, and editor files in rc.2 were compared byte-for-byte with
  the original rc.1 artifact and are identical. Direct dependencies are unchanged;
  the lockfile changes only the package's own version.

This report is excluded from the tarball. rc.1's qualification report remains
historical; the installed rc.2 artifact still needs field acceptance on the
actual Linux ARM/Node 22.23.2 deployment. No live Azure tests, push, tag, GitHub
release, or npm publication were performed during this correction. Follow
`release-validation.md` with the rc.2 tarball; existing flows need no edits.
