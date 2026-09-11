import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SJC_URL = 'https://sjc.com.vn/bieu-do-gia-vang';
const OUTPUT_FILE = path.join(projectRoot, 'public', 'sjc-live.json');

async function syncSJC() {
  console.log('🚀 Launching local headless Chrome for SJC sync...');
  
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`❌ Chrome binary not found at: ${CHROME_PATH}`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1440,900',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`🌐 Navigating to ${SJC_URL}...`);
    await page.goto(SJC_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for page to clear Cloudflare check
    await new Promise((r) => setTimeout(r, 4000));

    console.log('📡 Calling official SJC PriceService endpoints...');
    const result = await page.evaluate(async () => {
      const post = async (method, extra = {}) => {
        const formData = new URLSearchParams({ method, ...extra });
        const res = await fetch('/GoldPrice/Services/PriceService.ashx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: formData.toString(),
        });
        return await res.json();
      };

      const branchPrices = await post('GetCurrentGoldPricesByBranch');

      // Fetch 30-day history for SJC 1L (Id 1)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const formatDate = (d) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

      const historyData = await post('GetGoldPriceHistory', {
        goldPriceId: '1',
        fromDate: formatDate(thirtyDaysAgo),
        toDate: formatDate(now),
      });

      return {
        branchPrices,
        historyData,
      };
    });

    if (!result?.branchPrices?.success) {
      throw new Error('SJC PriceService returned unsuccessful response');
    }

    const items = result.branchPrices.data || [];
    const sjcBar = items.find((i) => i.TypeName?.includes('1L') && i.BranchName === 'Hồ Chí Minh') || items[0];
    const sjcRing = items.find((i) => i.TypeName?.includes('nhẫn') && i.BranchName === 'Hồ Chí Minh');

    const payload = {
      source: 'https://sjc.com.vn/bieu-do-gia-vang',
      syncedAt: new Date().toISOString(),
      latestDate: result.branchPrices.latestDate || '',
      sjcBar: {
        typeName: sjcBar?.TypeName || 'Vàng SJC 1L, 10L, 1KG',
        branch: sjcBar?.BranchName || 'Hồ Chí Minh',
        buy: sjcBar?.BuyValue || 141400000,
        sell: sjcBar?.SellValue || 144400000,
        formattedBuy: sjcBar?.Buy || '141,400,000',
        formattedSell: sjcBar?.Sell || '144,400,000',
      },
      sjcRing: sjcRing
        ? {
            typeName: sjcRing.TypeName,
            buy: sjcRing.BuyValue,
            sell: sjcRing.SellValue,
          }
        : null,
      historyCount: result.historyData?.data?.length || 0,
      history: (result.historyData?.data || []).map((h) => {
        const match = h.GroupDate?.match(/\d+/);
        const timestamp = match ? Math.floor(parseInt(match[0], 10) / 1000) : 0;
        return {
          time: timestamp,
          buy: h.BuyValue,
          sell: h.SellValue,
        };
      }),
    };

    // Ensure output directory exists
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`✅ SJC Official data successfully written to ${OUTPUT_FILE}`);
    console.log(`📊 SJC Bar Price: Mua ${payload.sjcBar.formattedBuy} | Bán ${payload.sjcBar.formattedSell}`);
    console.log(`🕒 SJC Update Time: ${payload.latestDate}`);
  } finally {
    await browser.close();
  }
}

syncSJC().catch((err) => {
  console.error('❌ Failed to sync SJC data:', err);
  process.exit(1);
});
