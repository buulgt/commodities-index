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
      <div className="vault-core p-3 flex flex-col gap-2.5 font-mono">
        
        {/* Matrix Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--p-border)] pb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-400/10 border border-[var(--p-gold)]/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[var(--p-gold)]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--p-text)] tracking-wide uppercase font-sans">
                {goldOnly
                  ? `GOLD DEALERS (${unitLabel.toUpperCase()})`
                  : silverOnly
                    ? `SILVER DEALERS (${unitLabel.toUpperCase()})`
                    : `DOMESTIC ARBITRAGE MATRIX (${unitLabel.toUpperCase()})`}
              </span>
              <span className="text-[10px] text-[var(--p-muted)] hidden lg:inline font-mono">
                • Click to project live quotes onto charts
              </span>
            </div>
          </div>

          {/* Commodity Pill Switcher - hidden when a sole commodity is active */}
          {!goldOnly && !silverOnly && (
            <div className="flex items-center gap-1 bg-black/10 dark:bg-black/40 border border-[var(--p-border)] p-0.5 rounded-full text-[11px] self-start sm:self-auto shadow-inner">
              <button
                onClick={() => setActiveTab('gold')}
                className={`px-3 py-0.5 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                  activeTab === 'gold'
                    ? 'bg-[var(--p-gold)]/20 text-[var(--p-gold)] border border-[var(--p-gold)]/40 shadow-sm'
                    : 'text-[var(--p-muted)] hover:text-[var(--p-text)]'
                }`}
              >
                🟡 Vàng ({goldList.length} Nhà Đài)
              </button>
              <button
                onClick={() => setActiveTab('silver')}
                className={`px-3 py-0.5 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                  activeTab === 'silver'
                    ? 'bg-[var(--p-silver)]/20 text-[var(--p-text)] border border-[var(--p-silver)]/40 shadow-sm'
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
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
            {goldList.map((d) => {
              const isSelected = selectedGoldDealer === d.id;
              const buyConverted = convertVnPrice(d.buy, unit);
              const sellConverted = convertVnPrice(d.sell, unit);
              const spreadConverted = convertVnPrice(d.spread, unit);

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectGoldDealer(d.id as GoldDealerKey)}
                  className={`rounded-xl p-2.5 transition-all cursor-pointer flex flex-col justify-between relative group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[var(--p-card)] border-2 border-[var(--p-gold)] shadow-md'
                      : 'bg-[var(--p-surface)] border border-[var(--p-border)] hover:border-[var(--p-gold)]/50'
                  }`}
                >
                  {/* Active Pin Badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[8px] font-bold text-[var(--p-gold)] bg-[var(--p-gold)]/15 px-1.5 py-0.2 rounded-full border border-[var(--p-gold)]/30">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[var(--p-gold)]" />
                      <span>ON CHART</span>
                    </div>
                  )}

                  {/* Header */}
                  <div>
                    <div className="text-[11px] font-bold text-[var(--p-text)] flex items-center gap-1">
                      <span className="truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-[var(--p-muted)] mt-0.5">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{d.city}</span>
                    </div>
                    <div className="text-[9px] text-[var(--p-gold)] truncate mt-0.5 font-semibold">
                      {d.badge}
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="mt-2 pt-1.5 border-t border-[var(--p-border)] space-y-0.5">
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-[var(--p-muted)] text-[10px]">Mua:</span>
                      <span className="font-bold text-[var(--p-text)]">
                        {(buyConverted / (isLuong ? 1000000 : 100000)).toFixed(isLuong ? 2 : 1)}{isLuong ? 'M' : 'tr'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-[var(--p-muted)] text-[10px]">Bán:</span>
                      <span className="font-bold text-[var(--p-gold)]">
                        {(sellConverted / (isLuong ? 1000000 : 100000)).toFixed(isLuong ? 2 : 1)}{isLuong ? 'M' : 'tr'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[9px] text-[var(--p-muted)] pt-0.5 border-t border-[var(--p-border)]/50">
                      <span>Spread:</span>
                      <span className={d.spread <= 2000000 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[var(--p-text)]'}>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-black/5 dark:bg-black/30 border border-[var(--p-border)] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-md font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20">
                SGE {matrix.sge.contract}
              </span>
              <span className="text-[var(--p-text)] font-semibold">
                Thượng Hải: ¥{matrix.sge.priceCnyPerGram.toFixed(2)}/g
              </span>
              <span className="text-[var(--p-muted)] hidden md:inline">
                (Quy đổi: ${matrix.sge.sgeUsdPerOz.toFixed(2)}/oz @ USD/CNY {matrix.sge.usdCnyRate})
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[var(--p-muted)]">Shanghai Premium:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded-md ${
                matrix.sge.spreadUsd >= 0
                  ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-rose-500 bg-rose-500/10 border border-rose-500/20'
              }`}>
                {matrix.sge.spreadUsd >= 0 ? '+' : ''}${matrix.sge.spreadUsd.toFixed(2)}/oz ({matrix.sge.spreadUsd >= 0 ? '+' : ''}{matrix.sge.premiumPercent}%)
              </span>
              <span className="text-[var(--p-muted)] text-[9px] hidden lg:inline">
                • {matrix.sge.updated}
              </span>
            </div>
          </div>
        )}

        {/* Silver Dealers Bento Strip */}
        {showSilver && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {silverList.map((d) => {
              const isSelected = selectedSilverDealer === d.id;
              const buyConverted = convertVnPrice(d.buy, unit);
              const sellConverted = convertVnPrice(d.sell, unit);
              const spreadConverted = convertVnPrice(d.spread, unit);

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectSilverDealer(d.id as SilverDealerKey)}
                  className={`rounded-xl p-2.5 transition-all cursor-pointer flex flex-col justify-between relative group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[var(--p-card)] border-2 border-[var(--p-silver)] shadow-md'
                      : 'bg-[var(--p-surface)] border border-[var(--p-border)] hover:border-[var(--p-silver)]/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[8px] font-bold text-[var(--p-text)] bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded-full border border-[var(--p-border)]">
                      <CheckCircle2 className="w-2.5 h-2.5 text-cyan-500" />
                      <span>ON CHART</span>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold text-[var(--p-text)] flex items-center gap-1">
                      <span>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-[var(--p-muted)] mt-0.5">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span>{d.city}</span>
                    </div>
                    <div className="text-[9px] text-[var(--p-silver)] mt-0.5 font-medium">
                      {d.productName}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-[var(--p-border)] space-y-0.5">
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-[var(--p-muted)] text-[10px]">Mua vào:</span>
                      <span className="font-bold text-[var(--p-text)]">
                        {buyConverted.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-[var(--p-muted)] text-[10px]">Bán ra:</span>
                      <span className="font-bold text-[var(--p-silver)]">
                        {sellConverted.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[9px] text-[var(--p-muted)] pt-0.5 border-t border-[var(--p-border)]/50">
                      <span>Spread:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
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
