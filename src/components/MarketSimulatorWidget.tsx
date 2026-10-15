import React from 'react';
import { MarketData } from '../types/generative';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Fuel, 
  Zap, 
  Cpu, 
  ShieldAlert, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

interface MarketSimulatorWidgetProps {
  marketData: MarketData;
  onTriggerShock: (type: 'WHALE_BUY' | 'WHALE_SELL' | 'TIDAL_SURGE' | 'FLASH_CRASH') => void;
}

export const MarketSimulatorWidget: React.FC<MarketSimulatorWidgetProps> = ({
  marketData,
  onTriggerShock,
}) => {
  const isPositive = marketData.priceChange24h >= 0;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative amber glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Simulador de Liquidez AMM
              </h3>
              <p className="text-[11px] font-mono text-amber-300/80">
                Piscina On-Chain: {marketData.pair}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border bg-amber-500/10 border-amber-500/30 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            SIMULADO ON-CHAIN
          </span>
        </div>

        {/* Primary AMM Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
          {/* Price */}
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" />
              <span>PRECIO TOKEN</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white">
                ${marketData.priceUsd.toFixed(2)}
              </span>
            </div>
            <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%</span>
            </div>
          </div>

          {/* TVL */}
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>LIQUIDEZ (TVL)</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-300">
                ${(marketData.liquidityTvlUsd / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Profundidad: {(marketData.depthRatio * 100).toFixed(0)}%
            </div>
          </div>

          {/* Volatility Index */}
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-rose-400" />
              <span>VOLATILIDAD</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-rose-300">
                {marketData.volatilityIndex.toFixed(0)}%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Reactivo a oleaje
            </div>
          </div>

          {/* Gas Gwei */}
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Fuel className="w-3 h-3 text-emerald-400" />
              <span>GAS GWEI</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-300">
                {marketData.gasGwei}
              </span>
              <span className="text-xs text-slate-400 font-mono">gwei</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Slippage: {marketData.slippagePercent}%
            </div>
          </div>
        </div>

        {/* Live Mempool Stream */}
        <div className="mt-2 p-2.5 bg-black/50 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              MEMPOOL EN TIEMPO REAL:
            </span>
            <span className="text-slate-500">Últimos swaps</span>
          </div>

          <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
            {marketData.mempoolTxs.slice(0, 4).map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between text-[11px] font-mono py-1 px-1.5 rounded bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'SWAP_BUY' ? 'bg-emerald-400' : tx.type === 'SWAP_SELL' ? 'bg-rose-400' : 'bg-cyan-400'}`} />
                  <span className="text-slate-300 truncate">{tx.amount}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
                  <span>{tx.sender}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Shock Buttons */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => onTriggerShock('WHALE_BUY')}
            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-lg text-[10px] font-mono transition-all"
          >
            + Inyección Ballena
          </button>
          <button
            onClick={() => onTriggerShock('TIDAL_SURGE')}
            className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded-lg text-[10px] font-mono transition-all"
          >
            ≈ Inundación de Marea
          </button>
          <button
            onClick={() => onTriggerShock('WHALE_SELL')}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-mono transition-all"
          >
            - Venta Masiva
          </button>
          <button
            onClick={() => onTriggerShock('FLASH_CRASH')}
            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-lg text-[10px] font-mono transition-all"
          >
            ! Flash Crash
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-white/5 mt-2">
        <span>Motor AMM: Uniswap v3 & Curve Estocástico</span>
        <span className="text-amber-400/80">Reacción a Marea: Activa</span>
      </div>
    </div>
  );
};
