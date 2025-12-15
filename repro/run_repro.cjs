const fs = require('fs');
const path = require('path');

function run() {
  const serverBundlePath = path.resolve(process.cwd(), 'build/__server/server.bundle.js');
  if (!fs.existsSync(serverBundlePath)) {
    console.error('Server bundle not found. Run `npx docusaurus build` first.');
    process.exit(2);
  }

  console.log('Reading server bundle:', serverBundlePath);
  const source = fs.readFileSync(serverBundlePath, 'utf8');

  try {
    console.log('Evaluating server bundle in VM using ssg helper...');
    const { evaluateServerBundle } = require('./ssg_eval.cjs');

    // Provide commonly-needed virtual module fallbacks used by Docusaurus
    // server bundles during SSG evaluation. This helps reproduce and
    // demonstrates how SSG evaluation can map `@theme/*` IDs to small
    // placeholders instead of throwing MODULE_NOT_FOUND.
    const virtualMap = {
      '@theme/prism-include-languages': {
        default: function () { return {}; },
      },
    };

    try {
      evaluateServerBundle(source, serverBundlePath, { virtualMap });
      console.log('Evaluation complete (no exception thrown synchronously).');
    } catch (err) {
      // Write a short diagnostics file so it can be attached to upstream issue
      const out = `Evaluation error:\n${err.stack || err}`;
      const outPath = require('path').resolve(process.cwd(), 'repro', 'repro_output.txt');
      require('fs').writeFileSync(outPath, out, 'utf8');
      console.error(out);
      process.exit(1);
    }
  } catch (err) {
    console.error('Evaluation error:');
    console.error(err.stack || err);
    process.exit(1);
  }
}

run();
