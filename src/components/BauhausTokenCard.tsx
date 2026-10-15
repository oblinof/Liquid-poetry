import React, { useRef, useEffect, useState } from 'react';
import { MintedSnapshot } from '../types/generative';
import { HydraSynthesizerState } from '../services/hourlyEngine';
import { X, Download, Copy, Check, Droplets, Zap, Image as ImageIcon } from 'lucide-react';

interface BauhausTokenCardProps {
  snapshot: MintedSnapshot;
  hydraState: HydraSynthesizerState;
  onClose: () => void;
  onDownloadCard?: () => void;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_wave_height;
uniform float u_wave_period;
uniform float u_wave_dir;
uniform float u_tide;
uniform float u_volatility;
uniform float u_liquidity;
uniform float u_char_count;
uniform float u_osc_freq;
uniform float u_osc_speed;
uniform float u_mod_amp;
uniform float u_kaleid;
uniform float u_glitch;
uniform float u_pixel_res;
uniform float u_grid_lines;
uniform float u_rot_speed;
uniform float u_chroma_speed;
uniform vec3 u_color_phase;
uniform float u_seed;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 rotate2D(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = (st - 0.5) * vec2(aspect, 1.0) * 2.0;
  float t = u_time * 0.7;

  if (u_pixel_res > 1.5) {
    float res = u_pixel_res;
    uv = floor(uv * res) / res;
  }

  if (u_kaleid > 1.5) {
    float angle = atan(uv.y, uv.x);
    float r = length(uv);
    float segments = u_kaleid;
    float segAngle = 6.2831853 / segments;
    angle = abs(mod(angle, segAngle) - segAngle * 0.5);
    uv = vec2(cos(angle), sin(angle)) * r;
  }

  float rotAngle = t * u_rot_speed + u_wave_dir * 0.01;
  uv = rotate2D(uv, rotAngle);

  vec2 warpUV = uv;
  float waveCycle = (6.2831853 / max(3.0, u_wave_period)) * t;
  float swellAmp = u_wave_height * 0.4;
  float warpX = sin(uv.y * (u_osc_freq * 0.4) + waveCycle + u_seed) * (u_mod_amp + swellAmp * 0.2);
  float warpY = cos(uv.x * (u_osc_freq * 0.4) - waveCycle - u_seed) * (u_mod_amp + swellAmp * 0.2);
  uv += vec2(warpX, warpY);

  float f = max(1.0, u_osc_freq);
  float osc1 = sin(uv.x * f + t * u_osc_speed);
  float osc2 = cos(uv.y * (f * 0.85) - t * (u_osc_speed * 0.9));
  float osc3 = sin((uv.x + uv.y) * (f * 0.6) + t * 1.5);
  float oscMix = (osc1 + osc2 + osc3) / 3.0;

  float gridPattern = 0.0;
  if (u_grid_lines > 0.5) {
    vec2 gridCoords = fract(uv * u_grid_lines + t * 0.2);
    float lineX = step(0.92, gridCoords.x) + step(gridCoords.x, 0.08);
    float lineY = step(0.92, gridCoords.y) + step(gridCoords.y, 0.08);
    gridPattern = clamp(lineX + lineY, 0.0, 1.0);
  }

  float liquidityHyperbola = sin(uv.x * uv.y * 12.0 + t * 2.0) * (0.3 + u_volatility * 0.4);
  float tideCaustic = sin(length(uv) * 16.0 - waveCycle * 2.0 + u_tide * 3.0);

  float field = oscMix * 0.6 + liquidityHyperbola * 0.25 + tideCaustic * 0.2;
  field += gridPattern * 0.4;

  float chromaTime = t * u_chroma_speed;
  vec3 col;
  col.r = 0.5 + 0.5 * sin(field * 3.14159 + chromaTime + u_color_phase.x + u_seed);
  col.g = 0.5 + 0.5 * sin(field * 3.14159 * 1.2 + chromaTime * 1.1 + u_color_phase.y + u_tide);
  col.b = 0.5 + 0.5 * sin(field * 3.14159 * 1.4 + chromaTime * 1.3 + u_color_phase.z + u_volatility);

  col = pow(col, vec3(1.2));
  col *= 1.3;

  if (u_glitch > 0.02) {
    float glitchTrigger = step(0.94 - u_glitch * 0.2, hash21(vec2(floor(gl_FragCoord.y / 6.0), floor(t * 15.0))));
    if (glitchTrigger > 0.5) {
      float shift = (hash21(vec2(floor(t * 20.0), 3.14)) - 0.5) * (u_glitch * 0.4);
      col.r = 0.5 + 0.5 * sin((field + shift) * 4.0 + chromaTime);
      col.b = 0.5 + 0.5 * cos((field - shift) * 4.0 + chromaTime);
      col += vec3(0.15, -0.1, 0.2) * glitchTrigger;
    }
  }

  float vignette = smoothstep(2.4, 0.4, length(st - 0.5) * 2.0);
  col *= (0.7 + 0.3 * vignette);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function parseTxHash(hash: string): number {
  let clean = hash.replace(/^0x/, '');
  if (clean.length < 8) clean = '7a4b9c1d';
  return parseInt(clean.substring(0, 6), 16) / 0xffffff;
}

function formatTide(phase: string): string {
  switch (phase) {
    case 'pleamar': return 'High Tide';
    case 'bajamar': return 'Low Tide';
    case 'flujo': return 'Rising Tide';
    case 'reflujo': return 'Ebbing Tide';
    default: return 'High Tide';
  }
}

export const BauhausTokenCard: React.FC<BauhausTokenCardProps> = ({
  snapshot,
  hydraState,
  onClose,
  onDownloadCard
}) => {
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize and run WebGL shader inside the trading card window
  // Using FIXED IMMUTABLE DATA captured at the moment of mint!
  useEffect(() => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { 
      alpha: false, 
      antialias: false,
      preserveDrawingBuffer: true 
    });

    if (!gl) return;

    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertShader, VERTEX_SHADER_SRC);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, FRAGMENT_SHADER_SRC);
    gl.compileShader(fragShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uNames = [
      'u_resolution', 'u_time', 'u_wave_height', 'u_wave_period', 'u_wave_dir',
      'u_tide', 'u_volatility', 'u_liquidity', 'u_char_count', 'u_osc_freq',
      'u_osc_speed', 'u_mod_amp', 'u_kaleid', 'u_glitch', 'u_pixel_res',
      'u_grid_lines', 'u_rot_speed', 'u_chroma_speed', 'u_color_phase', 'u_seed'
    ];
    const uMap: Record<string, WebGLUniformLocation> = {};
    uNames.forEach((name) => {
      const loc = gl.getUniformLocation(program, name);
      if (loc) uMap[name] = loc;
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    let startTime = performance.now();
    let isRunning = true;

    // Use IMMUTABLE FIXED DATA from snapshot
    const seedNum = parseTxHash(snapshot.txHash);
    const digits = (snapshot.poetryText.match(/[0-9]/g) || []).length;
    const consonants = (snapshot.poetryText.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
    const pixelRes = digits > 0 ? Math.max(6.0, 48.0 - digits * 4.0) : 0.0;
    const gridLines = consonants > 2 ? 4.0 + (consonants % 12) * 2.0 : 0.0;

    const render = (now: number) => {
      if (!isRunning) return;
      const elapsed = (now - startTime) * 0.001;

      gl.useProgram(program);

      if (uMap.u_resolution) gl.uniform2f(uMap.u_resolution, gl.canvas.width, gl.canvas.height);
      if (uMap.u_time) gl.uniform1f(uMap.u_time, elapsed);

      // FIXED OCEAN & LIQUIDITY DATA AT MINT TIMESTAMP
      if (uMap.u_wave_height) gl.uniform1f(uMap.u_wave_height, snapshot.fixedMarine.waveHeight);
      if (uMap.u_wave_period) gl.uniform1f(uMap.u_wave_period, snapshot.fixedMarine.wavePeriod);
      if (uMap.u_wave_dir) gl.uniform1f(uMap.u_wave_dir, snapshot.fixedMarine.waveDirection);
      if (uMap.u_tide) gl.uniform1f(uMap.u_tide, snapshot.fixedMarine.tideLevel);
      if (uMap.u_volatility) gl.uniform1f(uMap.u_volatility, snapshot.fixedMarket.volatilityIndex / 100.0);
      if (uMap.u_liquidity) gl.uniform1f(uMap.u_liquidity, snapshot.fixedMarket.depthRatio);

      if (uMap.u_char_count) gl.uniform1f(uMap.u_char_count, snapshot.poetryLength);
      if (uMap.u_osc_freq) gl.uniform1f(uMap.u_osc_freq, hydraState.oscFreq);
      if (uMap.u_osc_speed) gl.uniform1f(uMap.u_osc_speed, hydraState.oscSpeed);
      if (uMap.u_mod_amp) gl.uniform1f(uMap.u_mod_amp, hydraState.modulateAmp);
      if (uMap.u_kaleid) gl.uniform1f(uMap.u_kaleid, hydraState.kaleidSides);
      if (uMap.u_glitch) gl.uniform1f(uMap.u_glitch, hydraState.glitchIntensity);
      if (uMap.u_pixel_res) gl.uniform1f(uMap.u_pixel_res, pixelRes);
      if (uMap.u_grid_lines) gl.uniform1f(uMap.u_grid_lines, gridLines);
      if (uMap.u_rot_speed) gl.uniform1f(uMap.u_rot_speed, hydraState.rotateSpeed);
      if (uMap.u_chroma_speed) gl.uniform1f(uMap.u_chroma_speed, hydraState.chromaSpeed);

      if (uMap.u_color_phase) {
        const domH = snapshot.dominantHue;
        gl.uniform3f(uMap.u_color_phase, (domH * Math.PI) / 180, ((domH + 120) * Math.PI) / 180, ((domH + 240) * Math.PI) / 180);
      }
      if (uMap.u_seed) gl.uniform1f(uMap.u_seed, seedNum * 10.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [snapshot, hydraState]);

  // Download standalone artwork PNG
  const handleDownloadArtwork = () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `brittany-oracle-art-${snapshot.tokenId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (onDownloadCard) onDownloadCard();
  };

  // Download Full Collectible Sci-Fi Card Composite
  const handleDownloadFullCard = () => {
    const artCanvas = cardCanvasRef.current;
    if (!artCanvas) return;

    const W = 750;
    const H = 1050;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = W;
    offCanvas.height = H;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Outer Dark Background
    ctx.fillStyle = '#0c1017';
    ctx.fillRect(0, 0, W, H);

    // Subtle neon border
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // 2. Top Title Banner
    ctx.fillStyle = '#172033';
    ctx.fillRect(30, 32, W - 60, 52);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 32, W - 60, 52);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Space Grotesk", Helvetica, sans-serif';
    ctx.fillText('Brittany, Oracle of Floripa', 48, 67);

    // Mana Badges {2}{U}{R}
    const drawMana = (text: string, x: number, bg: string, border: string) => {
      ctx.beginPath();
      ctx.arc(x, 58, 14, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, 58);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    };
    drawMana('2', W - 120, '#334155', '#94a3b8');
    drawMana('U', W - 85, '#0284c7', '#38bdf8');
    drawMana('R', W - 50, '#7c3aed', '#c084fc');

    // 3. Center WebGL Art Window
    const artX = 30;
    const artY = 96;
    const artW = W - 60;
    const artH = 460;
    ctx.drawImage(artCanvas, artX, artY, artW, artH);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(artX, artY, artW, artH);

    // Micro badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(artX + 12, artY + 12, 220, 24);
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('IMMUTABLE SEED // FLRPA L2', artX + 20, artY + 28);

    // 4. Type Line Banner
    const typeY = 568;
    ctx.fillStyle = '#172033';
    ctx.fillRect(30, typeY, W - 60, 42);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, typeY, W - 60, 42);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 17px "Space Grotesk", Helvetica, sans-serif';
    ctx.fillText('Legendary Artifact — Marine Synthesis', 48, typeY + 27);

    // Mythic Holographic Crest
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(W - 75, typeY + 11, 28, 20);
    ctx.fillStyle = '#000000';
    ctx.font = 'black 12px "JetBrains Mono", monospace';
    ctx.fillText('M', W - 67, typeY + 26);

    // 5. Rules & Text Box
    const rulesY = 620;
    const rulesH = 345;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(30, rulesY, W - 60, rulesH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, rulesY, W - 60, rulesH);

    // Ability 1
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
    ctx.fillText('Floripa Tideflow', 50, rulesY + 34);
    ctx.font = 'normal 14px Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(
      `— Swell at Praia da Joaquina is locked at ${snapshot.fixedMarine.waveHeight}m · ${snapshot.fixedMarine.wavePeriod}s (${formatTide(snapshot.fixedMarine.tidePhase)}).`,
      175,
      rulesY + 34
    );
    ctx.fillText(
      `Harmonic visual oscillators deterministically bind to Brittany's verse.`,
      50,
      rulesY + 56
    );

    // Ability 2
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
    ctx.fillText('AMM Liquidity Invariant', 50, rulesY + 92);
    ctx.font = 'normal 14px Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(
      `— Constant product depth frozen at $${snapshot.fixedMarket.priceUsd.toFixed(1)} POET with`,
      235,
      rulesY + 92
    );
    ctx.fillText(
      `${snapshot.fixedMarket.volatilityIndex.toFixed(0)}% volatility and ${snapshot.fixedMarket.gasGwei} Gwei gas fee at block #${snapshot.blockNumber}.`,
      50,
      rulesY + 114
    );

    // Horizontal Rule
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, rulesY + 140);
    ctx.lineTo(W - 50, rulesY + 140);
    ctx.stroke();

    // 111-char Poem Flavor text
    ctx.fillStyle = '#334155';
    ctx.font = 'italic 16px "Times New Roman", Georgia, serif';
    const poemLines: string[] = [];
    const words = (snapshot.poetryText || 'Silence across the deep...').split(' ');
    let curLine = '';
    for (const w of words) {
      if ((curLine + ' ' + w).length > 60) {
        poemLines.push(curLine.trim());
        curLine = w;
      } else {
        curLine += ' ' + w;
      }
    }
    if (curLine.trim()) poemLines.push(curLine.trim());

    let pY = rulesY + 175;
    poemLines.forEach((line) => {
      ctx.fillText(`"${line}"`, 50, pY);
      pY += 26;
    });

    ctx.fillStyle = '#64748b';
    ctx.font = 'normal 13px "JetBrains Mono", monospace';
    ctx.fillText(`— Brittany, Oracle of Santa Catarina (${snapshot.poetryLength}/111 chars)`, 50, pY + 15);

    // Power / Toughness Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(W - 145, rulesY + rulesH - 35, 95, 42);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(W - 145, rulesY + rulesH - 35, 95, 42);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'black 18px "JetBrains Mono", monospace';
    ctx.fillText('111', W - 135, rulesY + rulesH - 9);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('/', W - 98, rulesY + rulesH - 9);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('111', W - 85, rulesY + rulesH - 9);

    // 6. Collector Line Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('111/111 M · FLRPA L2', 30, H - 42);
    ctx.font = 'normal 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`TX: ${snapshot.txHash.slice(0, 20)}...`, 30, H - 26);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('BRITTANY', W - 30, H - 42);
    ctx.font = 'normal 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('TM & © 2026 // OPEN-METEO & AMM', W - 30, H - 26);
    ctx.textAlign = 'left';

    // Holofoil Stamp
    ctx.beginPath();
    ctx.ellipse(W / 2, H - 35, 22, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const link = document.createElement('a');
    link.download = `brittany-oracle-card-${snapshot.tokenId}.png`;
    link.href = offCanvas.toDataURL('image/png');
    link.click();
    if (onDownloadCard) onDownloadCard();
  };

  const handleCopyJSON = () => {
    const data = {
      cardName: "Brittany, Oracle of Floripa",
      type: "Legendary Artifact — Marine Synthesis",
      manaCost: "{2}{U}{R}",
      owner: snapshot.minterName,
      tokenId: snapshot.tokenId,
      txHash: snapshot.txHash,
      blockNumber: snapshot.blockNumber,
      mintTimestamp: new Date(snapshot.mintTimestamp).toISOString(),
      network: snapshot.network,
      poetry: snapshot.poetryText,
      // Immutable fixed parameters captured at block mint:
      fixedMarineOracle: {
        waveHeight: `${snapshot.fixedMarine.waveHeight} m`,
        wavePeriod: `${snapshot.fixedMarine.wavePeriod} s`,
        tidePhase: formatTide(snapshot.fixedMarine.tidePhase),
        location: snapshot.fixedMarine.location
      },
      fixedAmmMarket: {
        priceUsd: `$${snapshot.fixedMarket.priceUsd.toFixed(2)}`,
        volatility: `${snapshot.fixedMarket.volatilityIndex.toFixed(0)}%`,
        gasFee: `${snapshot.fixedMarket.gasGwei} Gwei`
      },
      standard: "ERC-721 On-Chain Artifact"
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-[390px] sm:max-w-[420px] my-auto">
        
        {/* Top Dismiss Bar */}
        <div className="flex justify-between items-center mb-2 px-1 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="tracking-wider uppercase font-semibold">ON-CHAIN SCI-FI TRADING CARD</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* THE SCI-FI MTG TRADING CARD (IN ENGLISH, FIXED SNAPSHOT DATA) */}
        {/* ============================================================== */}
        <div 
          ref={cardContainerRef}
          className="relative bg-[#0c1017] rounded-[18px] p-2.5 sm:p-3 border-[3px] border-[#1f2937] text-slate-100 flex flex-col font-sans select-none overflow-hidden"
          style={{
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(6, 182, 212, 0.25)'
          }}
        >
          {/* Cyberpunk foil accent */}
          <div className="absolute inset-[3px] rounded-[15px] border border-cyan-500/20 pointer-events-none" />

          {/* 1. TOP HEADER BANNER (Card Name & Sci-Fi Mana Cost) */}
          <div className="relative z-10 flex items-center justify-between px-3 py-1.5 rounded-t-xl bg-gradient-to-r from-[#172033] via-[#111927] to-[#1e293b] border-2 border-[#334155] shadow-inner mb-1.5">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-100 font-sans truncate">
                Brittany, Oracle of Floripa
              </h1>
            </div>

            {/* Mana Cost Symbols */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <div className="w-5 h-5 rounded-full bg-slate-700/80 border border-slate-400 flex items-center justify-center text-[11px] font-black font-mono text-slate-200 shadow-sm">
                2
              </div>
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-300 flex items-center justify-center text-white shadow-sm shadow-cyan-500/50">
                <Droplets className="w-3 h-3" />
              </div>
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 border border-purple-300 flex items-center justify-center text-white shadow-sm shadow-purple-500/50">
                <Zap className="w-3 h-3 text-purple-200" />
              </div>
            </div>
          </div>

          {/* 2. CENTER ARTWORK WINDOW: Real-time WebGL Hydra running on FIXED snapshot */}
          <div className="relative z-10 w-full aspect-[4/3] rounded-md overflow-hidden border-2 border-[#334155] bg-black shadow-inner">
            <canvas
              ref={cardCanvasRef}
              className="w-full h-full block select-none"
            />
            <div className="absolute top-1.5 left-2 text-[8px] font-mono text-cyan-300/80 bg-black/60 px-1 rounded backdrop-blur-sm">
              FIXED ON-CHAIN SEED // 60 FPS
            </div>
          </div>

          {/* 3. TYPE LINE BAR */}
          <div className="relative z-10 flex items-center justify-between px-3 py-1 my-1.5 rounded-sm bg-gradient-to-r from-[#172033] via-[#111927] to-[#1e293b] border-2 border-[#334155] shadow-inner text-xs">
            <div className="font-bold tracking-tight text-slate-200 font-sans text-[11px] sm:text-xs truncate">
              Legendary Artifact — Marine Synthesis
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              <div className="w-5 h-4 rounded-sm bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-400 p-[1px] shadow-sm shadow-amber-500/40">
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <span className="text-[9px] font-black font-mono text-amber-300">M</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. RULES BOX (High-contrast Sci-Fi Plate with Watermark) */}
          <div className="relative z-10 rounded-sm p-3 bg-gradient-to-b from-[#e5e7eb] via-[#f1f5f9] to-[#e2e8f0] text-slate-900 border-2 border-[#334155] shadow-inner flex flex-col justify-between min-h-[145px]">
            
            {/* Background Cybernetic Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
              <div className="w-32 h-32 rounded-full border-[10px] border-black flex items-center justify-center">
                <div className="w-20 h-2 bg-black rotate-45" />
              </div>
            </div>

            {/* Rules Text with FIXED IMMUTABLE DATA */}
            <div className="relative z-10 space-y-1.5 text-[11px] sm:text-xs leading-snug font-sans">
              <div>
                <span className="font-extrabold text-black">Floripa Tideflow</span> — Ocean swell at Praia da Joaquina is permanently bound at {snapshot.fixedMarine.waveHeight}m · {snapshot.fixedMarine.wavePeriod}s ({formatTide(snapshot.fixedMarine.tidePhase)}). Harmonic oscillators align with Brittany's verse.
              </div>

              <div>
                <span className="font-extrabold text-black">AMM Liquidity Invariant</span> — Market depth is immutable at ${snapshot.fixedMarket.priceUsd.toFixed(1)} POET with {snapshot.fixedMarket.volatilityIndex.toFixed(0)}% volatility and {snapshot.fixedMarket.gasGwei} Gwei gas fee.
              </div>
            </div>

            {/* Separator Line */}
            <div className="relative z-10 w-full h-[1px] bg-slate-400/50 my-1.5" />

            {/* 111-Character Flavor Text (Italics) */}
            <div className="relative z-10">
              <p className="text-[11px] font-sans italic text-slate-700 leading-snug font-normal">
                "{snapshot.poetryText || 'Silence across the deep...'}"
              </p>
              <div className="text-[9px] font-mono text-slate-500 mt-0.5 text-right font-medium">
                — Brittany, Oracle of Santa Catarina ({snapshot.poetryLength}/111)
              </div>
            </div>

            {/* 5. FLOATING BOTTOM-RIGHT POWER / TOUGHNESS BADGE */}
            <div className="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-2 border-[#475569] shadow-lg text-slate-100 font-mono text-xs font-black z-20 flex items-center gap-0.5">
              <span className="text-cyan-300">111</span>
              <span className="text-slate-500">/</span>
              <span className="text-amber-300">111</span>
            </div>
          </div>

          {/* 6. BOTTOM COLLECTOR FOOTER & OVAL HOLOFOIL STAMP */}
          <div className="relative z-10 flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-400 mt-2 px-1">
            <div className="truncate max-w-[130px]">
              <span className="text-slate-200 font-bold">111/111 M</span>
              <span className="mx-1 text-slate-600">·</span>
              <span className="text-cyan-400">FLRPA L2</span>
              <div className="text-[7.5px] text-slate-500 truncate">
                TX: {snapshot.txHash.slice(0, 12)}...
              </div>
            </div>

            {/* Oval Holofoil Security Stamp */}
            <div className="w-6 h-3.5 rounded-full border border-slate-400 bg-gradient-to-r from-cyan-400 via-purple-300 via-pink-400 to-amber-300 shadow-sm flex items-center justify-center p-[1px] shrink-0">
              <div className="w-full h-full bg-[#0c1017] rounded-full flex items-center justify-center">
                <span className="text-[7px] font-black text-slate-300 font-mono">B</span>
              </div>
            </div>

            <div className="text-right truncate max-w-[130px]">
              <div className="text-slate-300 font-bold">BRITTANY</div>
              <div className="text-[7.5px] text-slate-500">
                TM & © 2026 // OPEN-METEO
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls in English */}
        <div className="flex flex-col gap-1.5 mt-3 px-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFullCard}
              className="flex-1 py-2 px-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full Card (PNG)</span>
            </button>

            <button
              onClick={handleDownloadArtwork}
              className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
              title="Download only the centered generative artwork"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
              <span>Art PNG</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleCopyJSON}
              className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              title="Copy ERC-721 JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy ERC-721 JSON'}</span>
            </button>

            <button
              onClick={onClose}
              className="py-2 px-4 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
