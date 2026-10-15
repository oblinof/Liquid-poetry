// Hydra-Style Live Visual Synthesis Engine
// Every character acts as an operator/parameter in a visual synthesis graph.
// Mutates deterministically every hour!

export type HydraOperatorType = 
  | 'oscillator'      // Frequency, wave speed & harmonic stripes
  | 'kaleidoscope'    // Radial mirror folding (kaleid 2 to 16)
  | 'rotate'          // Angular rotation velocity
  | 'modulate'        // Domain warping / fluid spatial distortion
  | 'glitch'          // Scanline RGB splitting & CRT feedback
  | 'chroma'          // Psychedelic color phase rotation & RGB shifts
  | 'voronoi'         // Cellular liquid caustics
  | 'feedback'        // Temporal trails & recursive echo
  | 'scale'           // Zoom breathing & fractal magnification
  | 'laser_prism';    // Radiating polygonal energy rays

export interface CharacterHydraOperator {
  char: string;
  op: HydraOperatorType;
  label: string;
  paramA: number; // e.g. freq / sides / warp intensity
  paramB: number; // e.g. speed / phase / offset
  colorPhase: number;
}

export interface HydraSynthesizerState {
  epochHour: number;
  timeRemainingMinutes: number;
  // Accumulated parameters driven by typed text
  kaleidSides: number;          // 0 (none) to 16-fold
  oscFreq: number;              // 1 to 40
  oscSpeed: number;             // 0.2 to 4.0
  modulateAmp: number;          // 0 to 2.5 (spatial warping)
  rotateSpeed: number;          // -3.0 to 3.0
  glitchIntensity: number;      // 0 to 1.0
  chromaSpeed: number;          // 0.1 to 5.0
  voronoiDensity: number;       // 2 to 30
  feedbackDecay: number;        // 0.05 to 0.4
  scaleZoom: number;            // 0.5 to 3.0
  laserRays: number;            // 0 to 24
  dominantOperator: HydraOperatorType;
  dominantLabel: string;
  activeOperatorList: { char: string; op: HydraOperatorType; label: string; count: number }[];
  rulesMap: Record<string, CharacterHydraOperator>;
}

const OPERATOR_DEFS: {
  id: HydraOperatorType;
  label: string;
}[] = [
  { id: 'oscillator', label: 'Harmonic Oscillator' },
  { id: 'kaleidoscope', label: 'Radial Kaleidoscope' },
  { id: 'rotate', label: 'Spatial Rotation' },
  { id: 'modulate', label: 'Domain Warp / Modulator' },
  { id: 'glitch', label: 'CRT Glitch Fracture' },
  { id: 'chroma', label: 'Chromatic Shift' },
  { id: 'voronoi', label: 'Cellular Voronoi' },
  { id: 'feedback', label: 'Feedback Echo' },
  { id: 'scale', label: 'Fractal Scaling' },
  { id: 'laser_prism', label: 'Laser Prism Rays' }
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate the unique rules for all characters for a specific hour epoch
export function getHourlyHydraRules(epochHour?: number): Record<string, CharacterHydraOperator> {
  const currentEpoch = epochHour !== undefined ? epochHour : Math.floor(Date.now() / 3600000);
  const rng = mulberry32(currentEpoch * 7777 + 42);

  const rules: Record<string, CharacterHydraOperator> = {};
  const allChars = 'abcdefghijklmnopqrstuvwxyz0123456789áéíóúñ.,!? ';

  for (let i = 0; i < allChars.length; i++) {
    const char = allChars[i];
    let opIndex: number;

    // Numbers inherently lean slightly towards symmetry / frequency
    if (/[0-9]/.test(char)) {
      const num = parseInt(char, 10);
      opIndex = num % 2 === 0 ? 1 : 0; // kaleidoscope or oscillator
    } else {
      opIndex = Math.floor(rng() * OPERATOR_DEFS.length);
    }

    const def = OPERATOR_DEFS[opIndex];
    rules[char] = {
      char,
      op: def.id,
      label: def.label,
      paramA: 0.5 + rng() * 3.5,
      paramB: 0.2 + rng() * 2.8,
      colorPhase: Math.floor(rng() * 360)
    };
  }

  return rules;
}

// Compute the live Hydra synthesis parameters for the current text
export function calculateHydraState(text: string): HydraSynthesizerState {
  const now = new Date();
  const epochHour = Math.floor(now.getTime() / 3600000);
  const timeRemainingMinutes = 60 - now.getMinutes();
  const rulesMap = getHourlyHydraRules(epochHour);

  // Default base state (waiting for poetry)
  let kaleidSides = 0;
  let oscFreq = 4.0;
  let oscSpeed = 0.8;
  let modulateAmp = 0.2;
  let rotateSpeed = 0.3;
  let glitchIntensity = 0.0;
  let chromaSpeed = 0.5;
  let voronoiDensity = 6.0;
  let feedbackDecay = 0.15;
  let scaleZoom = 1.0;
  let laserRays = 0;

  const opCounts: Record<HydraOperatorType, number> = {
    oscillator: 0,
    kaleidoscope: 0,
    rotate: 0,
    modulate: 0,
    glitch: 0,
    chroma: 0,
    voronoi: 0,
    feedback: 0,
    scale: 0,
    laser_prism: 0
  };

  const charCounts: Record<string, number> = {};

  for (const rawChar of text) {
    const char = rawChar.toLowerCase();
    charCounts[char] = (charCounts[char] || 0) + 1;
    const rule = rulesMap[char];
    if (!rule) continue;

    opCounts[rule.op] = (opCounts[rule.op] || 0) + 1;

    switch (rule.op) {
      case 'kaleidoscope':
        // Sum symmetry folding
        kaleidSides = Math.min(16, (kaleidSides === 0 ? 3 : kaleidSides + 1));
        break;
      case 'oscillator':
        oscFreq += rule.paramA * 1.5;
        oscSpeed += rule.paramB * 0.15;
        break;
      case 'rotate':
        rotateSpeed += (rule.paramA - 2.0) * 0.4;
        break;
      case 'modulate':
        modulateAmp += rule.paramA * 0.25;
        break;
      case 'glitch':
        glitchIntensity = Math.min(1.0, glitchIntensity + 0.18);
        break;
      case 'chroma':
        chromaSpeed += rule.paramA * 0.4;
        break;
      case 'voronoi':
        voronoiDensity += rule.paramA * 1.2;
        break;
      case 'feedback':
        feedbackDecay = Math.max(0.02, feedbackDecay - 0.02);
        break;
      case 'scale':
        scaleZoom += (rule.paramA - 2.0) * 0.2;
        break;
      case 'laser_prism':
        laserRays = Math.min(24, laserRays + 3);
        break;
    }
  }

  // Find dominant operator
  let maxOpCount = 0;
  let dominantOperator: HydraOperatorType = 'oscillator';
  let dominantLabel = 'Primordial Oscillator';

  for (const opKey in opCounts) {
    const k = opKey as HydraOperatorType;
    if (opCounts[k] > maxOpCount) {
      maxOpCount = opCounts[k];
      dominantOperator = k;
      const def = OPERATOR_DEFS.find(d => d.id === k);
      dominantLabel = def ? def.label : k;
    }
  }

  // Sorted list of top characters
  const activeOperatorList = Object.entries(charCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([ch, count]) => {
      const rule = rulesMap[ch];
      return {
        char: ch === ' ' ? '␣' : ch,
        op: rule ? rule.op : 'oscillator',
        label: rule ? rule.label : 'Harmony',
        count
      };
    });

  return {
    epochHour,
    timeRemainingMinutes,
    kaleidSides,
    oscFreq: Math.min(60, oscFreq),
    oscSpeed: Math.min(6.0, oscSpeed),
    modulateAmp: Math.min(3.5, modulateAmp),
    rotateSpeed,
    glitchIntensity,
    chromaSpeed: Math.min(8.0, chromaSpeed),
    voronoiDensity: Math.min(40, voronoiDensity),
    feedbackDecay,
    scaleZoom: Math.max(0.4, Math.min(3.0, scaleZoom)),
    laserRays,
    dominantOperator,
    dominantLabel,
    activeOperatorList,
    rulesMap
  };
}
