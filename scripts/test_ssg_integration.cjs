const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, Object.assign({ stdio: 'inherit' }, opts));
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${res.status}`);
  }
}

async function main() {
  try {
    // Run full build but with SSG explicitly disabled (produces server bundle reliably).
    run('npm', ['run', 'build'], { env: Object.assign({}, process.env, { DOCUSAURUS_SKIP_SSG: 'true', DANGEROUSLY_DISABLE_SSG: 'true', DOCUSAURUS_KEEP_SERVER_BUNDLE: 'true' }) });

    // Evaluate the produced server bundle using the repro harness (with shim)
    run('node', ['-r', './scripts/resolveWeakShim.js', 'repro/run_repro.cjs']);

    console.log('SSG integration: PASS');
  } catch (err) {
    console.error('SSG integration: FAIL', err && err.stack);
    process.exit(1);
  }
}

main();
