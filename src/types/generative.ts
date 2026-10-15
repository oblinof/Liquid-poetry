export const MAX_POETRY_CHARS = 111;

export interface MarineData {
  waveHeight: number;       // meters (e.g. 1.8)
  wavePeriod: number;       // seconds (e.g. 12.4)
  waveDirection: number;    // degrees (e.g. 145° SE)
  windWaveHeight: number;   // meters
  swellWaveHeight: number;  // meters
  windSpeed: number;        // km/h
  windDirection: number;    // degrees
  waterTemp: number;        // °C
  tidePhase: 'pleamar' | 'bajamar' | 'flujo' | 'reflujo'; // tidal state
  tideLevel: number;        // -1.0 to 1.0
  location: string;         // 'Praia da Joaquina, Florianópolis (SC)'
  isLive: boolean;
  lastUpdated: string;
}

export interface MarketData {
  pair: string;             // '$FLRPA / $ETH'
  priceUsd: number;         // e.g. 111.45
  priceChange24h: number;   // %
  liquidityTvlUsd: number;  // TVL in USD (e.g. 14,280,000)
  depthRatio: number;       // 0.0 - 1.0
  volatilityIndex: number;  // 0 - 100
  gasGwei: number;          // Gwei
  volume24h: number;        // USD
  slippagePercent: number;  // %
  mempoolTxs: MempoolTx[];
}

export interface MempoolTx {
  id: string;
  type: 'SWAP_BUY' | 'SWAP_SELL' | 'ADD_LIQUIDITY' | 'REMOVE_LIQUIDITY' | 'MINT_POETRY';
  amount: string;
  sender: string;
  hash: string;
  impact: number; // -1 to 1
  timestamp: number;
}

export interface CharacterMetric {
  char: string;
  index: number;
  code: number;
  type: 'vowel' | 'consonant' | 'digit' | 'punctuation' | 'space' | 'special';
  hueContribution: number;      // 0 - 360
  frequencyWeight: number;      // 0.1 - 5.0
  vibrationSpeed: number;       // 0.2 - 3.0
  geometryPolygonSides: number; // 3 - 12
  turbulenceFactor: number;     // 0.0 - 1.0
  harmonicPhase: number;        // radians
}

export interface PoetryAnalysis {
  text: string;
  length: number;
  maxChars: number;
  fillRatio: number;
  vowelCount: number;
  consonantCount: number;
  digitCount: number;
  punctuationCount: number;
  spaceCount: number;
  shannonEntropy: number;       // 0.0 - 5.0
  dominantHue: number;          // 0 - 360
  cadenceRhythm: number;        // wave frequency modulation
  complexityScore: number;      // 0 - 100
  metrics: CharacterMetric[];
  characterFrequencyMap: Record<string, number>;
}

export type GenerativeEngineMode = 
  | 'mar_infinito'      // Flow field vector particles & ocean turbulence
  | 'codice_glifico'     // Sacred geometry, radial orbital glyph mandala
  | 'marea_cromatica'   // Dynamic topographic wave ribbons & chromatic fluid
  | 'malla_cuantica';    // On-chain quantum lattice & liquidity attractor nodes

export type ColorPalette = 
  | 'abismo_bioluminiscente' // Cyan, deep navy, neon teal
  | 'oro_cripto'             // Amber, gold, obsidian, brass
  | 'horizonte_floripa'      // Sunset coral, turquoise, deep ocean blue
  | 'éter_aurora'            // Violet, magenta, mint, dark emerald
  | 'monocromo_onchain';     // Platinum, graphite, pure laser white

export interface OnChainConfig {
  txHash: string;
  blockNumber: number;
  minterAddress: string;
  minterName: string;
  tokenId: number;
  mintTimestamp: number;
  network: string;
  isMinted: boolean;
}

export interface MintedSnapshot {
  tokenId: number;
  txHash: string;
  blockNumber: number;
  minterName: string;
  minterAddress: string;
  mintTimestamp: number;
  network: string;
  poetryText: string;
  poetryLength: number;
  dominantHue: number;
  // Fixed immutable data captured at the exact moment of minting:
  fixedMarine: MarineData;
  fixedMarket: MarketData;
}
