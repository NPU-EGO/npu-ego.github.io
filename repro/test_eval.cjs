const assert = require('assert');
const { evaluateServerBundle } = require('./ssg_eval.cjs');

// Create a small synthetic bundle that simulates common SSG pitfalls:
// - simple `require.resolveWeak` call
// - CSS import (ESM import style) which will be stripped by evaluateServerBundle
// - require of a virtual `@theme/*` module

const fakeBundle = `
import 'infima/dist/css/default/default.css';
const theme = require('@theme/prism-include-languages');
const id = require.resolveWeak('./lazy');
console.log('bundle-run', typeof theme, id);
`;

try {
  evaluateServerBundle(fakeBundle, __filename, {
    virtualMap: { '@theme/prism-include-languages': { name: 'stub' } },
  });
  console.log('test_eval: PASS');
} catch (err) {
  console.error('test_eval: FAIL', err && err.stack);
  process.exit(1);
}
