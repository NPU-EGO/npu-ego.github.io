'use strict';

// Shim to provide require.resolveWeak and global File for Docusaurus SSR builds
try {
  // Helps confirm in CI logs that the shim is actually preloaded.
  // Docusaurus may spawn multiple node processes; include pid for clarity.
  console.error(`[resolveWeakShim] loaded pid=${process.pid}`);
} catch (e) {
  // ignore
}

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

// Make Node's CJS loader tolerant to stylesheets required from server bundles.
// Without this, requiring a .css file may fall back to JS compilation and crash
// with a SyntaxError like "Unexpected token ':'".
try {
  if (typeof require !== 'undefined' && require.extensions) {
    const stubStylesheet = function (module) {
      module.exports = '';
    };
    // Keep it minimal and cover the common stylesheet extensions used by Docusaurus.
    require.extensions['.css'] = stubStylesheet;
    require.extensions['.scss'] = stubStylesheet;
    require.extensions['.sass'] = stubStylesheet;
    require.extensions['.less'] = stubStylesheet;

    // Also patch Module._extensions because `module.createRequire()` and other
    // internal require functions ultimately consult Module._extensions.
    try {
      const Module = require('module');
      if (Module && Module._extensions) {
        Module._extensions['.css'] = stubStylesheet;
        Module._extensions['.scss'] = stubStylesheet;
        Module._extensions['.sass'] = stubStylesheet;
        Module._extensions['.less'] = stubStylesheet;

        // Extra hardening: if, for any reason, Node falls back to the default
        // `.js` loader for a stylesheet file, short-circuit before parsing.
        const origJsLoader = Module._extensions['.js'];
        if (typeof origJsLoader === 'function' && !origJsLoader.__patched_stylesheet_fallback) {
          const patchedJsLoader = function (module, filename) {
            if (typeof filename === 'string' && filename.match(/\.(css|scss|sass|less)(?:$|[?#])/i)) {
              module.exports = '';
              return;
            }
            return origJsLoader(module, filename);
          };
          patchedJsLoader.__patched_stylesheet_fallback = true;
          Module._extensions['.js'] = patchedJsLoader;
          // Keep require.extensions in sync if it exists
          try {
            if (require.extensions) require.extensions['.js'] = patchedJsLoader;
          } catch (e) {
            // ignore
          }
        }

        try {
          console.error(
            `[resolveWeakShim] hooks pid=${process.pid} cssExt=${Boolean(Module._extensions['.css'])} jsFallback=${Boolean(Module._extensions['.js'] && Module._extensions['.js'].__patched_stylesheet_fallback)}`
          );
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
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
            if (typeof code === 'string') {
              code = code.replace(
                /require\.resolveWeak\s*\(/g,
                "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))("
              );
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
        s = s.replace(
          /require\.resolveWeak\s*\(/g,
          "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))("
        );
        return Buffer.from(s, 'utf8');
      }
    } catch (err) {
      // ignore
    }
    return content;
  };
  const origReadFile = fs.readFile;
  fs.readFile = function (path, options, cb) {
    if (typeof options === 'function') (cb = options), (options = null);
    return origReadFile.call(this, path, options, function (err, data) {
      if (err) return cb(err);
      try {
        if (typeof path === 'string' && path.endsWith('server.bundle.js')) {
          let s = data;
          if (Buffer.isBuffer(s)) s = s.toString('utf8');
          s = s.replace(
            /require\.resolveWeak\s*\(/g,
            "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))("
          );
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
// any dynamically-evaluated bundle) before Node compiles it.
try {
  const Module = require('module');
  const origCompile = Module.prototype._compile;
  Module.prototype._compile = function (content, filename) {
    // Hard-stop: if Node attempts to compile a stylesheet as JS, just stub it.
    if (typeof filename === 'string' && filename.match(/\.(css|scss|sass|less)(?:$|[?#])/i)) {
      this.exports = '';
      return;
    }
    try {
      let s = content;
      if (Buffer.isBuffer(s)) s = s.toString('utf8');

      if (typeof filename === 'string' && filename.endsWith('server.bundle.js')) {
        s = s.replace(
          /require\.resolveWeak\s*\(/g,
          "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))("
        );
        s = s.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
      }

      content = s;
    } catch (err) {
      // ignore
    }
    return origCompile.call(this, content, filename);
  };

  const origLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    try {
      if (typeof request === 'string') {
        if (request.match(/\.css($|[?#])/)) {
          try {
            const resolved = Module._resolveFilename(request, parent, isMain);
            if (!require.cache[resolved]) {
              const m = new Module(resolved, parent);
              m.filename = resolved;
              m.loaded = true;
              m.exports = '';
              require.cache[resolved] = m;
            }
            return require.cache[resolved].exports;
          } catch (e) {
            return '';
          }
        }

        let resolved;
        try {
          resolved = Module._resolveFilename(request, parent, isMain);
        } catch (e) {
          if (request.match(/\.css($|[?#])/)) return '';
          throw e;
        }

        if (resolved && typeof resolved === 'string' && resolved.match(/\.css($|[?#])/)) {
          if (!require.cache[resolved]) {
            const m = new Module(resolved, parent);
            m.filename = resolved;
            m.loaded = true;
            m.exports = '';
            require.cache[resolved] = m;
          }
          return require.cache[resolved].exports;
        }
      }
    } catch (err) {
      // ignore
    }

    const exports = origLoad.call(this, request, parent, isMain);
    try {
      if (
        typeof request === 'string' &&
        request.includes('ssgNodeRequire') &&
        exports &&
        typeof exports.createSSGRequire === 'function'
      ) {
        const origCreate = exports.createSSGRequire;
        if (!origCreate.__patched_resolveWeak) {
          exports.createSSGRequire = function () {
            const ssgRequire = origCreate.apply(this, arguments);
            const origSsgRequire = ssgRequire;
            const wrappedSsgRequire = function (id) {
              try {
                if (typeof id === 'string') {
                  if (id.match(/\.css($|[?#])/i)) return '';
                  try {
                    const resolved = origSsgRequire.resolve(id);
                    if (typeof resolved === 'string' && resolved.match(/\.css($|[?#])/i)) return '';
                  } catch (e) {
                    // ignore
                  }
                }
              } catch (e) {
                // ignore
              }

              try {
                return origSsgRequire(id);
              } catch (e) {
                if (typeof id === 'string' && (id.match(/\.css/i) || (e && e.message && e.message.includes('.css')))) {
                  return '';
                }
                throw e;
              }
            };

            wrappedSsgRequire.resolve = origSsgRequire.resolve;
            wrappedSsgRequire.cache = origSsgRequire.cache;
            wrappedSsgRequire.extensions = origSsgRequire.extensions;
            wrappedSsgRequire.main = origSsgRequire.main;

            if (typeof wrappedSsgRequire.resolveWeak !== 'function') {
              wrappedSsgRequire.resolveWeak = function (id) {
                try {
                  return wrappedSsgRequire.resolve(id);
                } catch (e) {
                  return id;
                }
              };
            }

            return wrappedSsgRequire;
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

// Patch eval module (used by ssgRenderer) to intercept server bundle evaluation
try {
  const evalModule = require('eval');
  if (evalModule && typeof evalModule === 'function') {
    const origEval = evalModule;
    const wrappedEval = function (source, filename, options) {
      try {
        let s = source;
        if (typeof s === 'string') {
          s = s.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
          s = s.replace(
            /require\.resolveWeak\s*\(/g,
            "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))("
          );
        }
        return origEval.call(this, s, filename, options);
      } catch (e) {
        if (e && ((e.message && e.message.includes('.css')) || (e.stack && e.stack.includes('.css')))) {
          try {
            let s = source;
            if (typeof s === 'string') {
              s = s.replace(/(^|\n)\s*(?:import|require)\s*\(\s*['\"][^'\"\n]*\.css['\"][^)]*\)/g, '\n');
              s = s.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
            }
            return origEval.call(this, s, filename, options);
          } catch (e2) {
            throw e;
          }
        }
        throw e;
      }
    };
    require.cache[require.resolve('eval')].exports = wrappedEval;
  }
} catch (e) {
  // ignore if eval module not available
}

try {
  if (typeof globalThis.File === 'undefined') {
    const { Blob } = require('buffer');
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
