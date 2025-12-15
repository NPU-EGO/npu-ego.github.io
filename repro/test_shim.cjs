const vm = require('vm');
const Module = require('module');

const code = `const id = require.resolveWeak('./x'); console.log('id', id);`;

try {
  const script = new vm.Script(code, { filename: 'server.bundle.js' });
  const sandbox = { require: function (id) { return {}; }, console, Buffer };
  vm.createContext(sandbox);
  script.runInContext(sandbox);
  console.log('vm.Script rewrite test: PASS');
} catch (err) {
  console.error('vm.Script rewrite test: FAIL', err && err.stack);
  process.exit(1);
}

try {
  const m = new Module('');
  m._compile(code, 'server.bundle.js');
  console.log('Module._compile rewrite test: PASS');
} catch (err) {
  console.error('Module._compile rewrite test: FAIL', err && err.stack);
  process.exit(1);
}
