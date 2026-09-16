import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  LineSeries,
  BaselineSeries,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { Timeframe, PaletteTokens } from '../types/commodity';
import { Globe, DollarSign, Percent, Layers } from 'lucide-react';

interface SgeRecord {
  date: string;
  sge_cny_per_g: number;
  usd_cny: number;
  sge_usd_per_oz: number;
  world_gold_usd: number;
  spread_usd: number;
  premium_percent: number;
}

interface SgeTerminalChartProps {
  timeframe: Timeframe;
  palette?: PaletteTokens;
  height?: number;
}

type SgeChartMode = 'spread' | 'percent' | 'dual';

export const SgeTerminalChart: React.FC<SgeTerminalChartProps> = ({
  timeframe,
  palette,
  height = 580,
}) => {
  const [data, setData] = useState<SgeRecord[]>([]);
  const [subMode, setSubMode] = useState<SgeChartMode>('spread');
  const [hoverData, setHoverData] = useState<SgeRecord | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const spreadSeriesRef = useRef<ISeriesApi<'Baseline'> | null>(null);
  const pctSeriesRef = useRef<ISeriesApi<'Baseline'> | null>(null);
  const sgeLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const worldLineRef = useRef<ISeriesApi<'Line'> | null>(null);

  // 1. Fetch SGE history dataset
  useEffect(() => {
    let active = true;
    fetch('/sge-spread-history.json')
      .then((res) => res.json())
      .then((payload) => {
        if (active && payload?.data) {
          setData(payload.data);
        }
      })
      .catch(() => {
        // Check window fallback if any
        const win = window as unknown as { SGE_SPREAD_DATA?: { data: SgeRecord[] } };
        if (active && win.SGE_SPREAD_DATA?.data) {
          setData(win.SGE_SPREAD_DATA.data);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // 2. Filter data by timeframe
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    if (timeframe === 'ALL') return data;

    const lastDate = new Date(data[data.length - 1].date);
    const cutoff = new Date(lastDate);

    switch (timeframe) {
      case '5D':
        cutoff.setDate(lastDate.getDate() - 7);
        break;
      case '1M':
        cutoff.setMonth(lastDate.getMonth() - 1);
        break;
      case '3M':
        cutoff.setMonth(lastDate.getMonth() - 3);
        break;
      case '6M':
        cutoff.setMonth(lastDate.getMonth() - 6);
        break;
      case 'YTD':
        cutoff.setMonth(0);
        cutoff.setDate(1);
        break;
      case '1Y':
        cutoff.setFullYear(lastDate.getFullYear() - 1);
        break;
      case '5Y':
        cutoff.setFullYear(lastDate.getFullYear() - 5);
        break;
    }

    const cutoffStr = cutoff.toISOString().split('T')[0];
    const subset = data.filter((d) => d.date >= cutoffStr);
    return subset.length > 5 ? subset : data.slice(-30);
  }, [data, timeframe]);

  // Latest snapshot metrics
  const latest = data[data.length - 1];
  const activeRecord = hoverData || latest;

  // 3. Initialize & Mount Lightweight Charts v5
  useEffect(() => {
    if (!containerRef.current || !filteredData.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // bg styling
    const textColor = palette?.textMuted || '#64748b';
    const gridColor = palette?.gridLines || 'rgba(255, 255, 255, 0.04)';
    const borderColor = palette?.border || 'rgba(255, 255, 255, 0.08)';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: height - 120,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor,
        fontFamily: "'Geist Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor,
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
    });

    chartRef.current = chart;

    if (subMode === 'spread') {
      const spreadSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 0 },
        topLineColor: '#10b981',
        topFillColor1: 'rgba(16, 185, 129, 0.32)',
        topFillColor2: 'rgba(16, 185, 129, 0.02)',
        bottomLineColor: '#f43f5e',
        bottomFillColor1: 'rgba(244, 63, 94, 0.02)',
        bottomFillColor2: 'rgba(244, 63, 94, 0.32)',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      spreadSeries.setData(filteredData.map((d) => ({ time: d.date as Time, value: d.spread_usd })));
      spreadSeriesRef.current = spreadSeries;
    } else if (subMode === 'percent') {
      const pctSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 0 },
        topLineColor: '#a855f7',
        topFillColor1: 'rgba(168, 85, 247, 0.32)',
        topFillColor2: 'rgba(168, 85, 247, 0.02)',
        bottomLineColor: '#f43f5e',
        bottomFillColor1: 'rgba(244, 63, 94, 0.02)',
        bottomFillColor2: 'rgba(244, 63, 94, 0.32)',
        lineWidth: 2,
        priceFormat: { type: 'percent', precision: 2, minMove: 0.01 },
      });
      pctSeries.setData(filteredData.map((d) => ({ time: d.date as Time, value: d.premium_percent })));
      pctSeriesRef.current = pctSeries;
    } else if (subMode === 'dual') {
      const sgeLine = chart.addSeries(LineSeries, {
        color: palette?.gold || '#f59e0b',
        lineWidth: 2,
        title: 'SGE USD/oz',
      });
      const worldLine = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 1,
        lineStyle: 2,
        title: 'LBMA USD/oz',
      });
      sgeLine.setData(filteredData.map((d) => ({ time: d.date as Time, value: d.sge_usd_per_oz })));
      worldLine.setData(filteredData.map((d) => ({ time: d.date as Time, value: d.world_gold_usd })));
      sgeLineRef.current = sgeLine;
      worldLineRef.current = worldLine;
    }

    chart.timeScale().fitContent();

    // Crosshair move subscription for responsive HUD inspect
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHoverData(null);
        return;
      }
      const timeStr = typeof param.time === 'string' ? param.time : '';
      const match = filteredData.find((d) => d.date === timeStr);
      if (match) setHoverData(match);
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [filteredData, subMode, palette, height]);

  return (
    <div className="vault-shell">
      <div className="vault-core p-4 flex flex-col gap-3 font-mono">
        
        {/* Top Header Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[var(--p-border)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-[var(--p-gold)]/40 flex items-center justify-center">
              <Globe className="w-4 h-4 text-[var(--p-gold)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--p-text)] tracking-wider uppercase font-sans">
                  SHANGHAI GOLD PREMIUM (SGE Au99.99 vs LBMA)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-[var(--p-gold)] border border-amber-500/30">
                  {filteredData.length} BARS
                </span>
              </div>
              <div className="text-[11px] text-[var(--p-muted)] mt-0.5">
                Official Shanghai Gold Exchange Daily Benchmark vs London Gold Spot • 2016–2026
              </div>
            </div>
          </div>

          {/* Sub-mode Tab Buttons */}
          <div className="flex items-center gap-1 bg-black/10 dark:bg-black/40 border border-[var(--p-border)] p-1 rounded-full text-xs self-start lg:self-auto shadow-inner">
            <button
              onClick={() => setSubMode('spread')}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                subMode === 'spread'
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 shadow-sm'
                  : 'text-[var(--p-muted)] hover:text-[var(--p-text)]'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Spread ($/oz)</span>
            </button>

            <button
              onClick={() => setSubMode('percent')}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                subMode === 'percent'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                  : 'text-[var(--p-muted)] hover:text-[var(--p-text)]'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>Premium (%)</span>
            </button>

            <button
              onClick={() => setSubMode('dual')}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                subMode === 'dual'
                  ? 'bg-amber-500/20 text-[var(--p-gold)] border border-amber-500/40 shadow-sm'
                  : 'text-[var(--p-muted)] hover:text-[var(--p-text)]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Dual Prices</span>
            </button>
          </div>
        </div>

        {/* Dynamic HUD Readout Box */}
        {activeRecord && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-black/5 dark:bg-black/20 p-2.5 rounded-xl border border-[var(--p-border)] text-[11px]">
            <div>
              <span className="text-[10px] text-[var(--p-muted)] uppercase block">Date</span>
              <span className="font-bold text-[var(--p-text)]">{activeRecord.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--p-muted)] uppercase block">SGE Au99.99</span>
              <span className="font-bold text-amber-500">¥{activeRecord.sge_cny_per_g.toFixed(2)}/g</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--p-muted)] uppercase block">USD/CNY</span>
              <span className="font-bold text-[var(--p-text)]">{activeRecord.usd_cny.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--p-muted)] uppercase block">SGE (USD/oz)</span>
              <span className="font-bold text-amber-400">${activeRecord.sge_usd_per_oz.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--p-muted)] uppercase block">LBMA Spot</span>
              <span className="font-bold text-cyan-400">${activeRecord.world_gold_usd.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--p-muted)] uppercase block">Shanghai Spread</span>
              <span
                className={`font-black ${
                  activeRecord.spread_usd >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {activeRecord.spread_usd >= 0 ? '+' : ''}${activeRecord.spread_usd.toFixed(2)}/oz ({activeRecord.spread_usd >= 0 ? '+' : ''}{activeRecord.premium_percent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        {/* Chart Canvas */}
        <div ref={containerRef} className="w-full relative rounded-xl overflow-hidden" />
      </div>
    </div>
  );
};
