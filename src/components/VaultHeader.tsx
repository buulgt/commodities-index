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
      <header className="max-w-[1760px] mx-auto rounded-2xl bg-[var(--p-surface)] border border-[var(--p-border)] backdrop-blur-2xl shadow-xl px-4 sm:px-6 py-3 transition-all">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3.5">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-[var(--p-gold)]/40 flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5 text-[var(--p-gold)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-wider text-[var(--p-text)] uppercase font-sans">
                    THE VAULT
                  </span>
                  <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-[var(--p-gold)] border border-amber-500/30">
                    BULLION TERMINAL
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--p-muted)] font-mono mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-emerald-500 font-bold tracking-wide">LIVE</span>
                  <span>•</span>
                  <span>{gold?.lastUpdated ? gold.lastUpdated.replace('(SJC Official)', '').replace('(BTMH Live)', '') : '--:--'}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline font-semibold text-[var(--p-text)]">USD/VND: {usdRate.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>

            {/* Mobile Actions (Theme & Sync) */}
            <div className="flex items-center gap-2 xl:hidden">
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[var(--p-text)] bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.98] border border-[var(--p-border)] rounded-full transition-all cursor-pointer"
              >
                {themeMode === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-amber-700" />}
                <span>{themeMode === 'dark' ? 'LIGHT' : 'DARK'}</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="group flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-[var(--p-text)] bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.98] border border-[var(--p-border)] rounded-full transition-all cursor-pointer disabled:opacity-50"
              >
                <span>SYNC</span>
                <RefreshCw className={`w-3.5 h-3.5 text-[var(--p-gold)] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          {/* Center & Right: World spot readout (no branch prices here) */}
          {gold && silver ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 font-mono text-xs">
              
              {/* World Gold Spot */}
              <div className="flex items-center gap-2 bg-black/10 dark:bg-black/30 border border-[var(--p-border)] px-3 py-1.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--p-gold)] shrink-0" />
                <span className="text-[var(--p-muted)] text-xs">Vàng TG:</span>
                <span className="font-bold text-sm text-[var(--p-text)] tabular-nums">
                  ${gold.worldPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-[var(--p-muted)]">/oz</span>
              </div>

              {/* World Silver Spot */}
              <div className="flex items-center gap-2 bg-black/10 dark:bg-black/30 border border-[var(--p-border)] px-3 py-1.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--p-silver)] shrink-0" />
                <span className="text-[var(--p-muted)] text-xs">Bạc TG:</span>
                <span className="font-bold text-sm text-[var(--p-text)] tabular-nums">
                  ${silver.worldPrice.toFixed(2)}
                </span>
                <span className="text-[11px] text-[var(--p-muted)]">/oz</span>
              </div>

              {/* SJC Markup */}
              {sjcMarkup && (
                <div className="flex items-center gap-2 bg-black/10 dark:bg-black/30 border border-[var(--p-border)] px-3 py-1.5 rounded-xl">
                  <Zap className="w-3.5 h-3.5 text-[var(--p-gold)] shrink-0" />
                  <span className="text-[var(--p-muted)] text-xs">Chênh SJC:</span>
                  <span className="font-bold text-sm text-emerald-500 tabular-nums">
                    +{sjcMarkup.percent}%
                  </span>
                </div>
              )}

              {/* SGE Shanghai Premium (Interactive Button) */}
              {sge && (
                <button
                  onClick={onSelectSge}
                  className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-[0.98] group"
                  title="Click to view 10-Year Shanghai Gold Premium Chart"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[var(--p-muted)] text-xs">SGE Premium:</span>
                  <span className={`font-bold text-sm tabular-nums ${sge.spreadUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {sge.spreadUsd >= 0 ? '+' : ''}${sge.spreadUsd.toFixed(1)}/oz ({sge.spreadUsd >= 0 ? '+' : ''}{sge.premiumPercent}%)
                  </span>
                </button>
              )}

              {/* Gold/Silver Ratio */}
              <div className="flex items-center gap-2 bg-black/10 dark:bg-black/30 border border-[var(--p-border)] px-3 py-1.5 rounded-xl">
                <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[var(--p-muted)] text-xs">GSR:</span>
                <span className="font-bold text-sm text-[var(--p-text)] tabular-nums">{gsr}x</span>
                <span className="text-xs font-semibold text-cyan-400">
                  ({gsrNum > 75 ? 'Bạc rẻ' : gsrNum < 55 ? 'Vàng rẻ' : 'Cân bằng'})
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
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider text-[var(--p-text)] bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.98] border border-[var(--p-border)] rounded-full transition-all cursor-pointer"
              title={themeMode === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>LIGHT MODE</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-700" />
                  <span>DARK MODE</span>
                </>
              )}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="group flex items-center gap-2.5 px-4 py-2 text-xs font-mono font-bold tracking-wider text-[var(--p-text)] bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] border border-amber-500/30 rounded-full transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
            >
              <span>{isRefreshing ? 'SYNCING...' : 'SYNC FEED'}</span>
              <RefreshCw className={`w-3.5 h-3.5 text-[var(--p-gold)] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};
