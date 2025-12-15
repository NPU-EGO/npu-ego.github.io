// Registers the ESM loader used to stub stylesheet imports during build/SSG.
// This avoids using the deprecated `--experimental-loader` flag.

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./scripts/esmCssLoader.mjs', pathToFileURL('./'));
