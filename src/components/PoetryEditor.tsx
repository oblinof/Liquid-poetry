import React, { useRef } from 'react';
import { PoetryAnalysis, MAX_POETRY_CHARS } from '../types/generative';
import { POETRY_PRESETS } from '../services/poetryAnalyzer';
import { HydraSynthesizerState } from '../services/hourlyEngine';
import { audioSynth } from '../services/audioSynth';
import { Feather, BookOpen, Trash2, SlidersHorizontal, Sparkles } from 'lucide-react';

interface PoetryEditorProps {
  poetryAnalysis: PoetryAnalysis;
  hydraState: HydraSynthesizerState;
  onTextChange: (newText: string) => void;
  onOpenInspector: () => void;
}

export const PoetryEditor: React.FC<PoetryEditorProps> = ({
  poetryAnalysis,
  hydraState,
  onTextChange,
  onOpenInspector,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_POETRY_CHARS);
    onTextChange(val);
    
    // Play harmonic tone
    if (val.length > poetryAnalysis.text.length && val.length > 0) {
      const lastChar = val[val.length - 1];
      audioSynth.playCharSound(lastChar, val.length);
    }
  };

  const handleSelectPreset = (presetText: string) => {
    onTextChange(presetText.slice(0, MAX_POETRY_CHARS));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClear = () => {
    onTextChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const charCount = poetryAnalysis.length;
  const charsRemaining = MAX_POETRY_CHARS - charCount;
  const fillPercentage = (charCount / MAX_POETRY_CHARS) * 100;

  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 relative overflow-hidden backdrop-blur-2xl max-w-xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide font-cinzel">
              Modulador de Poesía (111 Caracteres)
            </h3>
            <p className="text-[10px] font-mono text-cyan-300/80">
              Cada letra y número activa un operador visual tipo Hydra
            </p>
          </div>
        </div>

        {/* Counter and Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-black/60 border border-white/10 px-2.5 py-1 rounded-xl font-mono text-xs">
            <span className={`font-bold ${charCount === MAX_POETRY_CHARS ? 'text-amber-400' : 'text-cyan-300'}`}>
              {charCount}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{MAX_POETRY_CHARS}</span>
          </div>

          {charCount > 0 && (
            <button
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Borrar texto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenInspector}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
            title="Ver los operadores de cada letra"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Operadores</span>
          </button>
        </div>
      </div>

      {/* Real-time Poetry Input */}
      <div className="relative mb-2.5">
        <textarea
          ref={textareaRef}
          value={poetryAnalysis.text}
          onChange={handleChange}
          maxLength={MAX_POETRY_CHARS}
          rows={3}
          placeholder="Escribe aquí tu poesía... Cada letra y número que tipeas muta los osciladores, caleidoscopios y ondas en la carta..."
          className="w-full bg-black/60 border border-white/15 focus:border-cyan-400/80 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none shadow-inner"
        />

        {/* Progress Bar under textarea */}
        <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${fillPercentage}%`,
              background: `linear-gradient(90deg, #06b6d4, #a855f7, #f59e0b)`
            }}
          />
        </div>
      </div>

      {/* Active Hydra Operator Badges */}
      <div className="p-2 bg-black/40 border border-white/5 rounded-xl mb-2.5 flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-400 text-[11px]">SÍNTESIS DOMINANTE:</span>
          <span className="text-cyan-300 font-bold">{hydraState.dominantLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 overflow-x-auto">
          {hydraState.activeOperatorList.map((item, idx) => (
            <span key={idx} className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 flex items-center gap-1">
              <span className="text-cyan-300 font-bold uppercase">{item.char}</span>
              <span className="text-slate-500">→</span>
              <span className="text-slate-300">{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* One-Tap Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none no-scrollbar">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 mr-1 font-mono">
          <BookOpen className="w-3 h-3 text-cyan-400" />
          <span className="hidden xs:inline">Semillas:</span>
        </div>
        {POETRY_PRESETS.map((preset, index) => (
          <button
            key={index}
            onClick={() => handleSelectPreset(preset.text)}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-cyan-200 transition-all whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <span>{preset.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
