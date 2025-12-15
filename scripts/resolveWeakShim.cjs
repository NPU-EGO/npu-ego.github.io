'use strict';

// Shim to provide require.resolveWeak and global File for Docusaurus SSR builds
try {
  // Helps confirm in CI logs that the shim is actually preloaded.
  // Docusaurus may spawn multiple node processes; include pid for clarity.
  const skip = process.env.DOCUSAURUS_SKIP_SSG;
  const importArgv = (process.execArgv || []).filter((a) => a === '--import' || a.startsWith('--import='));
  console.error(
    `[resolveWeakShim] loaded pid=${process.pid} DOCUSAURUS_SKIP_SSG=${skip ?? 'undefined'} importArgv=${importArgv.length ? importArgv.join(',') : 'none'}`
  );
} catch (e) {
  // ignore
}

// Note: we intentionally do NOT try to resolve Docusaurus virtual aliases like
// @theme/* or @site/* to source files here.
// Those files can contain JSX/TSX and are expected to be bundled/transpiled by
// the Docusaurus server bundle during build/SSG.

try {
  if (typeof require !== 'undefined' && typeof require.resolveWeak !== 'function') {
    Object.defineProperty(require, 'resolveWeak', {
      value: function (id) {
        // In a real webpack runtime, this returns an internal module id.
        // In plain Node, returning a path/id can cause Node to try executing
        // untranspiled JSX/TSX modules. Keep it as a harmless no-op.
        return undefined;
      },
      configurable: true,
      writable: true,
    });
  }
} catch (e) {
  // ignore
}

// Ensure functions (including webpack's `require`) inherit a `resolveWeak`
// implementation via the prototype chain. Some bundles call
// `require.resolveWeak(...)` where `require` is a function.
try {
  if (typeof Function !== 'undefined' && typeof Function.prototype.resolveWeak !== 'function') {
    Object.defineProperty(Function.prototype, 'resolveWeak', {
      value: function (id) {
        // No-op fallback for bundles that call require.resolveWeak().
        return undefined;
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
// Patch module compilation to hard-stop stylesheet compilation.
try {
  const Module = require('module');
  const origCompile = Module.prototype._compile;
  const loggedCompileFailures = new Set();
  Module.prototype._compile = function (content, filename) {
    // Hard-stop: if Node attempts to compile a stylesheet as JS, just stub it.
    if (typeof filename === 'string' && filename.match(/\.(css|scss|sass|less)(?:$|[?#])/i)) {
      this.exports = '';
      return;
    }
    try {
      return origCompile.call(this, content, filename);
    } catch (e) {
      try {
        const message = e && e.message ? String(e.message) : '';
        if (
          typeof filename === 'string' &&
          message.includes("Unexpected token '<'") &&
          !loggedCompileFailures.has(filename)
        ) {
          loggedCompileFailures.add(filename);
          console.error(`[resolveWeakShim] compile failed: ${filename}`);
        }
      } catch (logErr) {
        // ignore
      }
      throw e;
    }
  };
} catch (e) {
  // ignore
}

// Polyfill File in Node build environment
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
