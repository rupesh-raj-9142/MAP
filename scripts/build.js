import fs from 'fs';
import path from 'path';

// 1. Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Write dist/server.js to forward to dist/server/server.js
fs.writeFileSync(
  path.join('dist', 'server.js'),
  `import './server/server.js';\n`
);
console.log('Build wrapper created: dist/server.js -> dist/server/server.js');

// 2. Ensure public directory exists for Vercel deployment
const publicDir = 'public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

// Copy index.html
if (fs.existsSync('index.html')) {
  fs.copyFileSync('index.html', path.join(publicDir, 'index.html'));
}

// Copy static directories: css, js, assets
['css', 'js', 'assets'].forEach(dir => {
  if (fs.existsSync(dir)) {
    copyRecursiveSync(dir, path.join(publicDir, dir));
  }
});

console.log('Static assets synced to public/ for Vercel deployment.');
