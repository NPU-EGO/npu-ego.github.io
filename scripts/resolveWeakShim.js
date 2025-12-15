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
