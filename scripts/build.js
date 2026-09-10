import fs from 'fs';
import path from 'path';

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Write dist/server.js to forward to dist/server/server.js
fs.writeFileSync(
  path.join('dist', 'server.js'),
  `import './server/server.js';\n`
);

console.log('Build wrapper created: dist/server.js -> dist/server/server.js');
