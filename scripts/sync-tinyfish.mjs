#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const MATRIX_PATH = path.join(projectRoot, 'public', 'bullion-matrix.json');
const ENV_PATH = path.join(projectRoot, '.env');

// Read TINYFISH_API_KEY from .env or process.env
function getApiKey() {
  if (process.env.TINYFISH_API_KEY) return process.env.TINYFISH_API_KEY.trim();
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    const match = content.match(/TINYFISH_API_KEY=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return null;
}

const API_KEY = getApiKey();
if (!API_KEY) {
  console.error('❌ Error: TINYFISH_API_KEY not found in .env or environment.');
  process.exit(1);
}

// URLs for the top 5 bullion dealers in Vietnam
const TARGET_URLS = [
  'https://webgia.com/gia-vang/sjc/',
  'https://webgia.com/gia-vang/mi-hong/',
  'https://webgia.com/gia-vang/doji/',
  'https://webgia.com/gia-vang/pnj/',
  'https://webgia.com/gia-vang/bao-tin-minh-chau/',
];

// Helper to clean price numbers from Vietnamese string (e.g. "14.290.000" -> 142900000 per lượng)
function parsePrice(str) {
  if (!str) return 0;
  const digits = str.replace(/[^\d]/g, '');
  const val = parseInt(digits, 10);
  if (isNaN(val) || val <= 0) return 0;
  // If price is quoted in đồng / chỉ (e.g. 14,290,000), multiply by 10 to get đồng / lượng
  if (val > 1000000 && val < 30000000) {
    return val * 10;
  }
  return val;
}

function parseMarkdownTable(text) {
  const rows = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.includes('|') && !line.includes('---') && !line.toLowerCase().includes('loại vàng')) {
      const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        rows.push(parts);
      }
    }
  }
  return rows;
}

async function fetchDealersViaTinyFish() {
  console.log(`📡 [TinyFish API] Fetching ${TARGET_URLS.length} bullion dealer feeds...`);
  const res = await fetch('https://api.fetch.tinyfish.ai', {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      urls: TARGET_URLS,
      format: 'markdown',
      ttl: 300, // 5 min freshness cache
    }),
  });

  if (!res.ok) {
    throw new Error(`TinyFish Fetch API error: HTTP ${res.status} ${res.statusText}`);
  }

  const payload = await res.json();
  const results = payload.results || [];
  const dealers = {};

  for (const page of results) {
    const text = page.text || '';
    const rows = parseMarkdownTable(text);

    // 1. SJC
    if (page.url.includes('/sjc/')) {
      const sjcRow = rows.find((r) => r.some((c) => c.includes('1L, 10L, 1KG') || c.includes('Vàng SJC'))) || rows[0];
      if (sjcRow && sjcRow.length >= 4) {
        const buy = parsePrice(sjcRow[2]);
        const sell = parsePrice(sjcRow[3]);
        if (buy > 0 && sell > 0) {
          dealers.sjc = {
            id: 'sjc',
            name: 'SJC Official',
            city: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            buy,
            sell,
            spread: sell - buy,
            badge: 'Chuẩn Quốc Gia',
            updated: new Date().toLocaleTimeString('vi-VN') + ' (TinyFish Live)',
          };
        }
      }
    }

    // 2. Mi Hồng
    if (page.url.includes('/mi-hong/')) {
      const row = rows.find((r) => r.some((c) => c.includes('SJC') || c.includes('99.9%'))) || rows[0];
      if (row && row.length >= 3) {
        const buy = parsePrice(row[row.length - 2]);
        const sell = parsePrice(row[row.length - 1]);
        if (buy > 0 && sell > 0) {
          dealers.mihong = {
            id: 'mihong',
            name: 'Mi Hồng',
            city: 'Bà Chiểu, HCM',
            productName: 'Vàng Miếng SJC & Nhẫn 99.9%',
            buy,
            sell,
            spread: sell - buy,
            badge: 'Spread Thấp Nhất',
            updated: new Date().toLocaleTimeString('vi-VN') + ' (TinyFish Live)',
          };
        }
      }
    }

    // 3. DOJI
    if (page.url.includes('/doji/')) {
      const row = rows.find((r) => r.some((c) => c.includes('SJC') || c.includes('AVPL'))) || rows[0];
      if (row && row.length >= 3) {
        const buy = parsePrice(row[row.length - 2]);
        const sell = parsePrice(row[row.length - 1]);
        if (buy > 0 && sell > 0) {
          dealers.doji = {
            id: 'doji',
            name: 'DOJI Group',
            city: 'Hà Nội & HCM',
            productName: 'Vàng SJC & Hưng Thịnh Vượng',
            buy,
            sell,
            spread: sell - buy,
            badge: 'Tập Đoàn DOJI',
            updated: new Date().toLocaleTimeString('vi-VN') + ' (TinyFish Live)',
          };
        }
      }
    }

    // 4. PNJ
    if (page.url.includes('/pnj/')) {
      const row = rows.find((r) => r.some((c) => c.includes('SJC') || c.includes('PNJ'))) || rows[0];
      if (row && row.length >= 3) {
        const buy = parsePrice(row[row.length - 2]);
        const sell = parsePrice(row[row.length - 1]);
        if (buy > 0 && sell > 0) {
          dealers.pnj = {
            id: 'pnj',
            name: 'PNJ',
            city: 'Toàn Quốc (Phú Nhuận)',
            productName: 'Vàng Miếng PNJ & SJC',
            buy,
            sell,
            spread: sell - buy,
            badge: 'Hệ Thống Lớn Nhất',
            updated: new Date().toLocaleTimeString('vi-VN') + ' (TinyFish Live)',
          };
        }
      }
    }

    // 5. Bảo Tín Minh Châu
    if (page.url.includes('/bao-tin-minh-chau/')) {
      const row = rows.find((r) => r.some((c) => c.includes('Thăng Long') || c.includes('SJC'))) || rows[0];
      if (row && row.length >= 3) {
        const buy = parsePrice(row[row.length - 2]);
        const sell = parsePrice(row[row.length - 1]);
        if (buy > 0 && sell > 0) {
          dealers.btmc = {
            id: 'btmc',
            name: 'Bảo Tín Minh Châu',
            city: 'Trần Nhân Tông, HN',
            productName: 'Vàng Rồng Thăng Long 999.9',
            buy,
            sell,
            spread: sell - buy,
            badge: 'Top 1 Hà Nội',
            updated: new Date().toLocaleTimeString('vi-VN') + ' (TinyFish Live)',
          };
        }
      }
    }
  }

  return dealers;
}

// Main sync logic
async function runSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================`);
  console.log(`🕒 [${new Date().toLocaleTimeString()}] Starting TinyFish Bullion Price Sync...`);
  console.log(`======================================================`);

  try {
    const fetchedDealers = await fetchDealersViaTinyFish();
    const fetchedKeys = Object.keys(fetchedDealers);
    console.log(`✨ Successfully parsed ${fetchedKeys.length} dealer feeds: ${fetchedKeys.join(', ')}`);

    if (fetchedKeys.length === 0) {
      console.warn('⚠️ Warning: No dealer rows could be extracted. Keeping existing matrix data.');
      return;
    }

    // Load existing matrix data
    let existingMatrix = { dealers: {}, silverDealers: {} };
    if (fs.existsSync(MATRIX_PATH)) {
      existingMatrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf-8'));
    }

    // Merge dealer data
    const updatedDealers = {
      ...existingMatrix.dealers,
      ...fetchedDealers,
    };

    const updatedMatrix = {
      ...existingMatrix,
      syncedAt: timestamp,
      dealers: updatedDealers,
    };

    fs.writeFileSync(MATRIX_PATH, JSON.stringify(updatedMatrix, null, 2), 'utf-8');
    console.log(`💾 Saved updated matrix to ${MATRIX_PATH}`);

    // Print summary table
    for (const key of fetchedKeys) {
      const d = updatedDealers[key];
      console.log(`   🏷️  ${d.name.padEnd(20)} | Mua: ${(d.buy / 1000000).toFixed(2)}M | Bán: ${(d.sell / 1000000).toFixed(2)}M | Spread: ${(d.spread / 1000000).toFixed(2)}M`);
    }

  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
}

// CLI argument check
const isOnce = process.argv.includes('--once');

if (isOnce) {
  runSync().then(() => {
    console.log('✅ Single sync run completed.');
    process.exit(0);
  });
} else {
  // Run immediately once
  runSync();

  // Schedule every 1 Hour (3,600,000 ms)
  const ONE_HOUR = 60 * 60 * 1000;
  console.log(`\n⏱️  TinyFish Hourly Price Watcher active (interval: 1 hour / 3600s).`);
  console.log(`Next automatic sync scheduled in 60 minutes.\n`);

  setInterval(() => {
    runSync();
  }, ONE_HOUR);
}
