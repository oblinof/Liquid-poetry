import React, { useState } from 'react';
import { OnChainConfig } from '../types/generative';
import { audioSynth } from '../services/audioSynth';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Dice5, 
  ShieldCheck, 
  Waves, 
  Layers, 
  Radio 
} from 'lucide-react';

interface HeaderProps {
  onChainConfig: OnChainConfig;
  onRerollSeed: () => void;
  onOpenMintModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onChainConfig,
  onRerollSeed,
  onOpenMintModal,
}) => {
  const [isAudioActive, setIsAudioActive] = useState(false);

  const handleToggleAudio = () => {
    const unmuted = audioSynth.toggleMute();
    setIsAudioActive(unmuted);
  };

  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-white/20">
              <Waves className="w-5 h-5 animate-pulse text-cyan-200" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-cinzel tracking-wider text-white flex items-center gap-2">
                POESÍA ON-CHAIN
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-normal">
                  111 CARACTERES
                </span>
              </h1>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Generador Algorítmico Marino • Marea de Floripa • AMM Liquidity Oracle
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all border ${
              isAudioActive
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={isAudioActive ? 'Silenciar sintetizador de marea' : 'Activar sintetizador ambiental de marea y notas'}
          >
            {isAudioActive ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">
              {isAudioActive ? 'Audio ON' : 'Audio OFF'}
            </span>
            {isAudioActive && (
              <span className="flex gap-0.5 items-end h-3">
                <span className="w-0.5 h-3 bg-cyan-400 animate-pulse" />
                <span className="w-0.5 h-2 bg-cyan-400 animate-pulse delay-75" />
              </span>
            )}
          </button>

          {/* Re-roll Seed */}
          <button
            onClick={onRerollSeed}
            className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors"
            title="Generar nuevo Hash de transacción y semilla criptográfica"
          >
            <Dice5 className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Nueva Semilla</span>
          </button>

          {/* Mint Artifact Modal Button */}
          <button
            onClick={onOpenMintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-semibold rounded-xl text-xs font-mono transition-all shadow-md shadow-cyan-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mintear</span>
          </button>
        </div>
      </div>
    </header>
  );
};
