import React, { useState } from 'react';
import { PoetryAnalysis } from '../types/generative';
import { HydraSynthesizerState, CharacterHydraOperator } from '../services/hourlyEngine';
import { X, Zap, Radio } from 'lucide-react';

interface CharacterInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  poetryAnalysis: PoetryAnalysis;
  hydraState: HydraSynthesizerState;
}

export const CharacterInspectorModal: React.FC<CharacterInspectorModalProps> = ({
  isOpen,
  onClose,
  poetryAnalysis: _poetryAnalysis,
  hydraState,
}) => {
  const [selectedChar, setSelectedChar] = useState<string>('a');

  if (!isOpen) return null;

  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const currentRule: CharacterHydraOperator | undefined = hydraState.rulesMap[selectedChar];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-sans tracking-tight">
                  Hourly Visual Operators #{hydraState.epochHour % 24}:00 UTC
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Mutates in {hydraState.timeRemainingMinutes}m
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Every letter and number acts as a live video synthesis function without rendering characters directly on screen.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-200">
          {/* Active Synthesis Summary */}
          <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">DOMINANT OPERATOR IN YOUR POEM:</div>
              <div className="text-base font-bold text-cyan-300 mt-0.5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>{hydraState.dominantLabel}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 max-w-sm">
              Active Kaleidoscope: <strong className="text-white">{hydraState.kaleidSides > 0 ? `${hydraState.kaleidSides}x sides` : 'Continuous'}</strong> • Osc frequency: <strong className="text-white">{hydraState.oscFreq.toFixed(1)}</strong>
            </div>
          </div>

          {/* Character selector grid (A-Z, 0-9) */}
          <div>
            <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
              <span>INSPECT THE HOURLY OPERATOR FOR EACH CHARACTER:</span>
              <span className="text-cyan-400">Click to preview</span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1.5 p-3 bg-black/60 border border-white/10 rounded-2xl max-h-48 overflow-y-auto">
              {alphabet.map((ch) => {
                const rule = hydraState.rulesMap[ch];
                const isSelected = selectedChar === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => setSelectedChar(ch)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center font-mono transition-all border ${
                      isSelected 
                        ? 'bg-cyan-500/20 border-cyan-400 text-white scale-105 shadow-md shadow-cyan-500/20' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-bold uppercase">{ch}</span>
                    <span className="text-[8px] text-slate-400 truncate w-full px-0.5 text-center">
                      {rule ? rule.label.slice(0, 7) : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Rule Details Card */}
          {currentRule && (
            <div className="p-4 bg-black/80 border border-white/15 rounded-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-2xl font-bold text-cyan-300 uppercase">
                    {currentRule.char}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <span>{currentRule.label}</span>
                      <span className="text-xs font-normal text-slate-400 font-mono">
                        (Function: '{currentRule.op}')
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5 font-mono">
                      Chroma phase: +{currentRule.colorPhase}° HSL • Multiplier A: {currentRule.paramA.toFixed(2)}x
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-400">
                  Next mutation: <span className="text-amber-300 font-bold">{hydraState.timeRemainingMinutes}m</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="text-slate-500 uppercase text-[10px]">PARAMETER A</div>
                  <div className="text-cyan-300 font-bold mt-0.5">{currentRule.paramA.toFixed(2)}</div>
                </div>
                <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="text-slate-500 uppercase text-[10px]">PARAMETER B</div>
                  <div className="text-emerald-300 font-bold mt-0.5">{currentRule.paramB.toFixed(2)}</div>
                </div>
                <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-slate-500 uppercase text-[10px]">COLOR PHASE</div>
                  <div className="text-purple-300 font-bold mt-0.5">+{currentRule.colorPhase}°</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-mono font-medium transition-all"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
