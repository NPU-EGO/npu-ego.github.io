// Node ESM loader to stub out stylesheet imports during Docusaurus SSG/SSR evaluation.
// This prevents errors like:
//   ERR_UNKNOWN_FILE_EXTENSION: Unknown file extension ".css" for .../nprogress.css
//
// Note: This loader is intentionally minimal and only handles stylesheet-like
// extensions.

const STYLESHEET_RE = /\.(css|scss|sass|less)(?:$|[?#])/i;

function isStylesheetUrl(url) {
  return typeof url === 'string' && (url.startsWith('file:') || url.startsWith('node:') || url.startsWith('data:'))
    ? STYLESHEET_RE.test(url)
    : STYLESHEET_RE.test(url);
}

export async function resolve(specifier, context, nextResolve) {
  if (typeof specifier === 'string' && STYLESHEET_RE.test(specifier)) {
    // Convert to an absolute URL so load() can match on url.
    const resolvedUrl = new URL(specifier, context.parentURL).href;
    return { url: resolvedUrl, shortCircuit: true };
  }

  const result = await nextResolve(specifier, context);

  // If a dependency resolves to a stylesheet file URL, short-circuit.
  if (result && isStylesheetUrl(result.url)) {
    return { url: result.url, shortCircuit: true };
  }

  return result;
}

export async function load(url, context, nextLoad) {
  if (isStylesheetUrl(url)) {
    return {
      format: 'module',
      source: 'export default "";\n',
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}
