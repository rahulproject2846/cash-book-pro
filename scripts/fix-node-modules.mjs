import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve('/vercel/share/v0-project');

// 1. Remove corrupted node_modules
const nm = resolve(root, 'node_modules');
if (existsSync(nm)) {
  console.log('[v0] Removing corrupted node_modules...');
  rmSync(nm, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  console.log('[v0] node_modules removed.');
} else {
  console.log('[v0] node_modules does not exist, skipping removal.');
}

// 2. Remove .next build cache
const dotNext = resolve(root, '.next');
if (existsSync(dotNext)) {
  console.log('[v0] Removing .next cache...');
  rmSync(dotNext, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  console.log('[v0] .next removed.');
}

// 3. Clear npm cache
console.log('[v0] Clearing npm cache...');
try {
  execSync('npm cache clean --force', { cwd: root, stdio: 'inherit' });
} catch (e) {
  console.log('[v0] npm cache clean failed, continuing anyway...');
}

// 4. Fresh install
console.log('[v0] Running fresh npm install...');
try {
  execSync('npm install', { cwd: root, stdio: 'inherit', timeout: 120000 });
  console.log('[v0] npm install completed successfully!');
} catch (e) {
  console.error('[v0] npm install failed:', e.message);
  process.exit(1);
}
