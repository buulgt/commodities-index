import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, scriptName)], { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

async function syncAll() {
  console.log('🔄 Syncing all domestic bullion feeds (SJC + Bảo Tín Mạnh Hải)...');
  try {
    await runScript('sync-btmh.mjs');
    await runScript('sync-sjc.mjs');
    console.log('✨ All feeds synced successfully!');
  } catch (err) {
    console.error('❌ Sync error:', err.message);
  }
}

syncAll();
