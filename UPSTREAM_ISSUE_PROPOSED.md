Title: SSG: require.resolveWeak missing and CSS imports break server bundle evaluation

Problem summary
---------------
When building a Docusaurus site with SSG, the server bundle (build/__server/server.bundle.js)
may fail at evaluation time due to the runtime expecting webpack APIs such as
`require.resolveWeak`, or because the bundle contains CSS imports (e.g.
`infima/dist/css/default/default.css`) which the Node loader can't parse during
SSG VM evaluation. The observed errors include:

- `TypeError: require.resolveWeak is not a function`
- `SyntaxError: Unexpected token ':'` when parsing CSS imports
- `MODULE_NOT_FOUND` for virtual modules like `@theme/*` or `@site/*` after the above
  errors are patched out.

Reproduction
------------
I created a minimal reproduction harness in this repo under `repro/`.

Steps to reproduce locally:

1. Clone this repo.
2. Run: `node -r ./scripts/resolveWeakShim.cjs ./node_modules/.bin/docusaurus build`
3. Observe SSG failing with `require.resolveWeak` TypeError.
4. There is also `repro/run_repro.cjs` which loads build/__server/server.bundle.js
   into a VM and demonstrates the same sequence of errors.

Diagnostics & logs
------------------
See `repro/repro_output.txt` for full traces. Key observations:

- The server bundle expects `require.resolveWeak` in the runtime (used by `eval` package)
- CSS imports in the bundle cause the VM/Node to throw during eval
- After patching out CSS imports, virtual modules like `@theme/*` still may not resolve

Suggested fixes
---------------
Short-term (minimal, safe)

- In `createSSGRequire()`, wrap the created `require` so it provides `resolveWeak` as a
  no-op or best-effort implementation (e.g., call `require.resolve` where possible).
- When evaluating server bundle source in the SSG VM, strip CSS imports from the
  source as a temporary mitigation to avoid syntax errors.

Long-term (recommended)

- Ensure server bundle emitted for SSG is executable in Node without relying on
  webpack runtime-specific APIs (or provide a deterministic runtime shim for them).
- Provide a robust resolution strategy for virtual modules (e.g., `@theme/*`, `@site/*`)
  when evaluating the server bundle in a Node VM — either by emitting server bundles
  with resolved virtual modules, or by exposing a module map that the SSG runtime
  can consult.

Proposed PR
-----------
I've prepared a small patchset used locally (documented in `patches/0001-ssg-resolveweak-and-css-fix.md`)
which demonstrates the minimal changes described in "Short-term". I can open a PR with tests
if maintainers are open to the approach.

Environment
-----------
- Docusaurus v3.9.2
- Node v24.10.0 (also reproduces on Node 22)

Attachments
-----------
- `repro/` directory: `run_repro.cjs`, `repro_output.txt`, `README.md`
- `patches/0001-ssg-resolveweak-and-css-fix.md` — a description of local changes used for testing

Happy to provide a small PR and expand the repro if helpful.
