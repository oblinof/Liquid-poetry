import React from 'react';
import { MarineData } from '../types/generative';
import { Waves, Droplets, RefreshCw, Compass, Activity, Wind } from 'lucide-react';

interface MarineOracleWidgetProps {
  marineData: MarineData;
  isLoading: boolean;
  onRefresh: () => void;
}

export const MarineOracleWidget: React.FC<MarineOracleWidgetProps> = ({
  marineData,
  isLoading,
  onRefresh,
}) => {
  const getCompassDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden flex flex-col justify-between">
      {/* Background aquatic subtle glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Oráculo Marino: Marea Viva
              </h3>
              <p className="text-[11px] font-mono text-cyan-300/80">
                {marineData.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <span className={`w-1.5 h-1.5 rounded-full ${marineData.isLive ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              {marineData.isLive ? 'API EN VIVO' : 'SINCRONIZADO'}
            </span>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Actualizar telemetría marina"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Natural Ocean Metrics (Uneditable nature) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5">
          <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Waves className="w-3 h-3 text-cyan-400" />
              <span>ALTURA</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-300">
                {marineData.waveHeight}
              </span>
              <span className="text-xs text-slate-400">m</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Swell: {marineData.swellWaveHeight}m
            </div>
          </div>

          <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>PERÍODO</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-300">
                {marineData.wavePeriod}
              </span>
              <span className="text-xs text-slate-400">s</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Ritmo de respiración
            </div>
          </div>

          <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>DIRECCIÓN</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-300">
                {marineData.waveDirection}°
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {getCompassDirection(marineData.waveDirection)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Vector de deriva
            </div>
          </div>

          <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-purple-400" />
              <span>MAREA LUNAR</span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-bold font-mono text-purple-300 capitalize">
                {marineData.tidePhase}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Nivel: {marineData.tideLevel > 0 ? `+${marineData.tideLevel}` : marineData.tideLevel}
            </div>
          </div>
        </div>

        {/* Lunar cycle status */}
        <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Ciclo Lunar:</span>
            <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full"
                style={{ width: `${Math.round(((marineData.tideLevel + 1) / 2) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            Viento: {marineData.windSpeed} km/h • Agua: {marineData.waterTemp}°C
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-white/5 mt-2">
        <span>Naturaleza soberana de Florianópolis</span>
        <span className="text-cyan-400/80">Open-Meteo Marine API</span>
      </div>
    </div>
  );
};
