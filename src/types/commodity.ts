export type Timeframe = '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';
export type ViewMode = 'stacked' | 'gold' | 'silver' | 'ratio' | 'sge';
export type UnitMode = 'luong' | 'chi' | 'kg';
/** Absolute prices on dual axes, or percent-change so both countries align on one axis. */
export type ChartScale = 'absolute' | 'percent';
export type BrandMode = 'sjc' | 'btmh';
export type PaletteKey =
  | 'swiss'
  | 'nordic'
  | 'tokyo'
  | 'espresso'
  | 'light_swiss'
  | 'light_parchment'
  | 'light_kyoto'
  | 'light_bauhaus';

export type PaletteMode = 'dark' | 'light';

export interface PaletteTokens {
  id: PaletteKey;
  name: string;
  tag: string;
  bgMain: string;
  bgSurface: string;
  border: string;
  gold: string;
  silver: string;
  text: string;
  textMuted: string;
  gridLines: string;
}
export type GoldDealerKey = 'sjc' | 'mihong' | 'btmc' | 'btmh' | 'doji' | 'pnj';
export type SilverDealerKey = 'phuquy' | 'btmh_silver' | 'ancarat';

export interface DealerInfo {
  id: string;
  name: string;
  city: string;
  productName: string;
  buy: number;
  sell: number;
  spread: number;
  badge: string;
  updated: string;
  premiumPercent?: number;
}

export interface SgeBenchmarkInfo {
  contract: string; // e.g. 'Au99.99'
  name: string; // e.g. 'Shanghai Gold Exchange (SGE)'
  priceCnyPerGram: number; // e.g. 1018.50 CNY/g
  usdCnyRate: number; // e.g. 7.24
  sgeUsdPerOz: number; // converted USD/oz equivalent
  worldUsdPerOz: number; // LBMA XAU/USD spot
  spreadUsd: number; // USD/oz premium
  premiumPercent: number; // % premium over LBMA
  updated: string;
}

export interface BullionMatrixData {
  syncedAt: string;
  usdRate: number;
  goldWorld: number;
  silverWorld: number;
  dealers: Record<string, DealerInfo>;
  silverDealers: Record<string, DealerInfo>;
  sge?: SgeBenchmarkInfo;
}

export interface PricePoint {
  time: number; // Unix timestamp in seconds
  worldPrice: number; // USD per oz
  vnPrice: number; // VND per lượng (tael)
}

export interface CommoditySummary {
  name: string;
  symbol: string;
  iconType: 'gold' | 'silver';
  worldPrice: number;
  worldChange24h: number;
  worldChangePercent: number;
  vnBuyPrice: number;
  vnSellPrice: number;
  vnChange24h: number;
  vnChangePercent: number;
  spreadVn: number;
  currencyRate: number; // USD/VND
  lastUpdated: string;
}

export interface ChartSeriesPoint {
  time: number; // unix timestamp in seconds
  value: number;
}
