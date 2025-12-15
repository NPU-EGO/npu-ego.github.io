// Lightweight helper to evaluate a server bundle with a webpack-like 'require'
// for SSG testing. Provides `resolveWeak`, CSS stubbing, and virtual module
// mapping for `@theme/*` and `@site/*` style IDs.

const { createRequire } = require('module');
const fs = require('fs');
const Module = require('module');

function createSSGRequire(bundlePath, options = {}) {
  const realRequire = createRequire(bundlePath);
  const virtualMap = options.virtualMap || {};

  function ssgRequire(id) {
    // virtual modules (e.g., @theme/foo)
    if (Object.prototype.hasOwnProperty.call(virtualMap, id)) return virtualMap[id];

    // Fallback for any @theme/* or @site/* virtual modules: return a stub.
    if (typeof id === 'string' && (id.startsWith('@theme/') || id.startsWith('@site/'))) {
      return {};
    }

    // best-effort resolve to inspect target before requiring
    let resolved;
    try {
      resolved = realRequire.resolve(id);
    } catch (e) {
      resolved = null;
    }

    // CSS path -> stub
    if (typeof id === 'string' && id.match(/\.css($|[?#])/) ) return {};
    if (resolved && String(resolved).match(/\.css($|[?#])/) ) return {};

    // If the resolved file is JS and contains a CSS import, pre-seed the
    // require cache with a stub module to avoid Node's ESM loader trying
    // to parse/import the CSS file when the module is required.
    try {
      if (resolved && String(resolved).match(/\.m?js$|\.cjs$|\.js$/)) {
        const content = fs.readFileSync(resolved, 'utf8');
        if (/import\s+['"][^'"\n]+\.css/.test(content) || /from\s+['"][^'"\n]+\.css/.test(content)) {
          if (!require.cache[resolved]) {
            const m = new Module(resolved, module.parent);
            m.filename = resolved;
            m.loaded = true;
            m.exports = {};
            require.cache[resolved] = m;
          }
          return require.cache[resolved].exports;
        }
      }
    } catch (e) {
      // ignore inspection errors and fallback to native require
    }

    return realRequire(id);
  }

  ssgRequire.resolve = function (id) {
    if (Object.prototype.hasOwnProperty.call(virtualMap, id)) return id;
    try {
      return realRequire.resolve(id);
    } catch (e) {
      return id;
    }
  };

  ssgRequire.resolveWeak = function (id) {
    // Best-effort: prefer `resolve`, else return id as the fallback placeholder.
    try {
      return ssgRequire.resolve(id);
    } catch (e) {
      return id;
    }
  };

  ssgRequire.cache = realRequire.cache;

  return ssgRequire;
}

function evaluateServerBundle(source, bundlePath, options = {}) {
  const vm = require('vm');
  const ssgRequire = createSSGRequire(bundlePath, options);

  const path = require('path');
  const module = { exports: {} };
  const exports = module.exports;
  const __filename = bundlePath;
  const __dirname = bundlePath ? path.dirname(bundlePath) : process.cwd();

  const sandbox = {
    console,
    process,
    Buffer,
    setTimeout,
    clearTimeout,
    require: ssgRequire,
    module,
    exports,
    __filename,
    __dirname,
    global: undefined,
  };
  sandbox.global = sandbox;
  vm.createContext(sandbox);

  // As a safety, strip top-level CSS `import` statements to avoid accidental
  // ESM parse errors when evaluating bundles produced with CSS imports.
  const stripped = source.replace(/(^|\n)\s*import\s+['"][^'"\n]+\.css(?:['"])?\s*;?/g, '\n');

  const script = new vm.Script(stripped, { filename: 'server.bundle.js' });
  return script.runInContext(sandbox);
}

module.exports = { createSSGRequire, evaluateServerBundle };
