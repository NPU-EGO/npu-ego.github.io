const fs = require('fs');
const path = require('path');

async function run() {
  const serverBundlePath = path.resolve(process.cwd(), 'build/__server/server.bundle.js');
  if (!fs.existsSync(serverBundlePath)) {
    console.error('Server bundle not found. Run `npx docusaurus build` first.');
    process.exit(2);
  }

  console.log('Reading server bundle:', serverBundlePath);
  const source = fs.readFileSync(serverBundlePath, 'utf8');

  // Try to evaluate similarly to Docusaurus SSG to surface same error
  try {
    console.log('Evaluating server bundle in VM...');
    const vm = require('vm');
    const script = new vm.Script(source, { filename: 'server.bundle.js' });
    const sandbox = { console, process, Buffer, setTimeout, clearTimeout };
    vm.createContext(sandbox);
    script.runInContext(sandbox);
    console.log('Evaluation complete (no exception thrown synchronously).');
  } catch (err) {
    console.error('Evaluation error:');
    console.error(err.stack || err);
    process.exit(1);
  }
}

run();
