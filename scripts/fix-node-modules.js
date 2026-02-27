const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = '/vercel/share/v0-project';
const nodeModules = path.join(projectDir, 'node_modules');
const nextDir = path.join(projectDir, '.next');

console.log('[v0] Starting node_modules cleanup...');

// Remove corrupted node_modules
try {
  if (fs.existsSync(nodeModules)) {
    console.log('[v0] Removing node_modules...');
    execSync(`rm -rf "${nodeModules}"`, { stdio: 'inherit', timeout: 120000 });
    console.log('[v0] node_modules removed.');
  }
} catch (e) {
  console.log('[v0] Error removing node_modules:', e.message);
}

// Remove .next cache
try {
  if (fs.existsSync(nextDir)) {
    console.log('[v0] Removing .next...');
    execSync(`rm -rf "${nextDir}"`, { stdio: 'inherit', timeout: 60000 });
    console.log('[v0] .next removed.');
  }
} catch (e) {
  console.log('[v0] Error removing .next:', e.message);
}

// Clean npm cache
try {
  console.log('[v0] Cleaning npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit', timeout: 60000 });
  console.log('[v0] npm cache cleaned.');
} catch (e) {
  console.log('[v0] npm cache clean error (non-fatal):', e.message);
}

// Fresh install
try {
  console.log('[v0] Running npm install...');
  execSync('npm install', { cwd: projectDir, stdio: 'inherit', timeout: 300000 });
  console.log('[v0] npm install completed successfully!');
} catch (e) {
  console.log('[v0] npm install error:', e.message);
}

console.log('[v0] Cleanup complete.');
