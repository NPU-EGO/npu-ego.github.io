const {execSync} = require('child_process');

function run(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, {stdio: 'inherit'});
  } catch (e) {
    throw e;
  }
}

function main() {
  console.log('Testing build (SSR/SSG disabled)...\n');
  run('npm run build');
  console.log('\n✅ Build integration: PASS');
}

main();
