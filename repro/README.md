Reproducing the Docusaurus SSG issue
===================================

Purpose
-------
This directory contains scripts to reproduce the SSG failures we see on
`npm run build` due to `require.resolveWeak` / webpack SSR resolution issues.

How to reproduce (after a failing build)
----------------------------------------

1. Build the site (without skipping SSG):

```bash
npx docusaurus build
```

2. Run the repro script which will try to load the generated server bundle
  and run the SSG renderer entry in a minimal harness to capture the error.

```bash
# if using the shim used during local experimentation:
node -r ./scripts/resolveWeakShim.cjs repro/run_repro.cjs
# or without the shim (may fail earlier):
node repro/run_repro.cjs
```

Files
-----
- `run_repro.cjs`: attempts to load `build/__server/server.bundle.js` similar to
  how Docusaurus SSG evaluates it and prints errors/stacks.

Use this package as an artifact to file an upstream issue; include the
`build/__server/server.bundle.js` and the output of `node repro/run_repro.js`.
