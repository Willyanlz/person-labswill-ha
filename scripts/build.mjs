import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
await build({
  entryPoints: ['src/person-central-card.js'], bundle: true, format: 'esm',
  outfile: 'dist/person-central-card.js', target: ['es2022'], minify: true,
  legalComments: 'inline', define: { __VERSION__: JSON.stringify(version) },
  banner: { js: `/*! Person LabsWill HA v${version} | MIT | github.com/Willyanlz/person-labswill-ha */` },
});
