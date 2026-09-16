import React from 'react';
import { RefreshCw, Layers, Scale, Zap, Sun, Moon, Globe } from 'lucide-react';
import type { CommoditySummary, SgeBenchmarkInfo } from '../types/commodity';
import { calculateSjcPremium } from '../services/marketData';

interface VaultHeaderProps {
  gold: CommoditySummary | null;
  silver: CommoditySummary | null;
  sge?: SgeBenchmarkInfo | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
  onSelectSge?: () => void;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  gold,
  silver,
  isRefreshing,
  sge,
  onRefresh,
  themeMode,
  onToggleTheme,
  onSelectSge,
}) => {
  const usdRate = gold?.currencyRate ?? 25850;

  const sjcMarkup = gold
    ? calculateSjcPremium(gold.worldPrice, usdRate, gold.vnSellPrice)
    : null;

  const gsr = gold && silver && silver.worldPrice > 0
    ? (gold.worldPrice / silver.worldPrice).toFixed(1)
    : '67.9';
  const gsrNum = parseFloat(gsr);

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 pt-2.5">
      <header className="max-w-[1760px] mx-auto rounded-[2rem] bg-[var(--p-surface)] border border-[var(--p-border)] backdrop-blur-2xl shadow-xl px-4 sm:px-6 py-2.5 transition-all">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-[var(--p-gold)]/40 flex items-center justify-center shadow-sm">
                <Layers className="w-4 h-4 text-[var(--p-gold)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-widest text-[var(--p-text)] uppercase font-sans">
                    THE VAULT
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[var(--p-gold)] border border-[var(--p-border)]">
                    BULLION
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--p-muted)] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span className="text-emerald-500 font-semibold tracking-wide">LIVE</span>
                  <span>•</span>
                  <span>{gold?.lastUpdated ? gold.lastUpdated.replace('(SJC Official)', '').replace('(BTMH Live)', '') : '--:--'}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">USD/VND: {usdRate.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>

            {/* Mobile Actions (Theme & Sync) */}
            <div className="flex items-center gap-1.5 xl:hidden">
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold text-[var(--p-text)] bg-black/5 hover:bg-black/10 active:scale-[0.98] border border-[var(--p-border)] rounded-full transition-all cursor-pointer"
              >
                {themeMode === 'dark' ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-amber-700" />}
                <span>{themeMode === 'dark' ? 'LIGHT' : 'DARK'}</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-[10px] font-mono font-bold tracking-wider text-[var(--p-text)] bg-black/5 hover:bg-black/10 active:scale-[0.98] border border-[var(--p-border)] rounded-full transition-all cursor-pointer disabled:opacity-50"
              >
                <span>SYNC</span>
                <div className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center">
                  <RefreshCw className={`w-2 h-2 text-[var(--p-gold)] ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
              </button>
            </div>
          </div>
          {/* Center & Right: World spot readout (no branch prices here) */}
          {gold && silver ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 flex-1 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--p-gold)]" />
                <span className="text-[var(--p-muted)]">Vàng TG</span>
                <span className="font-bold text-[var(--p-text)]">
                  ${gold.worldPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[var(--p-muted)]">/oz</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--p-silver)]" />
                <span className="text-[var(--p-muted)]">Bạc TG</span>
                <span className="font-bold text-[var(--p-text)]">
                  ${silver.worldPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-[var(--p-muted)]">/oz</span>
              </div>

              {sjcMarkup && (
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-[var(--p-gold)]" />
                  <span className="text-[var(--p-muted)]">Chênh SJC</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{sjcMarkup.percent}%
                  </span>
                </div>
              )}

              {sge && (
                <button
                  onClick={onSelectSge}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-amber-500/10 active:scale-[0.98] border border-transparent hover:border-amber-500/30 transition-all cursor-pointer text-left"
                  title={`Xem biểu đồ Shanghai Au99.99 (Click để mở biểu đồ chi tiết)`}
                >
                  <Globe className="w-3 h-3 text-amber-500" />
                  <span className="text-[var(--p-muted)]">SGE Premium:</span>
                  <span className={`font-bold ${sge.spreadUsd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {sge.spreadUsd >= 0 ? '+' : ''}${sge.spreadUsd.toFixed(1)}/oz ({sge.spreadUsd >= 0 ? '+' : ''}{sge.premiumPercent}%)
                  </span>
                </button>
              )}

              <div className="flex items-center gap-1.5">
                <Scale className="w-3 h-3 text-[var(--p-silver)]" />
                <span className="text-[var(--p-muted)]">GSR</span>
                <span className="font-bold text-[var(--p-text)]">{gsr}x</span>
                <span className="text-[10px] text-[var(--p-muted)]">
                  {gsrNum > 75 ? 'Bạc rẻ' : gsrNum < 55 ? 'Vàng rẻ' : 'Cân bằng'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-8 bg-black/5 dark:bg-white/[0.02] border border-[var(--p-border)] animate-pulse rounded-full flex-1 max-w-3xl" />
          )}

          {/* Desktop Actions (Theme Toggle & Sync Button) */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-mono font-bold tracking-wider text-[var(--p-text)] bg-black/5 hover:bg-black/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] active:scale-[0.98] border border-[var(--p-border)] rounded-full transition-all cursor-pointer"
              title={themeMode === 'dark' ? 'Chuyển sang giao diện Sáng (FT Warm Parchment)' : 'Chuyển sang giao diện Tối (Nordic Navy)'}
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>LIGHT MODE</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-800" />
                  <span>DARK MODE</span>
                </>
              )}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="group flex items-center gap-2.5 pl-3.5 pr-2 py-1.5 text-[11px] font-mono font-bold tracking-wider text-[var(--p-text)] bg-black/5 hover:bg-black/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] active:scale-[0.98] border border-[var(--p-border)] rounded-full transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span>{isRefreshing ? 'SYNCING...' : 'SYNC FEED'}</span>
              <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 group-hover:scale-105 flex items-center justify-center transition-all">
                <RefreshCw className={`w-3 h-3 text-[var(--p-gold)] ${isRefreshing ? 'animate-spin' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};
