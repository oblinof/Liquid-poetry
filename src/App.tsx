import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MarineData, MarketData, OnChainConfig, MintedSnapshot } from './types/generative';
import { analyzePoetry, POETRY_PRESETS } from './services/poetryAnalyzer';
import { calculateHydraState } from './services/hourlyEngine';
import { fetchFloripaMarineData } from './services/marineOracle';
import { MarketSimulator } from './services/marketSimulator';
import { audioSynth } from './services/audioSynth';

import { HydraShaderCanvas } from './components/HydraShaderCanvas';
import { BauhausTokenCard } from './components/BauhausTokenCard';
import { CharacterInspectorModal } from './components/CharacterInspectorModal';

import { 
  Waves, 
  Volume2, 
  VolumeX, 
  Dice5, 
  Sparkles, 
  Clock, 
  Trash2, 
  Camera,
  Activity
} from 'lucide-react';

function generateRandomTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export default function App() {
  // 111-character poetry input (English presets)
  const [poetryText, setPoetryText] = useState(POETRY_PRESETS[0].text);
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(Date.now());
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Mint modal & immutable snapshot captured at the moment of mint
  const [isMintCardOpen, setIsMintCardOpen] = useState(false);
  const [mintedSnapshot, setMintedSnapshot] = useState<MintedSnapshot | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Live Marine Oracle state (Floripa Atlantic Ocean)
  const [marineData, setMarineData] = useState<MarineData>({
    waveHeight: 1.8,
    wavePeriod: 11.4,
    waveDirection: 145,
    windWaveHeight: 0.6,
    swellWaveHeight: 1.6,
    windSpeed: 16.0,
    windDirection: 110,
    waterTemp: 22.0,
    tidePhase: 'pleamar',
    tideLevel: 0.72,
    location: 'Praia da Joaquina & Mole, Floripa (SC)',
    isLive: false,
    lastUpdated: 'Live'
  });

  // Simulated AMM Market Engine
  const marketSimulatorRef = useRef<MarketSimulator>(new MarketSimulator());
  const [marketData, setMarketData] = useState<MarketData>(
    marketSimulatorRef.current.getMarketData()
  );

  // On-Chain Config with Owner Brittany
  const [onChainConfig, setOnChainConfig] = useState<OnChainConfig>({
    txHash: '0x7a4b9c1d3e5f2a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    blockNumber: 21849111,
    minterAddress: '0x91cA...44E1',
    minterName: 'Brittany',
    tokenId: 111,
    mintTimestamp: Date.now(),
    network: 'Floripa L2',
    isMinted: true
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Real-time text analysis
  const poetryAnalysis = useMemo(() => {
    return analyzePoetry(poetryText);
  }, [poetryText]);

  // Real-time Hydra synthesis parameters
  const hydraState = useMemo(() => {
    return calculateHydraState(poetryText);
  }, [poetryText, currentTimeTick]);

  // Hourly mutation interval
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 30000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch live Floripa ocean data
  const loadMarineData = useCallback(async () => {
    try {
      const data = await fetchFloripaMarineData();
      setMarineData(data);
      audioSynth.updateOceanSwell(data.wavePeriod, data.waveHeight);
    } catch (err) {
      console.warn('Error fetching marine data:', err);
    }
  }, []);

  useEffect(() => {
    loadMarineData();
    const interval = setInterval(loadMarineData, 60000);
    return () => clearInterval(interval);
  }, [loadMarineData]);

  // Step AMM market simulator
  useEffect(() => {
    const marketInterval = setInterval(() => {
      const nextMarket = marketSimulatorRef.current.step(marineData, poetryAnalysis);
      setMarketData(nextMarket);
    }, 1600);
    return () => clearInterval(marketInterval);
  }, [marineData, poetryAnalysis]);

  const handleToggleAudio = () => {
    const unmuted = audioSynth.toggleMute();
    setIsAudioActive(unmuted);
  };

  const handleRerollSeed = () => {
    setOnChainConfig(prev => ({
      ...prev,
      txHash: generateRandomTxHash(),
      blockNumber: prev.blockNumber + Math.floor(Math.random() * 5) + 1,
      mintTimestamp: Date.now()
    }));
  };

  // MINT ACTION: Only when clicking Mint is the card generated,
  // and the current marine and market data are IMMUTABLY FIXED!
  const handleMintClick = () => {
    const nextTokenId = onChainConfig.tokenId + 1;
    const nextTxHash = generateRandomTxHash();
    const nextBlock = onChainConfig.blockNumber + 1;
    const now = Date.now();

    // IMMUTABLE SNAPSHOT OF CURRENT CONDITIONS AT MINT TIME
    const snapshot: MintedSnapshot = {
      tokenId: nextTokenId,
      txHash: nextTxHash,
      blockNumber: nextBlock,
      minterName: 'Brittany',
      minterAddress: onChainConfig.minterAddress,
      mintTimestamp: now,
      network: 'Floripa L2 / Ethereum',
      poetryText: poetryText,
      poetryLength: poetryAnalysis.length,
      dominantHue: poetryAnalysis.dominantHue,
      // FIXED FROZEN DATA:
      fixedMarine: { ...marineData },
      fixedMarket: { ...marketData }
    };

    setOnChainConfig(prev => ({
      ...prev,
      tokenId: nextTokenId,
      txHash: nextTxHash,
      blockNumber: nextBlock,
      mintTimestamp: now,
      isMinted: true
    }));

    setMintedSnapshot(snapshot);
    setIsMintCardOpen(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 111);
    setPoetryText(val);
    if (val.length > poetryAnalysis.text.length && val.length > 0) {
      audioSynth.playCharSound(val[val.length - 1], val.length);
    }
  };

  const handleTakeSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hydra-canvas-${onChainConfig.tokenId}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const charCount = poetryAnalysis.length;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black text-slate-100 flex flex-col justify-between select-none font-sans">
      
      {/* 1. FULLSCREEN BACKGROUND GENERATIVE SHADER (HYDRA FIELD) */}
      <HydraShaderCanvas
        poetryAnalysis={poetryAnalysis}
        marineData={marineData}
        marketData={marketData}
        onChainConfig={onChainConfig}
        hydraState={hydraState}
      />

      {/* 2. TOP FLOATING TELEMETRY NUMBERS & HUD (IN ENGLISH) */}
      <header className="relative z-10 w-full p-2.5 sm:p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-2">
          
          {/* Left: Floripa Marine Weather & Movement of the Sea */}
          <div className="p-2 sm:px-3 sm:py-2 bg-black/55 backdrop-blur-2xl rounded-2xl border border-white/10 pointer-events-auto shadow-2xl flex flex-col gap-0.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>FLORIPA SEA: {marineData.waveHeight}M</span>
              <span className="text-slate-500 font-normal">/</span>
              <span className="text-emerald-300">{marineData.wavePeriod}S</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300">
              <span className="capitalize">
                {marineData.tidePhase === 'pleamar' ? 'High Tide' : marineData.tidePhase === 'bajamar' ? 'Low Tide' : marineData.tidePhase === 'flujo' ? 'Rising Tide' : 'Ebbing Tide'}
              </span>
              <span>•</span>
              <span className="text-amber-300">${marketData.priceUsd.toFixed(1)} POET</span>
              <span className="hidden xs:inline text-slate-400">({marketData.volatilityIndex.toFixed(0)}% vol)</span>
            </div>
          </div>

          {/* Right: Actions & MINT BUTTON */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            {/* Hour epoch rules button */}
            <button
              onClick={() => setIsInspectorOpen(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 bg-black/55 hover:bg-black/70 backdrop-blur-2xl rounded-2xl border border-white/10 text-xs font-mono text-cyan-300 transition-all flex items-center gap-1.5 shadow-2xl"
              title="View hourly visual operators"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">#{hydraState.epochHour % 24}:00</span>
              <span className="text-[10px] text-slate-400 hidden md:inline">({hydraState.dominantLabel})</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-2xl border transition-all text-xs font-mono flex items-center gap-1 backdrop-blur-2xl shadow-2xl ${
                isAudioActive
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                  : 'bg-black/55 border-white/10 text-slate-400 hover:text-white'
              }`}
              title={isAudioActive ? 'Mute' : 'Enable Ocean Synth'}
            >
              {isAudioActive ? <Volume2 className="w-3.5 h-3.5 text-cyan-300" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Re-roll Seed */}
            <button
              onClick={handleRerollSeed}
              className="p-2 sm:px-2.5 sm:py-1.5 bg-black/55 hover:bg-black/70 rounded-2xl border border-white/10 text-amber-300 hover:text-amber-200 transition-all text-xs font-mono flex items-center gap-1 backdrop-blur-2xl shadow-2xl"
              title="Generate new hash seed"
            >
              <Dice5 className="w-3.5 h-3.5" />
            </button>

            {/* Snapshot */}
            <button
              onClick={handleTakeSnapshot}
              className="p-2 sm:px-2.5 sm:py-1.5 bg-black/55 hover:bg-black/70 rounded-2xl border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-mono flex items-center gap-1 backdrop-blur-2xl shadow-2xl"
              title="Capture PNG"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* MINT BUTTON: When pressed, generates the Sci-Fi Card with FIXED ocean and market data! */}
            <button
              onClick={handleMintClick}
              className="p-2 sm:px-4 sm:py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-2xl text-xs font-sans tracking-tight transition-all flex items-center gap-1.5 shadow-2xl active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>MINT</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. CENTER AMBIENT FIELD: The live Hydra visuals fill the screen uninterrupted */}
      <div className="flex-1 pointer-events-none" />

      {/* 4. BOTTOM FLOATING REAL-TIME TYPING BAR (FITS MOBILE KEYBOARD) */}
      <footer className="relative z-10 w-full p-2.5 sm:p-4">
        <div className="max-w-3xl mx-auto space-y-2">
          
          {/* Quick preset chips in English */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {POETRY_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setPoetryText(preset.text.slice(0, 111))}
                className="px-2.5 py-1 bg-black/60 hover:bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl text-[11px] font-mono text-slate-300 hover:text-cyan-200 whitespace-nowrap transition-all shrink-0"
              >
                {preset.title}
              </button>
            ))}
          </div>

          {/* Liquid Floating Poetry Input Bar */}
          <div className="p-2 sm:p-2.5 bg-black/70 backdrop-blur-3xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl flex items-center gap-2">
            
            <input
              ref={inputRef}
              type="text"
              value={poetryText}
              onChange={handleTextChange}
              maxLength={111}
              placeholder="Type your 111-character poem here... mutates the artwork in real time..."
              className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base font-sans text-white placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />

            {/* Character Counter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-xl font-mono text-xs shrink-0">
              <span className={`font-bold ${charCount === 111 ? 'text-amber-400' : 'text-cyan-300'}`}>
                {charCount}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">111</span>
            </div>

            {/* Clear Button */}
            {charCount > 0 && (
              <button
                onClick={() => setPoetryText('')}
                className="p-2 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/20 rounded-xl transition-colors shrink-0"
                title="Clear text"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* 5. MINTED TOKEN CARD: Solamente cuando apretás el botón de mint se genera esta carta con datos fijos! */}
      {isMintCardOpen && mintedSnapshot && (
        <BauhausTokenCard
          snapshot={mintedSnapshot}
          hydraState={hydraState}
          onClose={() => setIsMintCardOpen(false)}
        />
      )}

      {/* Hourly Operators Inspector Modal */}
      <CharacterInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        poetryAnalysis={poetryAnalysis}
        hydraState={hydraState}
      />
    </div>
  );
}
