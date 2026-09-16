import React, { useState } from 'react';
import type { BullionMatrixData, DealerInfo, GoldDealerKey, SilverDealerKey, UnitMode, ViewMode } from '../types/commodity';
import { convertVnPrice } from '../services/marketData';
import { Sparkles, MapPin, CheckCircle2 } from 'lucide-react';

interface BranchMatrixProps {
  matrix: BullionMatrixData | null;
  unit: UnitMode;
  viewMode: ViewMode;
  selectedGoldDealer: GoldDealerKey;
  onSelectGoldDealer: (key: GoldDealerKey) => void;
  selectedSilverDealer: SilverDealerKey;
  onSelectSilverDealer: (key: SilverDealerKey) => void;
}

export const BranchMatrix: React.FC<BranchMatrixProps> = ({
  matrix,
  unit,
  viewMode,
  selectedGoldDealer,
  onSelectGoldDealer,
  selectedSilverDealer,
  onSelectSilverDealer,
}) => {
  const [activeTab, setActiveTab] = useState<'gold' | 'silver'>('gold');

  if (!matrix) return null;

  const unitLabel = unit === 'luong' ? 'lượng' : unit === 'chi' ? 'chỉ' : 'kg';
  const isLuong = unit === 'luong';

  const goldList = Object.values(matrix.dealers) as DealerInfo[];
  const silverList = Object.values(matrix.silverDealers) as DealerInfo[];

  // Solo tabs show only that commodity's dealers. Stacked shows both.
  const goldOnly = viewMode === 'gold';
  const silverOnly = viewMode === 'silver';
  const showGold = !silverOnly && (goldOnly || activeTab === 'gold');
  const showSilver = !goldOnly && (silverOnly || activeTab === 'silver');

  return (
    <div className="vault-shell">
      <div className="vault-core p-4 flex flex-col gap-3 font-sans">
        
        {/* Matrix Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[var(--p-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-[var(--p-gold)]/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--p-gold)]" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-[var(--p-text)] tracking-wide uppercase">
                {goldOnly
                  ? `GOLD DEALERS (${unitLabel.toUpperCase()})`
                  : silverOnly
                    ? `SILVER DEALERS (${unitLabel.toUpperCase()})`
                    : `DOMESTIC ARBITRAGE MATRIX (${unitLabel.toUpperCase()})`}
              </span>
              <span className="text-xs text-[var(--p-muted)] hidden lg:inline font-mono">
                • Click any dealer to project live quotes onto charts
              </span>
            </div>
          </div>

          {/* Commodity Pill Switcher - hidden when a sole commodity is active */}
          {!goldOnly && !silverOnly && (
            <div className="flex items-center gap-1.5 bg-black/10 dark:bg-black/50 border border-[var(--p-border)] p-1 rounded-full text-xs self-start sm:self-auto shadow-inner font-sans">
              <button
                onClick={() => setActiveTab('gold')}
                className={`px-3.5 py-1 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                  activeTab === 'gold'
                    ? 'bg-[var(--p-gold)]/20 text-[var(--p-gold)] border border-[var(--p-gold)]/50 shadow-sm'
                    : 'text-[var(--p-muted)] hover:text-[var(--p-text)]'
                }`}
              >
                🟡 Vàng ({goldList.length} Nhà Đài)
              </button>
              <button
                onClick={() => setActiveTab('silver')}
                className={`px-3.5 py-1 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                  activeTab === 'silver'
                    ? 'bg-slate-400/20 text-[var(--p-text)] border border-slate-400/50 shadow-sm'
                    : 'text-[var(--p-muted)] hover:text-[var(--p-text)]'
                }`}
              >
                ⚪ Bạc ({silverList.length} Nhà Đài)
              </button>
            </div>
          )}
        </div>

        {/* Gold Dealers Bento Strip */}
        {showGold && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {goldList.map((d) => {
              const isSelected = selectedGoldDealer === d.id;
              const buyConverted = convertVnPrice(d.buy, unit);
              const sellConverted = convertVnPrice(d.sell, unit);
              const spreadConverted = convertVnPrice(d.spread, unit);

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectGoldDealer(d.id as GoldDealerKey)}
                  className={`rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between relative group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[var(--p-card)] border-2 border-[var(--p-gold)] shadow-xl ring-1 ring-amber-500/20'
                      : 'bg-[var(--p-surface)] border border-[var(--p-border)] hover:border-[var(--p-gold)]/50'
                  }`}
                >
                  {/* Active Pin Badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-[var(--p-gold)] bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      <CheckCircle2 className="w-3 h-3 text-[var(--p-gold)]" />
                      <span>ON CHART</span>
                    </div>
                  )}

                  {/* Header */}
                  <div>
                    <div className="text-sm font-bold text-[var(--p-text)] flex items-center gap-1.5">
                      <span className="truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--p-muted)] mt-1 font-mono">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{d.city}</span>
                    </div>
                    <div className="text-xs text-amber-400 truncate mt-1 font-semibold">
                      {d.badge}
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="mt-3 pt-2 border-t border-[var(--p-border)] space-y-1 font-mono">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[var(--p-muted)] text-xs">Mua:</span>
                      <span className="font-bold text-sm text-[var(--p-text)] tabular-nums">
                        {(buyConverted / (isLuong ? 1000000 : 100000)).toFixed(isLuong ? 2 : 1)}{isLuong ? 'M' : 'tr'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[var(--p-muted)] text-xs">Bán:</span>
                      <span className="font-bold text-sm text-[var(--p-gold)] tabular-nums">
                        {(sellConverted / (isLuong ? 1000000 : 100000)).toFixed(isLuong ? 2 : 1)}{isLuong ? 'M' : 'tr'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs text-[var(--p-muted)] pt-1 border-t border-[var(--p-border)]/60">
                      <span>Spread:</span>
                      <span className={`font-bold tabular-nums ${d.spread <= 2000000 ? 'text-emerald-500' : 'text-[var(--p-text)]'}`}>
                        {(spreadConverted / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Shanghai Gold Exchange (SGE) Benchmark Ribbon */}
        {showGold && matrix.sge && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-black/10 dark:bg-black/40 border border-[var(--p-border)] text-xs font-mono">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30">
                SGE {matrix.sge.contract}
              </span>
              <span className="text-[var(--p-text)] font-semibold text-xs">
                Thượng Hải: <span className="text-amber-400 font-bold">¥{matrix.sge.priceCnyPerGram.toFixed(2)}/g</span>
              </span>
              <span className="text-[var(--p-muted)] hidden md:inline text-xs">
                (Quy đổi: <span className="text-[var(--p-text)] font-medium">${matrix.sge.sgeUsdPerOz.toFixed(2)}/oz</span> @ USD/CNY {matrix.sge.usdCnyRate})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--p-muted)] text-xs">Shanghai Premium:</span>
              <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                matrix.sge.spreadUsd >= 0
                  ? 'text-emerald-500 bg-emerald-500/15 border border-emerald-500/30'
                  : 'text-rose-500 bg-rose-500/15 border border-rose-500/30'
              }`}>
                {matrix.sge.spreadUsd >= 0 ? '+' : ''}${matrix.sge.spreadUsd.toFixed(2)}/oz ({matrix.sge.spreadUsd >= 0 ? '+' : ''}{matrix.sge.premiumPercent}%)
              </span>
              <span className="text-[var(--p-muted)] text-xs hidden lg:inline">
                • {matrix.sge.updated}
              </span>
            </div>
          </div>
        )}


        {/* Silver Dealers Bento Strip */}
        {showSilver && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            {silverList.map((d) => {
              const isSelected = selectedSilverDealer === d.id;
              const buyConverted = convertVnPrice(d.buy, unit);
              const sellConverted = convertVnPrice(d.sell, unit);
              const spreadConverted = convertVnPrice(d.spread, unit);

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectSilverDealer(d.id as SilverDealerKey)}
                  className={`rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between relative group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[var(--p-card)] border-2 border-[var(--p-silver)] shadow-xl ring-1 ring-cyan-500/20'
                      : 'bg-[var(--p-surface)] border border-[var(--p-border)] hover:border-[var(--p-silver)]/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-[var(--p-text)] bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      <span>ON CHART</span>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-bold text-[var(--p-text)] flex items-center gap-1.5">
                      <span>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--p-muted)] mt-1 font-mono">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{d.city}</span>
                    </div>
                    <div className="text-xs text-[var(--p-silver)] mt-1 font-semibold">
                      {d.productName}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[var(--p-border)] space-y-1 font-mono">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[var(--p-muted)] text-xs">Mua vào:</span>
                      <span className="font-bold text-sm text-[var(--p-text)] tabular-nums">
                        {buyConverted.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[var(--p-muted)] text-xs">Bán ra:</span>
                      <span className="font-bold text-sm text-[var(--p-silver)] tabular-nums">
                        {sellConverted.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs text-[var(--p-muted)] pt-1 border-t border-[var(--p-border)]/60">
                      <span>Spread:</span>
                      <span className="text-emerald-500 font-bold tabular-nums">
                        {(spreadConverted / 1000).toFixed(0)}K ₫
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
