Title: ssg: add resolveWeak polyfill and improve server bundle evaluation

Summary
-------
This patchset proposes the following minimal changes to make SSG evaluation
more robust when server bundles rely on webpack-specific APIs (e.g.
`require.resolveWeak`) or import CSS during SSR evaluation:

1. In `ssgNodeRequire.createSSGRequire` wrap the created `require` function,
   provide an implementation for `resolveWeak`, and guard stylesheet requires.
2. In `ssgRenderer.loadAppRenderer` prefer requiring the server bundle using
   the SSG 'require' (with better resolution) and fall back to eval(). Also
   strip CSS imports from the bundle source before evaluating in the VM as
   a safety guard for Node's ESM/CSS loader errors.

Rationale
---------
Server bundles produced by webpack/Docusaurus can embed calls such as
`require.resolveWeak(...)` and may import CSS. In Node's SSG environment these
APIs are not always defined, and CSS imports cause the ESM/CJS loader to
throw. Providing a safe `resolveWeak` and ignoring CSS imports during the
evaluation will prevent immediate runtime crashes and allow SSG to proceed to
the next resolution issues (e.g., proper resolution of `@theme/*` virtual
modules). This change is intentionally a small, backward-compatible,
best-effort fix to stabilize SSG while a deeper resolution mechanism is
designed.

Files changed locally for repro/testing
-------------------------------------
- `@docusaurus/core/lib/ssg/ssgNodeRequire.js` - add wrapper require + resolveWeak + css stub behavior
- `@docusaurus/core/lib/ssg/ssgRenderer.js` - CSS import stripping + prefer using the wrapped require

Notes
-----
- These are local, experimental changes used to reproduce and test the problem.
- A clean PR should implement unit tests and edge-case handling before merging.
- The attached `repro/` directory contains `run_repro.cjs` and `repro_output.txt`
  which reproduce and record the failure logs to attach to an upstream issue.
