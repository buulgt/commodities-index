import { useState, useEffect, useCallback, useMemo } from 'react';
import { VaultHeader } from './components/VaultHeader';
import { ControlRibbon } from './components/ControlRibbon';
import { BranchMatrix } from './components/BranchMatrix';
import { TerminalChart } from './components/TerminalChart';
import { PALETTES } from './styles/palettes';
import type {
  CommoditySummary,
  Timeframe,
  ViewMode,
  UnitMode,
  ChartScale,
  GoldDealerKey,
  SilverDealerKey,
  BullionMatrixData,

} from './types/commodity';
import { fetchMarketSummaries, fetchBullionMatrix, generateHistory } from './services/marketData';

export function App() {
  const [goldSummary, setGoldSummary] = useState<CommoditySummary | null>(null);
  const [silverSummary, setSilverSummary] = useState<CommoditySummary | null>(null);
  const [bullionMatrix, setBullionMatrix] = useState<BullionMatrixData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Layout & dealer state
  const [viewMode, setViewMode] = useState<ViewMode>('stacked');
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [unit, setUnit] = useState<UnitMode>('luong');
  // Dual axis is the default: World gold (USD/oz) on the left, Vietnam gold
  // (VND/lượng) on the right, both with real prices. "% Align" is available
  // when you want to read the domestic premium directly.
  const [chartScale, setChartScale] = useState<ChartScale>('absolute');
  const [selectedGoldDealer, setSelectedGoldDealer] = useState<GoldDealerKey>('sjc');
  const [selectedSilverDealer, setSelectedSilverDealer] = useState<SilverDealerKey>('phuquy');
  // Theme state: Option 2 Dark (Nordic) vs Option 2 Light (FT Parchment)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light');
  const currentPalette = themeMode === 'dark' ? PALETTES.nordic : PALETTES.light_parchment;

  // Apply dynamic theme variables globally to root document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--p-bg', currentPalette.bgMain);
    root.style.setProperty('--p-surface', currentPalette.bgSurface);
    root.style.setProperty('--p-card', currentPalette.bgCard);
    root.style.setProperty('--p-border', currentPalette.border);
    root.style.setProperty('--p-gold', currentPalette.gold);
    root.style.setProperty('--p-silver', currentPalette.silver);
    root.style.setProperty('--p-text', currentPalette.text);
    root.style.setProperty('--p-muted', currentPalette.textMuted);
  }, [currentPalette]);

  // Load live matrix and summaries based on selected dealers
  const loadSummaries = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const matrix = await fetchBullionMatrix();
      if (matrix) setBullionMatrix(matrix);

      const { gold, silver } = await fetchMarketSummaries(selectedGoldDealer, selectedSilverDealer);
      setGoldSummary(gold);
      setSilverSummary(silver);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedGoldDealer, selectedSilverDealer]);

  // Initial load + interval polling every 30 seconds
  useEffect(() => {
    loadSummaries();
    const interval = setInterval(loadSummaries, 30000);
    return () => clearInterval(interval);
  }, [loadSummaries]);

  // Historical datasets are derived synchronously with the timeframe, so the
  // chart never receives a stale series from a previous timeframe.
  const goldData = useMemo(
    () => generateHistory('gold', goldSummary?.worldPrice, goldSummary?.vnSellPrice),
    [goldSummary?.worldPrice, goldSummary?.vnSellPrice]
  );
  const silverData = useMemo(
    () => generateHistory('silver', silverSummary?.worldPrice, silverSummary?.vnSellPrice),
    [silverSummary?.worldPrice, silverSummary?.vnSellPrice]
  );
  // Compute Gold to Silver Ratio (GSR) series
  const ratioData = useMemo(() => {
    if (goldData.length === 0 || silverData.length === 0) return [];
    return goldData.map((g, i) => {
      const s = silverData[i] ?? silverData[silverData.length - 1];
      const ratio = s && s.worldPrice > 0 ? Number((g.worldPrice / s.worldPrice).toFixed(2)) : 67.9;
      return {
        time: g.time,
        worldPrice: ratio,
        vnPrice: ratio,
      };
    });
  }, [goldData, silverData]);

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-500"
      style={{ backgroundColor: currentPalette.bgMain, color: currentPalette.text }}
    >
      {/* 1. The Vault Command Header with Integrated Arbitrage HUD */}
      <VaultHeader
        gold={goldSummary}
        silver={silverSummary}
        isRefreshing={isRefreshing}
        onRefresh={loadSummaries}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
      />

      {/* Main Terminal Body - Expansive Full-Bleed Widescreen */}
      <main className="flex-1 max-w-[1760px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-col gap-2.5">
        {/* 2. Master Control Ribbon */}
        <ControlRibbon
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          unit={unit}
          onUnitChange={setUnit}
          chartScale={chartScale}
          onScaleChange={setChartScale}
        />

        {/* 3. The Interactive Domestic Branch Arbitrage Matrix */}
        <BranchMatrix
          matrix={bullionMatrix}
          unit={unit}
          viewMode={viewMode}
          selectedGoldDealer={selectedGoldDealer}
          onSelectGoldDealer={setSelectedGoldDealer}
          selectedSilverDealer={selectedSilverDealer}
          onSelectSilverDealer={setSelectedSilverDealer}
        />

        {/* 4. The Interactive Cinema Stage */}
        {viewMode === 'stacked' && (
          <div className="flex flex-col gap-2.5">
            <TerminalChart
              title={`Vàng ${goldSummary?.name ?? 'SJC'}`}
              symbol={goldSummary?.symbol ?? 'XAU / SJC'}
              type="gold"
              data={goldData}
              unit={unit}
              timeframe={timeframe}
              chartScale={chartScale}
              palette={currentPalette}
              height={370}
            />
            <TerminalChart
              title={`Bạc ${silverSummary?.name ?? 'Phú Quý'}`}
              symbol={silverSummary?.symbol ?? 'XAG / Phú Quý'}
              type="silver"
              data={silverData}
              unit={unit}
              timeframe={timeframe}
              chartScale={chartScale}
              palette={currentPalette}
              height={370}
            />
          </div>
        )}

        {viewMode === 'gold' && (
          <TerminalChart
            title={`Vàng Master Index • ${goldSummary?.name ?? 'SJC'}`}
            symbol={goldSummary?.symbol ?? 'XAU / SJC'}
            type="gold"
            data={goldData}
            unit={unit}
            timeframe={timeframe}
            chartScale={chartScale}
            palette={currentPalette}
            height={620}
          />
        )}

        {viewMode === 'silver' && (
          <TerminalChart
            title={`Bạc Master Index • ${silverSummary?.name ?? 'Phú Quý'}`}
            symbol={silverSummary?.symbol ?? 'XAG / Phú Quý'}
            type="silver"
            data={silverData}
            unit={unit}
            timeframe={timeframe}
            chartScale={chartScale}
            palette={currentPalette}
            height={620}
          />
        )}

        {viewMode === 'ratio' && (
          <TerminalChart
            title="Gold / Silver Ratio (GSR Macro Curve)"
            symbol="XAU : XAG"
            type="ratio"
            data={ratioData}
            unit={unit}
            timeframe={timeframe}
            chartScale={chartScale}
            palette={currentPalette}
            height={620}
          />
        )}
      </main>

      {/* Terminal Minimal Footer */}
      <footer className="border-t border-[#121620] py-2 text-center text-[10px] font-mono text-slate-500">
        THE VAULT • MULTI-BRANCH BULLION COMMAND • SJC • MI HỒNG • BTMC • BTMH • DOJI • PNJ • PHÚ QUÝ
      </footer>
    </div>
  );
}

export default App;
