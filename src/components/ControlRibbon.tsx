import React from 'react';
import type { Timeframe, ViewMode, UnitMode } from '../types/commodity';
import { Rows2, Scale, Clock, Globe } from 'lucide-react';

interface ControlRibbonProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  unit: UnitMode;
  onUnitChange: (unit: UnitMode) => void;
}

export const ControlRibbon: React.FC<ControlRibbonProps> = ({
  viewMode,
  onViewModeChange,
  timeframe,
  onTimeframeChange,
  unit,
  onUnitChange,
}) => {
  const timeframes: Timeframe[] = ['5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'ALL'];

  return (
    <div className="vault-shell">
      <div className="vault-core px-4 py-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 font-sans">
        
        {/* 1. View Mode Segmented Island */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-[var(--p-border)] p-1.5 rounded-2xl overflow-x-auto shadow-sm">
          <button
            onClick={() => onViewModeChange('stacked')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'stacked'
                ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-900 dark:text-[var(--p-gold)] border border-amber-500/60 shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-[var(--p-muted)] hover:text-slate-950 dark:hover:text-[var(--p-text)] hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Rows2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Stacked Deck</span>
          </button>

          <button
            onClick={() => onViewModeChange('gold')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'gold'
                ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-900 dark:text-[var(--p-gold)] border border-amber-500/60 shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-[var(--p-muted)] hover:text-slate-950 dark:hover:text-[var(--p-text)] hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Gold Solo</span>
          </button>

          <button
            onClick={() => onViewModeChange('silver')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'silver'
                ? 'bg-slate-200 dark:bg-slate-400/25 text-slate-950 dark:text-[var(--p-text)] border border-slate-400/60 shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-[var(--p-muted)] hover:text-slate-950 dark:hover:text-[var(--p-text)] hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-300" />
            <span>Silver Solo</span>
          </button>

          <button
            onClick={() => onViewModeChange('ratio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'ratio'
                ? 'bg-cyan-100 dark:bg-cyan-500/25 text-cyan-900 dark:text-cyan-400 border border-cyan-500/60 shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-[var(--p-muted)] hover:text-slate-950 dark:hover:text-[var(--p-text)] hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>GSR Ratio</span>
          </button>

          <button
            onClick={() => onViewModeChange('sge')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              viewMode === 'sge'
                ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-400 border border-emerald-500/60 shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-[var(--p-muted)] hover:text-slate-950 dark:hover:text-[var(--p-text)] hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
            <span>SGE Premium</span>
          </button>
        </div>

        {/* Right Controls: Timeframe & Unit Segmented Groups */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto flex-wrap">
          
          {/* Timeframe Island */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-[var(--p-border)] p-1.5 rounded-2xl shadow-sm font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-[var(--p-muted)] ml-1.5 mr-0.5" />
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                  timeframe === tf
                    ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-900 dark:text-[var(--p-gold)] border border-amber-500/60 shadow-sm font-extrabold'
                    : 'text-slate-600 dark:text-[var(--p-muted)] hover:text-slate-950 dark:hover:text-[var(--p-text)] hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Unit Island */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-[var(--p-border)] p-1.5 rounded-2xl text-xs font-mono shadow-sm">
            {(['luong', 'chi', 'kg'] as UnitMode[]).map((u) => (
              <button
                key={u}
                onClick={() => onUnitChange(u)}
                className={`px-3 py-1 uppercase text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                  unit === u
                    ? 'bg-white dark:bg-white/20 text-slate-950 dark:text-[var(--p-text)] border border-slate-300 dark:border-[var(--p-border)] shadow-sm font-black'
                    : 'text-slate-600 dark:text-[var(--p-muted)] hover:text-slate-950 dark:hover:text-[var(--p-text)] hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
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
