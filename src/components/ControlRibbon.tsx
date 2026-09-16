import React from 'react';
import type { Timeframe, ViewMode, UnitMode, ChartScale } from '../types/commodity';
import { Rows2, Scale, Clock, Globe } from 'lucide-react';

interface ControlRibbonProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  unit: UnitMode;
  onUnitChange: (unit: UnitMode) => void;
  chartScale: ChartScale;
  onScaleChange: (scale: ChartScale) => void;
}

export const ControlRibbon: React.FC<ControlRibbonProps> = ({
  viewMode,
  onViewModeChange,
  timeframe,
  onTimeframeChange,
  unit,
  onUnitChange,
  chartScale,
  onScaleChange,
}) => {
  const timeframes: Timeframe[] = ['5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'ALL'];

  return (
    <div className="vault-shell">
      <div className="vault-core px-4 py-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 font-sans">
        
        {/* 1. View Mode Segmented Island */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-black/50 border border-[var(--p-border)] p-1.5 rounded-2xl overflow-x-auto shadow-inner">
          <button
            onClick={() => onViewModeChange('stacked')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'stacked'
                ? 'bg-amber-500/25 text-[var(--p-gold)] border border-amber-500/50 shadow-sm'
                : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Rows2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Stacked Deck</span>
          </button>

          <button
            onClick={() => onViewModeChange('gold')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'gold'
                ? 'bg-amber-500/25 text-[var(--p-gold)] border border-amber-500/50 shadow-sm'
                : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Gold Solo</span>
          </button>

          <button
            onClick={() => onViewModeChange('silver')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'silver'
                ? 'bg-slate-400/25 text-[var(--p-text)] border border-slate-400/50 shadow-sm'
                : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>Silver Solo</span>
          </button>

          <button
            onClick={() => onViewModeChange('ratio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'ratio'
                ? 'bg-cyan-500/25 text-cyan-400 border border-cyan-500/50 shadow-sm'
                : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>GSR Ratio</span>
          </button>

          <button
            onClick={() => onViewModeChange('sge')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'sge'
                ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/50 shadow-sm'
                : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>SGE Premium</span>
          </button>
        </div>

        {/* Right Controls: Timeframe & Unit Segmented Groups */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto flex-wrap">
          
          {/* Timeframe Island */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-black/50 border border-[var(--p-border)] p-1.5 rounded-2xl shadow-inner font-mono">
            <Clock className="w-3.5 h-3.5 text-[var(--p-muted)] ml-1.5 mr-0.5" />
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                  timeframe === tf
                    ? 'bg-amber-500/25 text-[var(--p-gold)] border border-amber-500/50 shadow-sm'
                    : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Scale Island: dual absolute axes vs percent-aligned */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-black/50 border border-[var(--p-border)] p-1.5 rounded-2xl text-xs font-mono shadow-inner">
            {(['absolute', 'percent'] as ChartScale[]).map((s) => (
              <button
                key={s}
                onClick={() => onScaleChange(s)}
                title={
                  s === 'percent'
                    ? 'Căn chỉnh 2 đường giá theo % thay đổi — so sánh trực tiếp Thế Giới vs Việt Nam'
                    : 'Trục kép: Thế Giới (USD/oz) và Việt Nam (VND/lượng)'
                }
                className={`px-3 py-1 uppercase text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                  chartScale === s
                    ? 'bg-amber-500/25 text-[var(--p-gold)] border border-amber-500/50 shadow-sm'
                    : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
                }`}
              >
                {s === 'percent' ? '% Align' : 'Trục Kép'}
              </button>
            ))}
          </div>

          {/* Unit Island */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-black/50 border border-[var(--p-border)] p-1.5 rounded-2xl text-xs font-mono shadow-inner">
            {(['luong', 'chi', 'kg'] as UnitMode[]).map((u) => (
              <button
                key={u}
                onClick={() => onUnitChange(u)}
                className={`px-3 py-1 uppercase text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                  unit === u
                    ? 'bg-black/10 dark:bg-white/20 text-[var(--p-text)] border border-[var(--p-border)] shadow-sm'
                    : 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
                }`}
              >
                {u === 'luong' ? 'Lượng' : u === 'chi' ? 'Chỉ' : 'Kg'}
              </button>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
