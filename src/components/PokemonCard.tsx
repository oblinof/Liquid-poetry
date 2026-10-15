import React, { useRef, useEffect } from 'react';
import { 
  MarineData, 
  MarketData, 
  OnChainConfig, 
  PoetryAnalysis 
} from '../types/generative';
import { HydraSynthesizerState } from '../services/hourlyEngine';
import { 
  Waves, 
  Zap, 
  Sparkles, 
  Droplets, 
  Star, 
  Camera, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

interface PokemonCardProps {
  poetryAnalysis: PoetryAnalysis;
  marineData: MarineData;
  marketData: MarketData;
  onChainConfig: OnChainConfig;
  hydraState: HydraSynthesizerState;
  onClose?: () => void;
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

export const PokemonCard: React.FC<PokemonCardProps> = ({
  poetryAnalysis,
  marineData,
  marketData,
  onChainConfig,
  hydraState,
  onClose,
  onDownloadCard
}) => {
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize and run WebGL shader inside the center card window
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

    const seedNum = parseTxHash(onChainConfig.txHash);
    let pixelRes = poetryAnalysis.digitCount > 0 ? Math.max(6.0, 48.0 - poetryAnalysis.digitCount * 4.0) : 0.0;
    let gridLines = poetryAnalysis.consonantCount > 2 ? 4.0 + (poetryAnalysis.consonantCount % 12) * 2.0 : 0.0;

    const render = (now: number) => {
      if (!isRunning) return;
      const elapsed = (now - startTime) * 0.001;

      gl.useProgram(program);

      if (uMap.u_resolution) gl.uniform2f(uMap.u_resolution, gl.canvas.width, gl.canvas.height);
      if (uMap.u_time) gl.uniform1f(uMap.u_time, elapsed);
      if (uMap.u_wave_height) gl.uniform1f(uMap.u_wave_height, marineData.waveHeight);
      if (uMap.u_wave_period) gl.uniform1f(uMap.u_wave_period, marineData.wavePeriod);
      if (uMap.u_wave_dir) gl.uniform1f(uMap.u_wave_dir, marineData.waveDirection);
      if (uMap.u_tide) gl.uniform1f(uMap.u_tide, marineData.tideLevel);
      if (uMap.u_volatility) gl.uniform1f(uMap.u_volatility, marketData.volatilityIndex / 100.0);
      if (uMap.u_liquidity) gl.uniform1f(uMap.u_liquidity, marketData.depthRatio);

      if (uMap.u_char_count) gl.uniform1f(uMap.u_char_count, poetryAnalysis.length);
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
        const domH = poetryAnalysis.dominantHue;
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
  }, [poetryAnalysis, marineData, marketData, onChainConfig, hydraState]);

  const handleCaptureCard = () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `carta-token-${onChainConfig.tokenId}-brittany.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (onDownloadCard) onDownloadCard();
  };

  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-lg group">
      {/* Holographic radiant glow */}
      <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500/30 via-purple-500/30 to-amber-500/30 blur-2xl opacity-80 pointer-events-none" />

      {/* Collectible Holographic Card Body */}
      <div 
        ref={cardContainerRef}
        className="relative rounded-[2rem] p-3 sm:p-4 bg-gradient-to-b from-slate-900 via-black to-slate-950 border-2 border-cyan-400/40 shadow-2xl overflow-hidden backdrop-blur-3xl text-slate-100 flex flex-col justify-between"
      >
        {/* Holographic foil sheen bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 via-pink-400 to-amber-400" />

        {/* 1. TOP CARD HEADER: Hash, Token ID & Owner Brittany */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase font-bold tracking-wider">
                CARTA COLECCIONABLE
              </span>
              <h2 className="text-xs sm:text-sm font-bold font-cinzel text-white tracking-wide">
                POESÍA ON-CHAIN
              </h2>
            </div>
            
            {/* Hash & Owner Brittany Badge */}
            <div className="text-[10px] font-mono text-cyan-300/90 mt-0.5 flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">POSEEDORA: {onChainConfig.minterName}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 truncate max-w-[120px] sm:max-w-none">
                {onChainConfig.txHash.slice(0, 8)}...{onChainConfig.txHash.slice(-6)}
              </span>
            </div>
          </div>

          {/* Top Right: Token ID & HP Element */}
          <div className="text-right flex items-center gap-1.5 shrink-0">
            <div>
              <div className="text-xs sm:text-sm font-bold font-mono text-white">
                <span className="text-amber-400">TOKEN #{onChainConfig.tokenId}</span>
              </div>
              <div className="text-[9px] font-mono text-emerald-400">
                111 HP / FLORIPA
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md border border-white/20">
              <Droplets className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 2. CENTER WINDOW: The Live Generative Hydra Animation in the Center! */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner bg-black my-1">
          <canvas
            ref={cardCanvasRef}
            className="w-full h-full block select-none"
          />

          {/* Subtle live indicator in card window */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-mono text-cyan-300 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>EN VIVO (60 FPS)</span>
          </div>

          <button
            onClick={handleCaptureCard}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 text-[9px] font-mono transition-all flex items-center gap-1"
            title="Descargar arte"
          >
            <Camera className="w-3 h-3" />
            <span>PNG</span>
          </button>
        </div>

        {/* 3. BOTTOM SECTION: The 111-character poetry + Floripa waves + AMM data */}
        <div className="space-y-2 mt-2 px-1">
          
          {/* Poetry Flavor Text Box */}
          <div className="p-2.5 bg-white/[0.04] border border-white/10 rounded-xl relative">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
              <span className="flex items-center gap-1 text-cyan-300 font-semibold tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                CANTO DE 111 CARACTERES
              </span>
              <span className="font-bold text-white">
                {poetryAnalysis.length}/111
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-100 font-cinzel italic leading-relaxed">
              "{poetryAnalysis.text || 'Sin palabras en el agua...'}"
            </p>
          </div>

          {/* Card Moves / Marine & Market Stats */}
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            {/* Marine Wave Stats */}
            <div className="p-2 bg-black/50 border border-cyan-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <div className="text-white font-bold truncate">Olas Floripa</div>
                  <div className="text-slate-400 text-[9px]">
                    {marineData.waveHeight}m · {marineData.wavePeriod}s ({marineData.tidePhase})
                  </div>
                </div>
              </div>
            </div>

            {/* Market & Gas Stats */}
            <div className="p-2 bg-black/50 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="text-white font-bold truncate">AMM & Gas</div>
                  <div className="text-slate-400 text-[9px]">
                    ${marketData.priceUsd.toFixed(1)} · {marketData.gasGwei} Gwei
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. CARD FOOTER: Verification stamp */}
          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>TOKEN VERIFICADO ON-CHAIN</span>
              <span>•</span>
              <span className="text-cyan-300 font-bold">{onChainConfig.network}</span>
            </div>

            <div className="text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>BRITTANY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
