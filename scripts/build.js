/**
 * Build script — copies web assets into www/ for Capacitor.
 * Run with: npm run build
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www');

// Directories and files to copy into www/
const COPY = [
  'index.html',
  'manifest.json',
  'sw.js',
  'css',
  'js',
  'icons',
];

function rmdir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean and recreate www/
rmdir(OUT);
fs.mkdirSync(OUT, { recursive: true });

for (const entry of COPY) {
  const src = path.join(ROOT, entry);
  const dest = path.join(OUT, entry);
  if (!fs.existsSync(src)) {
    console.warn(`  skip (not found): ${entry}`);
    continue;
  }
  copyRecursive(src, dest);
  console.log(`  copied: ${entry}`);
}

console.log('\nBuild complete → www/');
