// Shim to provide require.resolveWeak and global File for Docusaurus SSR builds
try {
  if (typeof require !== 'undefined' && typeof require.resolveWeak !== 'function') {
    Object.defineProperty(require, 'resolveWeak', {
      value: function (id) {
        try {
          return require.resolve(id);
        } catch (e) {
          return id;
        }
      },
      configurable: true,
      writable: true,
    });
  }
} catch (e) {
  // ignore
}
// Ensure functions (including webpack's `require`) inherit a `resolveWeak`
// implementation via the prototype chain to avoid TypeError when bundles
// call `require.resolveWeak(...)` on a locally-scoped `require` function.
try {
  if (typeof Function !== 'undefined' && typeof Function.prototype.resolveWeak !== 'function') {
    Object.defineProperty(Function.prototype, 'resolveWeak', {
      value: function (id) {
        try {
          if (typeof this.resolve === 'function') return this.resolve(id);
          return id;
        } catch (e) {
          return id;
        }
      },
      configurable: true,
      writable: true,
    });
  }
} catch (e) {
  // ignore
}
// Also wrap vm.Script so bundles evaluated via vm.Script(...) are rewritten
// (e.g., Docusaurus' SSG evaluation uses vm.Script with filename 'server.bundle.js').
try {
  const vm = require('vm');
  const OrigScript = vm.Script;
  if (OrigScript && !OrigScript.__patched_resolveWeak) {
    class PatchedScript extends OrigScript {
      constructor(code, options) {
        try {
          if (options && typeof options.filename === 'string' && options.filename.endsWith('server.bundle.js')) {
            console.error('[resolveWeakShim] vm.Script constructor rewriting', options.filename);
            if (typeof code === 'string') {
              code = code.replace(/require\.resolveWeak\s*\(/g, "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))(");
              code = code.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
            }
          }
        } catch (err) {
          // ignore
        }
        super(code, options);
      }
    }
    PatchedScript.__patched_resolveWeak = true;
    vm.Script = PatchedScript;
  }
} catch (e) {
  // ignore
}

// Intercept file reads for server bundle and patch require.resolveWeak usages
try {
  const fs = require('fs');
  const origReadFileSync = fs.readFileSync;
  fs.readFileSync = function (path, options) {
    const content = origReadFileSync.apply(this, arguments);
    try {
      if (typeof path === 'string' && path.endsWith('server.bundle.js')) {
        let s = content;
        if (Buffer.isBuffer(s)) s = s.toString('utf8');
        s = s.replace(/require\.resolveWeak\s*\(/g, "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))(");
        return Buffer.from(s, 'utf8');
      }
    } catch (err) {
      // ignore
    }
    return content;
  };
  const origReadFile = fs.readFile;
  fs.readFile = function (path, options, cb) {
    if (typeof options === 'function') cb = options, options = null;
    return origReadFile.call(this, path, options, function (err, data) {
      if (err) return cb(err);
      try {
        if (typeof path === 'string' && path.endsWith('server.bundle.js')) {
          let s = data;
          if (Buffer.isBuffer(s)) s = s.toString('utf8');
          s = s.replace(/require\.resolveWeak\s*\(/g, "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))(");
          return cb(null, Buffer.from(s, 'utf8'));
        }
      } catch (err) {
        // ignore
      }
      cb(null, data);
    });
  };
} catch (e) {
  // ignore
}

// Patch module compilation to rewrite troublesome patterns (server bundle or
// any dynamically-evaluated bundle) before Node compiles it. This is a more
// robust approach that covers code executed via vm or Module._compile.
try {
  const Module = require('module');
  const origCompile = Module.prototype._compile;
  Module.prototype._compile = function (content, filename) {
    try {
      if (typeof filename === 'string' && filename.endsWith('server.bundle.js')) {
        let s = content;
        if (Buffer.isBuffer(s)) s = s.toString('utf8');
        // guard resolveWeak calls
        s = s.replace(/require\.resolveWeak\s*\(/g, "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))(");
        // strip top-level CSS imports which may trigger ESM loaders
        s = s.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
        content = s;
      }
    } catch (err) {
      // ignore
    }
    return origCompile.call(this, content, filename);
  };

  // Also intercept module loads so that when Docusaurus' SSG helper is
  // required we can monkey-patch `createSSGRequire` to provide `resolveWeak`.
  const origLoad = Module._load;
  Module._load = function (request) {
    // If a module request targets a CSS file, return a harmless stub to
    // prevent Node trying to parse raw CSS as JS during SSG evaluation.
    try {
      if (typeof request === 'string' && request.match(/\.css($|[?#])/) ) {
        return '';
      }
      // If the resolved path is a CSS file, stub it as well
      try {
        const resolved = module.constructor._resolveFilename ? module.constructor._resolveFilename(request, module) : require.resolve(request);
        if (typeof resolved === 'string' && resolved.match(/\.css($|[?#])/) ) {
          return '';
        }
      } catch (e) {
        // ignore resolution errors
      }
    } catch (err) {
      // ignore
    }

    const exports = origLoad.apply(this, arguments);
    try {
      if (typeof request === 'string' && request.includes('ssgNodeRequire') && exports && typeof exports.createSSGRequire === 'function') {
        console.error('[resolveWeakShim] patching', request);
        const origCreate = exports.createSSGRequire;
        if (!origCreate.__patched_resolveWeak) {
          exports.createSSGRequire = function () {
            console.error('[resolveWeakShim] createSSGRequire called');
            const ssgRequire = origCreate.apply(this, arguments);

            // Provide a safe `resolveWeak` fallback.
            if (typeof ssgRequire.resolveWeak !== 'function') {
              ssgRequire.resolveWeak = function (id) {
                try {
                  return ssgRequire.resolve(id);
                } catch (e) {
                  return id;
                }
              };
            }

            // Guard common virtual IDs to avoid MODULE_NOT_FOUND during SSG.
            const origSsgRequire = ssgRequire.bind ? ssgRequire.bind(this) : ssgRequire;
            function guardedRequire(id) {
              try {
                if (typeof id === 'string') {
                  if (id.startsWith('@theme/') || id.startsWith('@site/') || id.startsWith('@generated/')) {
                    // Best-effort stub for theme/site virtual modules used during SSG.
                    return {};
                  }
                  if (id.match(/\.css($|[?#])/)) {
                    return {};
                  }
                }
                return origSsgRequire(id);
              } catch (e) {
                // fallback to stub to keep SSG moving for local testing
                return {};
              }
            }
            // Copy helper props
            guardedRequire.resolve = ssgRequire.resolve ? ssgRequire.resolve.bind(ssgRequire) : undefined;
            guardedRequire.resolveWeak = ssgRequire.resolveWeak ? ssgRequire.resolveWeak.bind(ssgRequire) : undefined;
            guardedRequire.cache = ssgRequire.cache;

            return guardedRequire;
          };
          exports.createSSGRequire.__patched_resolveWeak = true;
        }
      }
    } catch (err) {
      // ignore
    }
    return exports;
  };
} catch (e) {
  // ignore
}

try {
  if (typeof globalThis.File === 'undefined') {
    const {Blob} = require('buffer');
    class NodeFile extends Blob {
      constructor(parts, name, options = {}) {
        super(parts, options);
        this.name = name;
        this.lastModified = options.lastModified ?? Date.now();
      }
    }
    globalThis.File = NodeFile;
  }
} catch (e) {
  // ignore
}
