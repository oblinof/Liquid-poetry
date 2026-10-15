import { CharacterMetric, PoetryAnalysis } from '../types/generative';

export const MAX_POETRY_CHARS = 111;

// Classification helpers
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ä', 'ë', 'ï', 'ö', 'ü']);
const PLOSIVES = new Set(['p', 'b', 't', 'd', 'k', 'g', 'c', 'q']);
const FRICATIVES = new Set(['f', 'v', 's', 'z', 'j', 'x', 'y', 'w']);
const LIQUIDS_NASALS = new Set(['m', 'n', 'ñ', 'l', 'r']);

export function analyzePoetry(rawText: string): PoetryAnalysis {
  // Truncate to maximum 111 characters
  const text = rawText.slice(0, MAX_POETRY_CHARS);
  const length = text.length;
  const fillRatio = length / MAX_POETRY_CHARS;

  let vowelCount = 0;
  let consonantCount = 0;
  let digitCount = 0;
  let punctuationCount = 0;
  let spaceCount = 0;

  const charFreqMap: Record<string, number> = {};
  const metrics: CharacterMetric[] = [];

  let hueAccumulator = 180; // start ocean cyan
  let cadenceAccumulator = 0;

  for (let i = 0; i < length; i++) {
    const char = text[i];
    const lower = char.toLowerCase();
    const code = char.charCodeAt(0);

    // Track frequency
    charFreqMap[char] = (charFreqMap[char] || 0) + 1;

    let type: CharacterMetric['type'] = 'special';
    let hueContribution = (code * 17 + i * 7) % 360;
    let frequencyWeight = 1.0;
    let vibrationSpeed = 1.0;
    let geometryPolygonSides = 4;
    let turbulenceFactor = 0.3;

    if (/\s/.test(char)) {
      type = 'space';
      spaceCount++;
      frequencyWeight = 0.4;
      vibrationSpeed = 0.5;
      geometryPolygonSides = 0;
      turbulenceFactor = 0.05;
      hueContribution = 200; // deep blue calm
    } else if (/[0-9]/.test(char)) {
      type = 'digit';
      digitCount++;
      const num = parseInt(char, 10);
      geometryPolygonSides = num === 0 ? 10 : Math.max(3, num + 2);
      frequencyWeight = 1.5 + num * 0.3;
      vibrationSpeed = 1.2 + num * 0.15;
      turbulenceFactor = 0.4 + (num % 5) * 0.1;
      hueContribution = (40 + num * 32) % 360; // warm crypto/golden spectrum
    } else if (VOWELS.has(lower)) {
      type = 'vowel';
      vowelCount++;
      frequencyWeight = 1.8;
      vibrationSpeed = 0.8; // smooth, deep breathing
      geometryPolygonSides = 6; // hexagons/smooth circles
      turbulenceFactor = 0.15; // low turbulence, high fluidity
      // Specific vowel hues:
      const vowelHueMap: Record<string, number> = {
        'a': 195, // turquoise ocean
        'e': 165, // emerald mint
        'i': 275, // violet electric
        'o': 215, // deep oceanic blue
        'u': 240, // ultramarine
      };
      hueContribution = vowelHueMap[lower] || 200;
    } else if (/[a-záéíóúñ]/i.test(char)) {
      type = 'consonant';
      consonantCount++;
      if (PLOSIVES.has(lower)) {
        frequencyWeight = 2.4;
        vibrationSpeed = 2.2;
        geometryPolygonSides = 3; // triangles, sharp vertexes
        turbulenceFactor = 0.85; // sudden burst
        hueContribution = (15 + code * 13) % 360; // fiery coral / magenta
      } else if (FRICATIVES.has(lower)) {
        frequencyWeight = 1.6;
        vibrationSpeed = 1.7;
        geometryPolygonSides = 5; // pentagons, swirls
        turbulenceFactor = 0.65; // vortex eddies
        hueContribution = (130 + code * 19) % 360; // seafoam green / aqua
      } else if (LIQUIDS_NASALS.has(lower)) {
        frequencyWeight = 1.2;
        vibrationSpeed = 1.0;
        geometryPolygonSides = 8; // octagons, rounded
        turbulenceFactor = 0.25; // gliding river flow
        hueContribution = (210 + code * 11) % 360; // deep oceanic indigo
      } else {
        geometryPolygonSides = 4;
        frequencyWeight = 1.1;
        vibrationSpeed = 1.2;
        turbulenceFactor = 0.4;
      }
    } else {
      type = 'punctuation';
      punctuationCount++;
      frequencyWeight = 3.0;
      vibrationSpeed = 2.8;
      geometryPolygonSides = 12; // celestial ring burst
      turbulenceFactor = 0.9;
      hueContribution = 50; // radiant electric burst
    }

    const harmonicPhase = (i / MAX_POETRY_CHARS) * Math.PI * 4;

    metrics.push({
      char,
      index: i,
      code,
      type,
      hueContribution,
      frequencyWeight,
      vibrationSpeed,
      geometryPolygonSides,
      turbulenceFactor,
      harmonicPhase
    });

    hueAccumulator += hueContribution * 0.05;
    cadenceAccumulator += (code % 7) - 3;
  }

  // Shannon entropy calculation
  let shannonEntropy = 0;
  if (length > 0) {
    for (const char in charFreqMap) {
      const p = charFreqMap[char] / length;
      shannonEntropy -= p * Math.log2(p);
    }
  }

  const dominantHue = (hueAccumulator + (length * 13)) % 360;
  const cadenceRhythm = length > 0 ? (Math.abs(cadenceAccumulator) / length) * 2 + 0.5 : 1.0;
  const complexityScore = Math.min(100, Math.round(
    (shannonEntropy * 15) + (fillRatio * 30) + (digitCount * 3) + (punctuationCount * 4)
  ));

  return {
    text,
    length,
    maxChars: MAX_POETRY_CHARS,
    fillRatio,
    vowelCount,
    consonantCount,
    digitCount,
    punctuationCount,
    spaceCount,
    shannonEntropy,
    dominantHue,
    cadenceRhythm,
    complexityScore,
    metrics,
    characterFrequencyMap: charFreqMap
  };
}

export const POETRY_PRESETS = [
  {
    title: 'Floripa Swell',
    author: 'South Atlantic Ocean',
    text: 'At Joaquina breaks the salty sea, 111 sighs of foam and wind kept by the moon in its eternal crypto block.',
    vibe: 'Deep Ocean'
  },
  {
    title: 'Quantum Abyss',
    author: 'On-Chain Oracle',
    text: '0xFloripa: high tide liquidity, a hundred ether waves converge where silence mines its own deep reflection.',
    vibe: 'Crypto Mystic'
  },
  {
    title: 'Silicon & Tides',
    author: 'Marine Synthesizer',
    text: '111 characters pulse on the reef; every letter is an ocean current, every number dissolves the morning light.',
    vibe: 'Digital Coast'
  },
  {
    title: 'Starlight Wake',
    author: 'Brittany',
    text: 'Phosphor waves crash on the shore, titanium foam drifts in the breeze while Brittany’s words bind into code.',
    vibe: 'Eternal Verse'
  }
];

