'use strict';
/**
 * Called by Java (ConvertController) as a subprocess.
 * Reads raw HEIC bytes from stdin, writes raw JPEG bytes to stdout.
 * Exits 0 on success, 1 on failure (error message on stderr).
 */
const heicConvert = require('heic-convert');

const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', async () => {
  try {
    const input  = Buffer.concat(chunks);
    const output = await heicConvert({ buffer: input, format: 'JPEG', quality: 1 });
    process.stdout.write(Buffer.from(output));
    process.exit(0);
  } catch (err) {
    process.stderr.write(err.message || 'Unknown conversion error');
    process.exit(1);
  }
});
