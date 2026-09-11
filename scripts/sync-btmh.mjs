import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const BTMH_URL = 'https://baotinmanhhai.vn/bang-gia-vang';
const OUTPUT_FILE = path.join(projectRoot, 'public', 'btmh-live.json');

async function syncBTMH() {
  console.log(`🌐 Fetching live rates from ${BTMH_URL}...`);
  const res = await fetch(BTMH_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch from BTMH: HTTP ${res.status}`);
  }

  const html = await res.text();

  // Parse all role="row" entries
  const rowMatches = html.match(/<div[^>]+role="row"[^>]*>([\s\S]*?)<\/div>(?=<div[^>]+role="row"|<\/div>\s*<\/div>\s*<\/div>)/gi) || [];
  
  const rows = [];
  for (const r of rowMatches) {
    const textOnly = r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    rows.push(textOnly);
  }

  let kimGiaBaoBuy = 142400000;
  let kimGiaBaoSell = 146400000;
  let sjcBtmhBuy = 142000000;
  let sjcBtmhSell = 145000000;
  let nganGiaBaoBuy = 2162000;
  let nganGiaBaoSell = 2229000;
  let bacKgBuy = 57654000;
  let bacKgSell = 59440000;

  for (const row of rows) {
    // 1. Kim Gia Bảo 24K (ĐVT: nghìn VND / chỉ -> nhân 10.000 để ra VND/lượng)
    if (row.includes('Kim Gia Bảo 24K') && !row.includes('Gift')) {
      const match = row.match(/(\d{1,2}\.\d{3})\s+(\d{1,2}\.\d{3})/);
      if (match) {
        kimGiaBaoBuy = Math.round(parseFloat(match[1].replace('.', '')) * 10000);
        kimGiaBaoSell = Math.round(parseFloat(match[2].replace('.', '')) * 10000);
      }
    }

    // 2. Vàng miếng SJC BTMH
    if (row.includes('Vàng miếng SJC')) {
      const match = row.match(/(\d{1,2}\.\d{3})\s+(\d{1,2}\.\d{3})/);
      if (match) {
        sjcBtmhBuy = Math.round(parseFloat(match[1].replace('.', '')) * 10000);
        sjcBtmhSell = Math.round(parseFloat(match[2].replace('.', '')) * 10000);
      }
    }

    // 3. Ngân Gia Bảo - Bạc thỏi (ĐVT: nghìn VND / lượng -> nhân 1.000)
    if (row.includes('Ngân Gia Bảo - Bạc thỏi')) {
      const match = row.match(/(\d{1,2}\.\d{3})\s+(\d{1,2}\.\d{3})/);
      if (match) {
        nganGiaBaoBuy = Math.round(parseFloat(match[1].replace('.', '')) * 1000);
        nganGiaBaoSell = Math.round(parseFloat(match[2].replace('.', '')) * 1000);
      }
    }

    // 4. Bạc thỏi 1 kg (ĐVT: nghìn VND / kg -> nhân 1.000)
    if (row.includes('Bạc thỏi 1 kg')) {
      const match = row.match(/(\d{1,2}\.\d{3})\s+(\d{1,2}\.\d{3})/);
      if (match) {
        bacKgBuy = Math.round(parseFloat(match[1].replace('.', '')) * 1000);
        bacKgSell = Math.round(parseFloat(match[2].replace('.', '')) * 1000);
      }
    }
  }

  // Extract timestamp if present
  const timeMatch = html.match(/Cập nhật lúc\s*([\d\-\:\s\.]+)/);
  const latestDate = timeMatch ? timeMatch[1].trim() : new Date().toLocaleTimeString('vi-VN');

  const payload = {
    source: BTMH_URL,
    syncedAt: new Date().toISOString(),
    latestDate,
    gold: {
      kimGiaBao: {
        name: 'Kim Gia Bảo 24K (99.99%)',
        buy: kimGiaBaoBuy,
        sell: kimGiaBaoSell,
      },
      sjc: {
        name: 'Vàng miếng SJC (BTMH)',
        buy: sjcBtmhBuy,
        sell: sjcBtmhSell,
      },
    },
    silver: {
      nganGiaBao: {
        name: 'Ngân Gia Bảo - Bạc thỏi (99.9%)',
        buy: nganGiaBaoBuy,
        sell: nganGiaBaoSell,
      },
      bacKg: {
        name: 'Bạc thỏi 1 Kilogram (99.9%)',
        buy: bacKgBuy,
        sell: bacKgSell,
      },
    },
  };

  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`✅ Bảo Tín Mạnh Hải rates saved to ${OUTPUT_FILE}`);
  console.log(`🟡 Kim Gia Bảo 24K: Mua ${(kimGiaBaoBuy / 1000000).toFixed(2)}M | Bán ${(kimGiaBaoSell / 1000000).toFixed(2)}M ₫/lượng`);
  console.log(`⚪ Ngân Gia Bảo Bạc: Mua ${(nganGiaBaoBuy / 1000).toFixed(0)}K | Bán ${(nganGiaBaoSell / 1000).toFixed(0)}K ₫/lượng`);
  console.log(`🕒 Update Date: ${latestDate}`);
}

syncBTMH().catch((err) => {
  console.error('❌ Failed to sync BTMH data:', err);
  process.exit(1);
});
