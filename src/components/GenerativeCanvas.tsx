import React, { useEffect, useRef, useState } from 'react';
import { 
  MarineData, 
  MarketData, 
  OnChainConfig, 
  PoetryAnalysis 
} from '../types/generative';
import { HydraSynthesizerState } from '../services/hourlyEngine';
import { Maximize2, Minimize2, Camera, Clock, Activity, Zap } from 'lucide-react';

interface GenerativeCanvasProps {
  poetryAnalysis: PoetryAnalysis;
  marineData: MarineData;
  marketData: MarketData;
  onChainConfig: OnChainConfig;
  hydraState: HydraSynthesizerState;
  onSnapshotTaken?: (dataUrl: string) => void;
}

// Convert hex hash to deterministic seed numbers
function parseTxHash(hash: string): { seedA: number; seedB: number; seedC: number } {
  let clean = hash.replace(/^0x/, '');
  if (clean.length < 12) clean = '7a4b9c1d3e5f2a8b';
  const a = parseInt(clean.substring(0, 4), 16) / 0xffff;
  const b = parseInt(clean.substring(4, 8), 16) / 0xffff;
  const c = parseInt(clean.substring(8, 12), 16) / 0xffff;
  return { seedA: a, seedB: b, seedC: c };
}

export const GenerativeCanvas: React.FC<GenerativeCanvasProps> = ({
  poetryAnalysis,
  marineData,
  marketData,
  onChainConfig,
  hydraState,
  onSnapshotTaken
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fps, setFps] = useState(60);

  const timeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const touchRef = useRef({ x: 0, y: 0, active: false });

  // Setup canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    if (onSnapshotTaken) {
      onSnapshotTaken(dataUrl);
    }
    const link = document.createElement('a');
    link.download = `arte-generativo-${onChainConfig.tokenId}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // 60 FPS Hydra-Style Live Visual Synthesizer Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        animFrameId.current = requestAnimationFrame(render);
        return;
      }

      timeRef.current += 0.016;
      const t = timeRef.current;

      // FPS tracking
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      const { seedA, seedB, seedC } = parseTxHash(onChainConfig.txHash);

      // Marine parameters from Floripa
      const waveFreq = (2 * Math.PI) / Math.max(4, marineData.wavePeriod);
      const waveHeightFactor = marineData.waveHeight / 2.0; // ~0.5 to 2.5
      const swellAngle = (marineData.waveDirection * Math.PI) / 180;
      const tideShift = marineData.tideLevel; // -1 to 1

      // Market parameters from AMM simulator
      const marketVol = marketData.volatilityIndex / 100;
      const tvlRatio = marketData.depthRatio;

      // Hydra Synthesis Operators configured by current typed poetry
      const kSides = hydraState.kaleidSides; // 0 to 16
      const oscF = hydraState.oscFreq * (1 + waveHeightFactor * 0.2);
      const oscS = hydraState.oscSpeed;
      const modAmp = hydraState.modulateAmp * (1 + marketVol * 0.5);
      const rotSpd = hydraState.rotateSpeed + (swellAngle * 0.1);
      const glitch = hydraState.glitchIntensity + (marketVol > 0.7 ? 0.2 : 0);
      const chromaSpd = hydraState.chromaSpeed;
      const voronoi = hydraState.voronoiDensity;
      const zoom = hydraState.scaleZoom;
      const laserRays = hydraState.laserRays;

      // Background fade for temporal feedback decay
      const fadeAlpha = Math.max(0.08, hydraState.feedbackDecay);
      ctx.fillStyle = `rgba(3, 5, 12, ${fadeAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const minDim = Math.min(w, h);

      // Base rotation
      const currentRotation = t * rotSpd;

      // --- HYDRA STAGE 1: KALEIDOSCOPE & DOMAIN WARP FIELD ---
      // We render generative harmonic bands with kaleidoscope radial folding
      const rings = 28;
      const slices = kSides > 1 ? kSides : 1;
      const sliceAngle = (Math.PI * 2) / slices;

      for (let s = 0; s < slices; s++) {
        const baseAngle = s * sliceAngle + currentRotation;

        for (let r = 1; r <= rings; r++) {
          const normR = r / rings;
          const radius = normR * (minDim * 0.65) * zoom;

          // Oscillator harmonic equation
          const waveOsc = Math.sin(normR * oscF - t * oscS + seedA * 10);
          const warpMod = Math.cos(normR * (oscF * 0.5) + t * waveFreq) * modAmp * 35;

          // Modulate radius with Floripa swell
          const finalRadius = Math.max(0, radius + waveOsc * 16 + warpMod);

          // RGB Color synthesis from trigonometry + characters phase
          const hue = (normR * 280 + t * chromaSpd * 40 + seedB * 360 + poetryAnalysis.dominantHue * 0.2) % 360;
          const lightness = 45 + Math.sin(normR * 12 + t * 3) * 25 + (tideShift * 8);
          const alpha = (0.25 + Math.sin(normR * Math.PI) * 0.55) * (1 - normR * 0.3);

          ctx.strokeStyle = `hsla(${hue}, 95%, ${Math.max(20, Math.min(85, lightness))}%, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.2 + (1 - normR) * 2.0;

          ctx.beginPath();
          if (slices > 1) {
            // Folded kaleidoscope mirror arc
            const startAng = baseAngle - sliceAngle * 0.5;
            const endAng = baseAngle + sliceAngle * 0.5;
            ctx.arc(cx, cy, finalRadius, startAng, endAng);
          } else {
            // Continuous concentric orbital wave
            ctx.arc(cx, cy, finalRadius, 0, Math.PI * 2);
          }
          ctx.stroke();
        }
      }

      // --- HYDRA STAGE 2: LASER PRISMS & RADIANT VECTORS ---
      if (laserRays > 0) {
        const totalRays = laserRays;
        ctx.lineWidth = 1.4;

        for (let lr = 0; lr < totalRays; lr++) {
          const rayAngle = (lr / totalRays) * Math.PI * 2 + currentRotation * 1.5;
          const rayLength = minDim * (0.4 + Math.sin(t * 4 + lr) * 0.25);
          const rayHue = (lr * (360 / totalRays) + t * chromaSpd * 50) % 360;

          const ex = cx + Math.cos(rayAngle) * rayLength;
          const ey = cy + Math.sin(rayAngle) * rayLength;

          ctx.strokeStyle = `hsla(${rayHue}, 100%, 75%, 0.65)`;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // Vertex crystal highlight
          ctx.fillStyle = `hsl(${rayHue}, 100%, 90%)`;
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5 + marketVol * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- HYDRA STAGE 3: CELLULAR VORONOI CAUSTICS (Water & Liquidity) ---
      const cellCount = Math.min(32, Math.round(voronoi));
      ctx.lineWidth = 0.8;

      for (let c = 0; c < cellCount; c++) {
        const angle = c * 2.39996 + t * 0.2 + seedC;
        const dist = Math.sqrt(c / cellCount) * (minDim * 0.45) * zoom;
        const cellX = cx + Math.cos(angle) * dist + Math.sin(t * waveFreq + c) * (waveHeightFactor * 20);
        const cellY = cy + Math.sin(angle) * dist + Math.cos(t * waveFreq - c) * (waveHeightFactor * 20);

        const cellHue = (c * 24 + t * chromaSpd * 20 + seedA * 180) % 360;
        const cellSize = 6 + Math.sin(t * 3 + c) * 4 + (tvlRatio * 8);

        // Caustic glow
        ctx.fillStyle = `hsla(${cellHue}, 90%, 65%, 0.25)`;
        ctx.beginPath();
        ctx.arc(cellX, cellY, cellSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core nodal focus
        ctx.fillStyle = `hsl(${cellHue}, 100%, 85%)`;
        ctx.beginPath();
        ctx.arc(cellX, cellY, cellSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- HYDRA STAGE 4: CRT GLITCH & CHROMATIC SCANLINES ---
      if (glitch > 0.05) {
        const glitchSlices = Math.round(glitch * 14);
        for (let g = 0; g < glitchSlices; g++) {
          if (Math.random() < 0.45) {
            const gy = Math.random() * h;
            const gh = 3 + Math.random() * 10;
            const shift = (Math.random() - 0.5) * (glitch * 70);

            try {
              const slice = ctx.getImageData(0, Math.floor(gy), Math.floor(w), Math.floor(gh));
              ctx.putImageData(slice, shift, Math.floor(gy));
            } catch {
              // ignore context sandbox limits
            }
          }
        }
      }

      // Central Harmonic Singularity
      const coreR = 12 + Math.sin(t * 3) * 6 + waveHeightFactor * 8;
      const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreR * 2.5);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, `hsla(${(t * 40) % 360}, 100%, 75%, 0.8)`);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [
    poetryAnalysis, 
    marineData, 
    marketData, 
    onChainConfig,
    hydraState
  ]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-black ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-[1/1] sm:aspect-[4/3] w-full'
      }`}
    >
      {/* 60 FPS Canvas (Pure Generative Visual Synthesis - NO text drawn on canvas) */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />

      {/* Floating Action Controls on Canvas Corner */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20 pointer-events-auto">
        <button
          onClick={takeSnapshot}
          className="flex items-center gap-1 p-1.5 px-2.5 bg-black/50 hover:bg-black/80 text-cyan-300 border border-white/10 backdrop-blur-md rounded-xl text-[10px] font-mono transition-all shadow-lg"
          title="Exportar Captura PNG en alta resolución"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PNG</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-slate-300 hover:text-white transition-colors shadow-lg"
          title={isFullscreen ? 'Salir' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Subtle Live Synth Badge on Bottom Corner */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 pointer-events-none text-[10px] font-mono">
        <div className="p-1 px-2.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-cyan-300 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>HYDRA: {hydraState.dominantLabel}</span>
          {hydraState.kaleidSides > 0 && (
            <span className="text-amber-300">· {hydraState.kaleidSides}X</span>
          )}
        </div>
      </div>
    </div>
  );
};
