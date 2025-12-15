const fs = require('fs');
const path = require('path');
const { createSSGRequire } = require('./ssg_eval.cjs');

// Create a temporary module that contains an `import 'file.css'` statement.
const tmpDir = path.resolve(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
const tmpModulePath = path.resolve(tmpDir, 'mod_with_css.js');
fs.writeFileSync(tmpModulePath, "import './style.css'; module.exports = {ok:true};\n", 'utf8');

try {
  const ssgRequire = createSSGRequire(__filename, {});
  const mod = ssgRequire(tmpModulePath);
  if (typeof mod !== 'object') throw new Error('expected object export from stubbed module');
  console.log('test_require_css: PASS');
} catch (err) {
  console.error('test_require_css: FAIL', err && err.stack);
  process.exit(1);
}
