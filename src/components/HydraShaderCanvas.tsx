import React, { useEffect, useRef } from 'react';
import { MarineData, MarketData, OnChainConfig, PoetryAnalysis } from '../types/generative';
import { HydraSynthesizerState } from '../services/hourlyEngine';

interface HydraShaderCanvasProps {
  poetryAnalysis: PoetryAnalysis;
  marineData: MarineData;
  marketData: MarketData;
  onChainConfig: OnChainConfig;
  hydraState: HydraSynthesizerState;
  onSnapshotReady?: (dataUrl: string) => void;
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

// Marine & Market uniforms
uniform float u_wave_height;
uniform float u_wave_period;
uniform float u_wave_dir;
uniform float u_tide;
uniform float u_volatility;
uniform float u_liquidity;

// Hydra Synthesis operators driven by characters
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

// Pseudo-random noise
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 2D Rotation
vec2 rotate2D(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  
  // Normalized coordinate space [-1, 1]
  vec2 uv = (st - 0.5) * vec2(aspect, 1.0) * 2.0;

  float t = u_time * 0.7;

  // 1. HYDRA OPERATOR: PIXELATE (things that pixelate based on letters/numbers)
  if (u_pixel_res > 1.5) {
    float res = u_pixel_res;
    uv = floor(uv * res) / res;
  }

  // 2. HYDRA OPERATOR: KALEIDOSCOPE (radial folding across space)
  if (u_kaleid > 1.5) {
    float angle = atan(uv.y, uv.x);
    float r = length(uv);
    float segments = u_kaleid;
    float segAngle = 6.2831853 / segments;
    angle = abs(mod(angle, segAngle) - segAngle * 0.5);
    uv = vec2(cos(angle), sin(angle)) * r;
  }

  // 3. HYDRA OPERATOR: ROTATE (angular spin driven by text and ocean direction)
  float rotAngle = t * u_rot_speed + u_wave_dir * 0.01;
  uv = rotate2D(uv, rotAngle);

  // 4. HYDRA OPERATOR: DISTORTION & DOMAIN WARP (modulate space with waves)
  vec2 warpUV = uv;
  float waveCycle = (6.2831853 / max(3.0, u_wave_period)) * t;
  float swellAmp = u_wave_height * 0.4;

  float warpX = sin(uv.y * (u_osc_freq * 0.4) + waveCycle + u_seed) * (u_mod_amp + swellAmp * 0.2);
  float warpY = cos(uv.x * (u_osc_freq * 0.4) - waveCycle - u_seed) * (u_mod_amp + swellAmp * 0.2);
  uv += vec2(warpX, warpY);

  // 5. HYDRA OPERATOR: OSCILLATORS (horizontal, vertical, diagonal wave bands)
  float f = max(1.0, u_osc_freq);
  float osc1 = sin(uv.x * f + t * u_osc_speed);
  float osc2 = cos(uv.y * (f * 0.85) - t * (u_osc_speed * 0.9));
  float osc3 = sin((uv.x + uv.y) * (f * 0.6) + t * 1.5);
  float oscMix = (osc1 + osc2 + osc3) / 3.0;

  // 6. HYDRA OPERATOR: ORTHOGONAL LINES & SQUARES
  float gridPattern = 0.0;
  if (u_grid_lines > 0.5) {
    vec2 gridCoords = fract(uv * u_grid_lines + t * 0.2);
    float lineX = step(0.92, gridCoords.x) + step(gridCoords.x, 0.08);
    float lineY = step(0.92, gridCoords.y) + step(gridCoords.y, 0.08);
    gridPattern = clamp(lineX + lineY, 0.0, 1.0);
  }

  // 7. LIQUID TIDE & AMM LIQUIDITY FIELD
  float liquidityHyperbola = sin(uv.x * uv.y * 12.0 + t * 2.0) * (0.3 + u_volatility * 0.4);
  float tideCaustic = sin(length(uv) * 16.0 - waveCycle * 2.0 + u_tide * 3.0);

  // Combined intensity field
  float field = oscMix * 0.6 + liquidityHyperbola * 0.25 + tideCaustic * 0.2;
  field += gridPattern * 0.4;

  // 8. PSYCHEDELIC CHROMATIC COLOR SYNTHESIS (Continuous spectral phase)
  float chromaTime = t * u_chroma_speed;
  vec3 col;
  col.r = 0.5 + 0.5 * sin(field * 3.14159 + chromaTime + u_color_phase.x + u_seed);
  col.g = 0.5 + 0.5 * sin(field * 3.14159 * 1.2 + chromaTime * 1.1 + u_color_phase.y + u_tide);
  col.b = 0.5 + 0.5 * sin(field * 3.14159 * 1.4 + chromaTime * 1.3 + u_color_phase.z + u_volatility);

  // Boost contrast and neon saturation
  col = pow(col, vec3(1.2));
  col *= 1.3;

  // 9. HYDRA OPERATOR: QUANTUM CRT GLITCH & RGB SPLIT TEARS
  if (u_glitch > 0.02) {
    float glitchTrigger = step(0.94 - u_glitch * 0.2, hash21(vec2(floor(gl_FragCoord.y / 6.0), floor(t * 15.0))));
    if (glitchTrigger > 0.5) {
      // Horizontal displacement
      float shift = (hash21(vec2(floor(t * 20.0), 3.14)) - 0.5) * (u_glitch * 0.4);
      col.r = 0.5 + 0.5 * sin((field + shift) * 4.0 + chromaTime);
      col.b = 0.5 + 0.5 * cos((field - shift) * 4.0 + chromaTime);
      col += vec3(0.15, -0.1, 0.2) * glitchTrigger;
    }
  }

  // Soft atmospheric vignette
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

export const HydraShaderCanvas: React.FC<HydraShaderCanvasProps> = ({
  poetryAnalysis,
  marineData,
  marketData,
  onChainConfig,
  hydraState,
  onSnapshotReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation>>({});

  // Compile WebGL shaders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { 
      alpha: false, 
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true 
    });

    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Compile Vertex
    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertShader, VERTEX_SHADER_SRC);
    gl.compileShader(vertShader);

    // Compile Fragment
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, FRAGMENT_SHADER_SRC);
    gl.compileShader(fragShader);

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragShader));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;
    gl.useProgram(program);

    // Full quad buffer
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

    // Cache uniforms
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
    uniformsRef.current = uMap;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // 60 FPS Render Loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    let startTime = performance.now();
    let isRunning = true;

    // Derive shader variables from poetry analysis and typed characters
    const textLen = poetryAnalysis.length;
    const { dominantHue, vowelCount, consonantCount, digitCount } = poetryAnalysis;

    // Characters that trigger pixelation (e.g. digits '0'..'9' or vowels)
    let pixelRes = 0.0;
    if (digitCount > 0) {
      pixelRes = Math.max(6.0, 48.0 - digitCount * 4.0); // low res = blocky pixels!
    }

    // Grid lines / squares triggered by consonants
    let gridLines = 0.0;
    if (consonantCount > 2) {
      gridLines = 4.0 + (consonantCount % 12) * 2.0;
    }

    const seedNum = parseTxHash(onChainConfig.txHash);

    const render = (now: number) => {
      if (!isRunning) return;

      const elapsed = (now - startTime) * 0.001;
      const u = uniformsRef.current;

      gl.useProgram(program);

      // Pass resolution & time
      if (u.u_resolution) gl.uniform2f(u.u_resolution, gl.canvas.width, gl.canvas.height);
      if (u.u_time) gl.uniform1f(u.u_time, elapsed);

      // Marine & Market uniforms
      if (u.u_wave_height) gl.uniform1f(u.u_wave_height, marineData.waveHeight);
      if (u.u_wave_period) gl.uniform1f(u.u_wave_period, marineData.wavePeriod);
      if (u.u_wave_dir) gl.uniform1f(u.u_wave_dir, marineData.waveDirection);
      if (u.u_tide) gl.uniform1f(u.u_tide, marineData.tideLevel);
      if (u.u_volatility) gl.uniform1f(u.u_volatility, marketData.volatilityIndex / 100.0);
      if (u.u_liquidity) gl.uniform1f(u.u_liquidity, marketData.depthRatio);

      // Hydra character operators
      if (u.u_char_count) gl.uniform1f(u.u_char_count, textLen);
      if (u.u_osc_freq) gl.uniform1f(u.u_osc_freq, hydraState.oscFreq);
      if (u.u_osc_speed) gl.uniform1f(u.u_osc_speed, hydraState.oscSpeed);
      if (u.u_mod_amp) gl.uniform1f(u.u_mod_amp, hydraState.modulateAmp);
      if (u.u_kaleid) gl.uniform1f(u.u_kaleid, hydraState.kaleidSides);
      if (u.u_glitch) gl.uniform1f(u.u_glitch, hydraState.glitchIntensity);
      if (u.u_pixel_res) gl.uniform1f(u.u_pixel_res, pixelRes);
      if (u.u_grid_lines) gl.uniform1f(u.u_grid_lines, gridLines);
      if (u.u_rot_speed) gl.uniform1f(u.u_rot_speed, hydraState.rotateSpeed);
      if (u.u_chroma_speed) gl.uniform1f(u.u_chroma_speed, hydraState.chromaSpeed);

      // Color phase vector
      if (u.u_color_phase) {
        const rPhase = (dominantHue * Math.PI) / 180.0;
        const gPhase = ((dominantHue + 120.0) * Math.PI) / 180.0;
        const bPhase = ((dominantHue + 240.0) * Math.PI) / 180.0;
        gl.uniform3f(u.u_color_phase, rPhase, gPhase, bPhase);
      }
      if (u.u_seed) gl.uniform1f(u.u_seed, seedNum * 10.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [poetryAnalysis, marineData, marketData, onChainConfig, hydraState]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full block z-0 select-none pointer-events-none"
    />
  );
};
