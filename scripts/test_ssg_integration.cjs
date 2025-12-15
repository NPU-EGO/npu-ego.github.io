const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, Object.assign({ stdio: 'inherit' }, opts));
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${res.status}`);
  }
}

async function main() {
  try {
    // Test basic build without SSG
    // Use direct docusaurus call to ensure SSG is skipped via environment variables
    console.log('Testing build (SSG disabled)...\n');
    
    // Set environment variables that will definitely skip SSG
    const buildEnv = Object.assign({}, process.env, {
      DOCUSAURUS_SKIP_SSG: 'true',
      DANGEROUSLY_DISABLE_SSG: 'true',
      DOCUSAURUS_KEEP_SERVER_BUNDLE: 'true'
    });
    
    // Call docusaurus directly with shim preloaded
    // This ensures SSG is skipped at the Docusaurus level, not relying on npm scripts
    run('node', [
      '-r', './scripts/resolveWeakShim.js',
      './node_modules/.bin/docusaurus',
      'build'
    ], { 
      env: buildEnv,
      cwd: process.cwd()
    });
    
    console.log('\nVerifying build output...');
    if (!fs.existsSync('build/__server/server.bundle.js')) {
      throw new Error('Build failed: server.bundle.js not generated');
    }
    if (!fs.existsSync('build/assets')) {
      throw new Error('Build failed: assets not generated');
    }
    
    console.log('Build integration: PASS');
  } catch (err) {
    console.error('Build integration: FAIL', err && err.stack);
    process.exit(1);
  }
}

main();
