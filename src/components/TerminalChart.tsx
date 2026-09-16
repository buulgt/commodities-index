import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  createChart,
  LineSeries,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts';
import type { PricePoint, UnitMode, Timeframe, PaletteTokens } from '../types/commodity';
import { convertVnPrice } from '../services/marketData';
import { Calendar, Crosshair, Eye, EyeOff } from 'lucide-react';

interface TerminalChartProps {
  title: string;
  symbol: string;
  type: 'gold' | 'silver' | 'ratio';
  data: PricePoint[];
  unit: UnitMode;
  timeframe: Timeframe;
  palette?: PaletteTokens;
  height?: number;
}

export const TerminalChart: React.FC<TerminalChartProps> = ({
  title,
  symbol,
  type,
  data,
  unit,
  timeframe,
  height = 370,
  palette,
}) => {
  const isPercent = type !== 'ratio';
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const worldSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  // Percent geometry shared by both axes, updated on every data refresh.
  const pctRangeRefOut = useRef<{ current: { min: number; max: number } } | null>(null);
  const baseRefOut = useRef<{ current: { world: number; vn: number } } | null>(null);
  const vnSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Series visibility toggles (on/off)
  const [showWorld, setShowWorld] = useState(true);
  const [showVn, setShowVn] = useState(true);

  const toggleWorld = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showWorld && !showVn) return; // Prevent turning off both
    setShowWorld((prev) => !prev);
  };

  const toggleVn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showVn && !showWorld) return; // Prevent turning off both
    setShowVn((prev) => !prev);
  };
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const latestPoint = useMemo(() => data[data.length - 1] ?? null, [data]);
  const activePoint = hoveredPoint ?? latestPoint;

  const isRatio = type === 'ratio';

  const theme = useMemo(() => {
    const goldColor = palette?.gold ?? '#D4AF37';
    const silverColor = palette?.silver ?? '#E2E8F0';

    if (type === 'gold') {
      return {
        world: goldColor,
        vn: '#ef4444',
        pillBg: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
      };
    }
    if (type === 'silver') {
      return {
        world: silverColor,
        vn: '#06b6d4',
        pillBg: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
      };
    }
    return {
      world: '#10b981',
      vn: '#8b5cf6',
      pillBg: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    };
  }, [type, palette]);

  const unitLabel = unit === 'luong' ? 'lượng' : unit === 'chi' ? 'chỉ' : 'kg';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 11,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      grid: {
        vertLines: { color: 'rgba(28, 35, 49, 0.45)' },
        horzLines: { color: 'rgba(28, 35, 49, 0.45)' },
      },
      leftPriceScale: {
        visible: true,
        borderColor: palette?.border ?? '#1e2637',
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      rightPriceScale: {
        visible: !isRatio,
        borderColor: palette?.border ?? '#1e2637',
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderColor: palette?.border ?? '#1e2637',
        timeVisible: true,
        secondsVisible: false,
        // TradingView behaviour: the newest bar stays anchored while you scroll.
        rightBarStaysOnScroll: true,
        lockVisibleTimeRangeOnResize: true,
        rightOffset: 8,
        barSpacing: 8,
        minBarSpacing: 0.08,
        maxBarSpacing: 80,
      },
      // Full TradingView gesture set: wheel zoom, drag pan, pinch, kinetic scroll.
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
        axisDoubleClickReset: { time: true, price: true },
      },
      kineticScroll: {
        mouse: true,
        touch: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: '#334155' },
        horzLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: '#334155' },
      },
    });
    // Aligned mode keeps BOTH vertical axes with real prices.
    //   • geometry  = percent change, identical range on both scales
    //   • left axis = World gold price (USD/oz)
    //   • right axis= Vietnam gold price (VND/lượng)
    // Each formatter inverts that axis's own base back to an absolute price.
    const pctRangeRef = { current: { min: -1, max: 1 } };
    const baseRef = { current: { world: 1, vn: 1 } };
    const lockRange = () => ({ priceRange: { minValue: pctRangeRef.current.min, maxValue: pctRangeRef.current.max } });
    const worldFmt = (p: number) => {
      const usd = baseRef.current.world * (1 + p / 100);
      return usd >= 1000 ? `$${Math.round(usd).toLocaleString('en-US')}` : `$${usd.toFixed(2)}`;
    };
    const vnFmt = (p: number) => {
      const vnd = baseRef.current.vn * (1 + p / 100);
      if (vnd >= 1000000) return (vnd / 1000000).toFixed(2) + 'M';
      if (vnd >= 1000) return (vnd / 1000).toFixed(0) + 'K';
      return Math.round(vnd).toLocaleString('vi-VN');
    };

    // Keep the locks reachable from the data effect.
    pctRangeRefOut.current = pctRangeRef;
    baseRefOut.current = baseRef;

    const worldSeries = chart.addSeries(LineSeries, {
      priceScaleId: 'left',
      color: theme.world,
      lineWidth: 2,
      autoscaleInfoProvider: isPercent ? lockRange : undefined,
      priceFormat: isPercent
        ? { type: 'custom', formatter: worldFmt }
        : { type: 'price', precision: 2, minMove: 0.01 },
    });

    let vnSeries: ISeriesApi<'Line'> | null = null;
    if (!isRatio) {
      vnSeries = chart.addSeries(LineSeries, {
        priceScaleId: 'right',
        color: theme.vn,
        lineWidth: 2,
        autoscaleInfoProvider: isPercent ? lockRange : undefined,
        priceFormat: isPercent
          ? { type: 'custom', formatter: vnFmt }
          : {
              type: 'custom',
              formatter: (price: number) => {
                if (price >= 1000000) return (price / 1000000).toFixed(2) + 'M';
                if (price >= 1000) return (price / 1000).toFixed(0) + 'K';
                return price.toLocaleString('vi-VN');
              },
            },
      });
    }

    chartRef.current = chart;
    worldSeriesRef.current = worldSeries;
    vnSeriesRef.current = vnSeries;

    // Crosshair hover synchronization
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoveredPoint(null);
        return;
      }

      const worldData = param.seriesData.get(worldSeries) as { value?: number } | undefined;
      const vnData = vnSeries ? (param.seriesData.get(vnSeries) as { value?: number } | undefined) : undefined;

      if (worldData?.value !== undefined) {
        setHoveredPoint({
          time: Number(param.time),
          worldPrice: worldData.value,
          vnPrice: vnData?.value ?? 0,
        });
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !chartContainerRef.current) return;
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });

    resizeObserver.observe(chartContainerRef.current);

    // Populate initial data immediately on creation
    if (data.length > 0) {
      worldSeries.setData(
        data.map((d) => ({ time: d.time as UTCTimestamp, value: d.worldPrice }))
      );
      if (vnSeries && !isRatio) {
        vnSeries.setData(
          data.map((d) => ({ time: d.time as UTCTimestamp, value: convertVnPrice(d.vnPrice, unit) }))
        );
      }
      chart.timeScale().fitContent();
    }

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [isRatio, isPercent]);
  // Dynamic height adjustment when view mode expands
  useEffect(() => {
    chartRef.current?.applyOptions({ height });
  }, [height]);

  // Apply series and price scale visibility when toggled on/off
  useEffect(() => {
    worldSeriesRef.current?.applyOptions({ visible: showWorld });
    chartRef.current?.applyOptions({
      leftPriceScale: { visible: showWorld },
    });
  }, [showWorld]);

  useEffect(() => {
    if (vnSeriesRef.current && !isRatio) {
      vnSeriesRef.current.applyOptions({ visible: showVn });
      chartRef.current?.applyOptions({
        rightPriceScale: { visible: showVn },
      });
    }
  }, [showVn, isRatio]);

  // Dynamic palette update on existing chart canvas (no teardown)
  useEffect(() => {
    if (!chartRef.current || !palette) return;
    worldSeriesRef.current?.applyOptions({ color: theme.world });
    vnSeriesRef.current?.applyOptions({ color: theme.vn });
    chartRef.current.applyOptions({
      grid: {
        vertLines: { color: palette.gridLines },
        horzLines: { color: palette.gridLines },
      },
      layout: {
        textColor: palette.textMuted,
      },
      leftPriceScale: {
        borderColor: palette.border,
      },
      rightPriceScale: {
        borderColor: palette.border,
      },
      timeScale: {
        borderColor: palette.border,
      },
    });
  }, [palette, theme.world, theme.vn]);

  // Bars required for each range preset, derived from the series itself.
  // Used both to size the visible window and to compute exact bar spacing.
  const barsForPreset = useCallback(
    (tf: Timeframe, series: PricePoint[]): number => {
      const len = series.length;
      if (len === 0) return 0;
      if (tf === 'ALL') return len;
      const lastTime = series[len - 1].time;
      if (tf === 'YTD') {
        const jan1 = Math.floor(Date.UTC(new Date(lastTime * 1000).getUTCFullYear(), 0, 1) / 1000);
        let n = 0;
        for (let i = len - 1; i >= 0 && series[i].time >= jan1; i--) n++;
        return n;
      }
      const days: Partial<Record<Timeframe, number>> = {
        '5D': 5,
        '1M': 30,
        '3M': 91,
        '6M': 182,
        '1Y': 365,
        '5Y': 1826,
      };
      const from = lastTime - (days[tf] ?? 365) * 86400;
      let n = 0;
      for (let i = len - 1; i >= 0 && series[i].time >= from; i--) n++;
      return n;
    },
    []
  );

  // Push series data. In aligned mode both lines plot percent change over the
  // visible window on a shared range, so they align while each vertical axis
  // still reports its own absolute price.
  useEffect(() => {
    if (!worldSeriesRef.current || data.length === 0) return;

    const bars = barsForPreset(timeframe, data);
    const baseIdx = isPercent ? Math.max(0, data.length - bars) : 0;
    const baseWorld = data[baseIdx]?.worldPrice || 1;
    const baseVn = data[baseIdx]?.vnPrice || 1;

    if (isPercent) {
      // Publish bases so each axis formatter can invert percent back to price.
      if (baseRefOut.current) baseRefOut.current.current = { world: baseWorld, vn: baseVn };

      // One shared percent domain, padded, locked onto BOTH scales.
      const slice = data.slice(baseIdx);
      let min = Infinity;
      let max = -Infinity;
      for (const d of slice) {
        const wp = ((d.worldPrice - baseWorld) / baseWorld) * 100;
        const vp = ((d.vnPrice - baseVn) / baseVn) * 100;
        if (wp < min) min = wp;
        if (wp > max) max = wp;
        if (vp < min) min = vp;
        if (vp > max) max = vp;
      }
      const pad = Math.max(0.35, (max - min) * 0.08);
      if (pctRangeRefOut.current) {
        pctRangeRefOut.current.current = { min: min - pad, max: max + pad };
      }
    }

    worldSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time as UTCTimestamp,
        value: isPercent
          ? Number((((d.worldPrice - baseWorld) / baseWorld) * 100).toFixed(3))
          : d.worldPrice,
      }))
    );

    if (vnSeriesRef.current && !isRatio) {
      vnSeriesRef.current.setData(
        data.map((d) => ({
          time: d.time as UTCTimestamp,
          value: isPercent
            ? Number((((d.vnPrice - baseVn) / baseVn) * 100).toFixed(3))
            : convertVnPrice(d.vnPrice, unit),
        }))
      );
    }

    // Force both axes to re-derive their range from the lock.
    if (isPercent) chartRef.current?.priceScale('left').applyOptions({ autoScale: true });
    chartRef.current?.priceScale('right').applyOptions({ autoScale: true });
  }, [data, unit, isRatio, isPercent, timeframe, barsForPreset]);

  // Range presets set an exact bar window and matching bar spacing, so the
  // chart lands perfectly fitted with no zoom or scroll required.
  // Re-applies only when the preset changes, never on live polling.
  const presetRef = useRef<string>('');
  useEffect(() => {
    const chart = chartRef.current;
    const el = chartContainerRef.current;
    if (!chart || !el || data.length === 0) return;

    const bars = barsForPreset(timeframe, data);
    if (bars === 0) return;

    const presetKey = `${timeframe}|${data.length}|percent`;
    if (presetRef.current === presetKey) return;
    presetRef.current = presetKey;

    const width = el.clientWidth || 1200;
    // Pane width minus both price-axis gutters.
    const paneWidth = Math.max(120, width - (isPercent || isRatio ? 90 : 160));
    const spacing = Math.min(80, Math.max(0.08, paneWidth / bars));

    chart.timeScale().applyOptions({ rightOffset: 0, barSpacing: spacing });
    // Half a bar of padding on each edge keeps the first and last bar whole.
    chart.timeScale().setVisibleLogicalRange({
      from: data.length - bars - 0.5,
      to: data.length - 0.5,
    });
  }, [timeframe, data, isPercent, isRatio, barsForPreset]);

  return (
    <div className="vault-shell">
      <div className="vault-core p-3 flex flex-col gap-2 relative group">
        {/* Top Header & HUD Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--p-border)] pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[var(--p-text)] tracking-wide font-mono uppercase">{title}</h2>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${theme.pillBg}`}>
              {symbol}
            </span>
          </div>

          {/* Live HUD Readout */}
          <div className="flex items-center gap-3 text-xs font-mono bg-black/5 dark:bg-black/40 border border-[var(--p-border)] px-3 py-1 rounded-full self-start sm:self-auto flex-wrap shadow-inner">
            {/* Series 1: World Toggle Button */}
            <button
              type="button"
              onClick={toggleWorld}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                showWorld
                  ? 'hover:bg-black/10 dark:hover:bg-white/10'
                  : 'opacity-40 line-through bg-black/5 dark:bg-white/5'
              }`}
              title="Bấm để bật / tắt đường giá Thế Giới"
            >
              <span className="w-2.5 h-1 rounded-full" style={{ backgroundColor: theme.world }} />
              <span className="text-[var(--p-muted)]">{isRatio ? 'GSR Ratio:' : 'Thế Giới:'}</span>
              <span className="font-bold text-[var(--p-text)]">
                {activePoint
                  ? isRatio
                    ? `${activePoint.worldPrice.toFixed(2)}x`
                    : `$${activePoint.worldPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '---'}
              </span>
              {!isRatio && (showWorld ? <Eye className="w-2.5 h-2.5 text-[var(--p-muted)]" /> : <EyeOff className="w-2.5 h-2.5 text-[var(--p-muted)]" />)}
            </button>

            {/* Series 2: Vietnam Toggle Button */}
            {!isRatio && (
              <>
                <span className="text-[var(--p-border)]">|</span>
                <button
                  type="button"
                  onClick={toggleVn}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    showVn
                      ? 'hover:bg-black/10 dark:hover:bg-white/10'
                      : 'opacity-40 line-through bg-black/5 dark:bg-white/5'
                  }`}
                  title="Bấm để bật / tắt đường giá Việt Nam"
                >
                  <span className="w-2.5 h-1 rounded-full" style={{ backgroundColor: theme.vn }} />
                  <span className="text-[var(--p-muted)]">Việt Nam:</span>
                  <span className="font-bold text-[var(--p-text)]">
                    {activePoint
                      ? `${convertVnPrice(activePoint.vnPrice, unit).toLocaleString('vi-VN')} ₫`
                      : '---'}
                  </span>
                  <span className="text-[10px] text-[var(--p-muted)] font-mono">/{unitLabel}</span>
                  {showVn ? <Eye className="w-2.5 h-2.5 text-[var(--p-muted)]" /> : <EyeOff className="w-2.5 h-2.5 text-[var(--p-muted)]" />}
                </button>
              </>
            )}

            {activePoint && (
              <div className="hidden lg:flex items-center gap-1 text-[11px] text-[var(--p-muted)] border-l border-[var(--p-border)] pl-2.5">
                <Calendar className="w-3 h-3 text-[var(--p-muted)]" />
                <span>
                  {new Date(activePoint.time * 1000).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hardware Canvas Stage */}
        <div className="relative w-full rounded-2xl bg-[var(--p-card)] border border-[var(--p-border)] p-1 overflow-hidden shadow-sm">
          <div ref={chartContainerRef} className="w-full" />
        </div>

        {/* Footer Axis Guide */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--p-muted)] px-1">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-[var(--p-muted)]" />
            <span>
              {isRatio
                ? 'Trục Trái: Tỷ số Vàng/Bạc (GSR: Ounces of Silver to buy 1 Ounce of Gold)'
                : `Trục Trái: Spot Thế Giới (USD/oz) • Trục Phải: Spot Việt Nam (VND/${unitLabel})`}
            </span>
          </div>
          <span className="hidden sm:inline">Rê chuột để dò tỷ giá lịch sử</span>
        </div>
      </div>
    </div>
  );
};
