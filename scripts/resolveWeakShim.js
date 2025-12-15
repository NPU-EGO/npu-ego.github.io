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
    // Hard-stop: if Node attempts to compile a stylesheet as JS, just stub it.
    // This covers environments where unknown extensions may fall back to the
    // default JS loader.
    if (typeof filename === 'string' && filename.match(/\.(css|scss|sass|less)(?:$|[?#])/i)) {
      this.exports = '';
      return;
    }
    try {
      let s = content;
      if (Buffer.isBuffer(s)) s = s.toString('utf8');
      
      // For server bundle: guard resolveWeak calls and strip CSS imports
      if (typeof filename === 'string' && filename.endsWith('server.bundle.js')) {
        // guard resolveWeak calls
        s = s.replace(/require\.resolveWeak\s*\(/g, "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))(");
        // strip top-level CSS imports which may trigger ESM loaders
        s = s.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
      }
      
      content = s;
    } catch (err) {
      // ignore
    }
    return origCompile.call(this, content, filename);
  };

  // Also intercept module loads so that when Docusaurus' SSG helper is
  // required we can monkey-patch `createSSGRequire` to provide `resolveWeak`.
  const origLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    // If a module request targets a CSS file, pre-seed the cache with a stub
    // to prevent Node from trying to parse raw CSS as JS during SSG evaluation.
    try {
      if (typeof request === 'string') {
        // Check if request itself is a CSS file (before resolution)
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
            // If resolution fails, return empty stub anyway
            return '';
          }
        }
        
        let resolved;
        try {
          resolved = Module._resolveFilename(request, parent, isMain);
        } catch (e) {
          // If resolution fails, check the request ID itself
          if (request.match(/\.css($|[?#])/)) {
            return '';
          }
          // Let the original handler deal with other failures
          throw e;
        }
        
        if (resolved && typeof resolved === 'string' && resolved.match(/\.css($|[?#])/)) {
          // Pre-populate require.cache with a stub to prevent _compile attempt
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
      if (typeof request === 'string' && request.includes('ssgNodeRequire') && exports && typeof exports.createSSGRequire === 'function') {
        console.error('[resolveWeakShim] patching ssgNodeRequire');
        const origCreate = exports.createSSGRequire;
        if (!origCreate.__patched_resolveWeak) {
          exports.createSSGRequire = function (serverBundlePath) {
            console.error('[resolveWeakShim] createSSGRequire called with', serverBundlePath);
            const ssgRequire = origCreate.apply(this, arguments);
            
            // Wrap the ssgRequire function itself to intercept CSS before it's required
            const origSsgRequire = ssgRequire;
            const wrappedSsgRequire = function(id) {
              try {
                if (typeof id === 'string') {
                  // Pre-check if this is a CSS file
                  if (id.match(/\.css($|[?#])/i)) {
                    console.error('[resolveWeakShim] blocking CSS require:', id);
                    return '';
                  }
                  // Try to resolve to check extension
                  try {
                    const resolved = origSsgRequire.resolve(id);
                    if (typeof resolved === 'string' && resolved.match(/\.css($|[?#])/i)) {
                      console.error('[resolveWeakShim] blocking resolved CSS:', resolved);
                      return '';
                    }
                  } catch (e) {
                    // ignore resolution errors
                  }
                }
              } catch (e) {
                // ignore
              }
              
              try {
                return origSsgRequire(id);
              } catch (e) {
                // If require fails and it looks like a CSS error, return stub
                if (typeof id === 'string' && (id.match(/\.css/i) || (e && e.message && e.message.includes('.css')))) {
                  console.error('[resolveWeakShim] caught CSS error for', id, 'returning empty stub');
                  return '';
                }
                throw e;
              }
            };
            
            // Copy over properties
            wrappedSsgRequire.resolve = origSsgRequire.resolve;
            wrappedSsgRequire.cache = origSsgRequire.cache;
            wrappedSsgRequire.extensions = origSsgRequire.extensions;
            wrappedSsgRequire.main = origSsgRequire.main;
            
            // Provide a safe `resolveWeak` fallback.
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
    const wrappedEval = function(source, filename, options) {
      try {
        let s = source;
        if (typeof s === 'string') {
          // Strip CSS imports that may trigger parsing errors
          s = s.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
          // Guard resolveWeak calls
          s = s.replace(/require\.resolveWeak\s*\(/g, "(typeof require!=='undefined' && typeof require.resolveWeak==='function' ? require.resolveWeak : (function(id){return id;}))(");
        }
        return origEval.call(this, s, filename, options);
      } catch (e) {
        // Check if this is a CSS parsing error
        if (e && (e.message && e.message.includes('.css') || e.stack && e.stack.includes('.css'))) {
          console.error('[resolveWeakShim] Caught CSS evaluation error, trying to recover...');
          // Try again with CSS stripped
          try {
            let s = source;
            if (typeof s === 'string') {
              // More aggressive CSS stripping
              s = s.replace(/(^|\n)\s*(?:import|require)\s*\(\s*['\"][^'\"\n]*\.css['\"][^)]*\)/g, '\n');
              s = s.replace(/(^|\n)\s*import\s+['\"][^'\"\n]+\.css(?:['\"])?\s*;?/g, '\n');
            }
            return origEval.call(this, s, filename, options);
          } catch (e2) {
            throw e; // throw original error if recovery fails
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
