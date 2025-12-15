#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

function findOne(dir, regex) {
  const files = fs.readdirSync(dir).filter((f) => regex.test(f));
  if (!files.length) return null;
  // Pick the longest/newest-looking filename deterministically
  files.sort();
  return files[files.length - 1];
}

function main() {
  const buildDir = path.resolve(process.cwd(), 'build');
  const assetsJsDir = path.join(buildDir, 'assets', 'js');
  const assetsCssDir = path.join(buildDir, 'assets', 'css');

  if (!fs.existsSync(buildDir)) {
    console.error('[generate_index_shell] build/ not found');
    process.exit(1);
  }

  const runtimeJs = findOne(assetsJsDir, /^runtime~main\..+\.js$/);
  const mainJs = findOne(assetsJsDir, /^main\..+\.js$/);
  const stylesCss = fs.existsSync(assetsCssDir) ? findOne(assetsCssDir, /^styles\..+\.css$/) : null;

  if (!mainJs) {
    console.error('[generate_index_shell] Could not find main.*.js in build/assets/js');
    process.exit(1);
  }

  const html = `<!doctype html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NPU-EGO</title>
  ${stylesCss ? `<link rel="stylesheet" href="./assets/css/${stylesCss}" />` : ''}
</head>
<body>
  <noscript>Please enable JavaScript to view this site.</noscript>
  <div id="__docusaurus"></div>
  ${runtimeJs ? `<script src="./assets/js/${runtimeJs}" defer></script>` : ''}
  <script src="./assets/js/${mainJs}" defer></script>
</body>
</html>`;

  fs.writeFileSync(path.join(buildDir, 'index.html'), html, 'utf8');
  console.log('[generate_index_shell] Wrote build/index.html');

  // Also create a 404.html as a SPA fallback for GitHub Pages
  try {
    fs.writeFileSync(path.join(buildDir, '404.html'), html, 'utf8');
    console.log('[generate_index_shell] Wrote build/404.html');
  } catch (e) {
    console.warn('[generate_index_shell] Failed to write 404.html:', e.message);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
