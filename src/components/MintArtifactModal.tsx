import React, { useState } from 'react';
import { 
  OnChainConfig, 
  PoetryAnalysis, 
  MarineData, 
  MarketData, 
  GenerativeEngineMode, 
  ColorPalette 
} from '../types/generative';
import { 
  X, 
  CheckCircle2, 
  Download, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Cpu, 
  Waves, 
  FileJson, 
  ShieldCheck 
} from 'lucide-react';

interface MintArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  poetryAnalysis: PoetryAnalysis;
  marineData: MarineData;
  marketData: MarketData;
  onChainConfig: OnChainConfig;
  onMintNewArtifact: () => void;
}

export const MintArtifactModal: React.FC<MintArtifactModalProps> = ({
  isOpen,
  onClose,
  poetryAnalysis,
  marineData,
  marketData,
  onChainConfig,
  onMintNewArtifact,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  if (!isOpen) return null;

  // Generate standard ERC-721 token metadata
  const metadata = {
    name: `Poesía On-Chain #${onChainConfig.tokenId}`,
    description: `Obra coleccionable de arte generativo tipo Hydra sintetizada por 111 caracteres de poesía, el oleaje vivo de Florianópolis y liquidez estocástica.`,
    attributes: [
      { trait_type: 'Poesía', value: poetryAnalysis.text },
      { trait_type: 'Caracteres', value: poetryAnalysis.length, max_value: 111 },
      { trait_type: 'Motor Generativo', value: 'Sintetizador de Video Hydra Procedural' },
      { trait_type: 'Altura de Ola (Floripa)', value: `${marineData.waveHeight} m` },
      { trait_type: 'Período Marino', value: `${marineData.wavePeriod} s` },
      { trait_type: 'Estado de Marea', value: marineData.tidePhase },
      { trait_type: 'Volatilidad AMM', value: `${marketData.volatilityIndex.toFixed(0)}%` },
      { trait_type: 'Precio Simulado $POET', value: `$${marketData.priceUsd.toFixed(2)}` },
      { trait_type: 'Entropía Shannon', value: Number(poetryAnalysis.shannonEntropy.toFixed(3)) },
      { trait_type: 'Bloque On-Chain', value: onChainConfig.blockNumber },
      { trait_type: 'Hash Transacción', value: onChainConfig.txHash }
    ],
    compiler: 'Floripa Generative Synthesizer v1.11',
    created_at: new Date(onChainConfig.mintTimestamp).toISOString()
  };

  const metadataString = JSON.stringify(metadata, null, 2);

  const handleCopyMetadata = () => {
    navigator.clipboard.writeText(metadataString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([metadataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `token-${onChainConfig.tokenId}-metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateMint = () => {
    setIsMinting(true);
    setTimeout(() => {
      onMintNewArtifact();
      setIsMinting(false);
      setMintSuccess(true);
      setTimeout(() => setMintSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-cinzel">
                Certificado On-Chain & Metadatos ERC-721
              </h2>
              <p className="text-xs text-slate-400">
                Inmutabilidad criptográfica de la poesía, marea y parámetros
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-slate-200">
          {/* Token Certificate Card */}
          <div className="p-5 bg-gradient-to-br from-black/80 via-slate-900/60 to-black/80 border border-emerald-500/30 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-sm font-bold text-white tracking-wider">
                  TOKEN #{onChainConfig.tokenId}
                </span>
                <span className="text-xs text-slate-500 font-mono">({onChainConfig.network})</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                VERIFICADO ON-CHAIN
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">TX HASH:</span>
                <span className="text-cyan-400 font-bold truncate max-w-[280px]">
                  {onChainConfig.txHash}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">BLOQUE:</span>
                <span className="text-white">#{onChainConfig.blockNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">POSEEDOR / MINTER:</span>
                <span className="text-amber-400 font-bold">{onChainConfig.minterName} ({onChainConfig.minterAddress})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">ORÁCULO MARINO:</span>
                <span className="text-cyan-300">
                  {marineData.waveHeight}m / {marineData.wavePeriod}s ({marineData.tidePhase})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">POESÍA (HASH SINTÉTICO):</span>
                <span className="text-emerald-300 italic truncate max-w-[280px]">
                  "{poetryAnalysis.text || '(vacio)'}"
                </span>
              </div>
            </div>
          </div>

          {/* Metadata JSON Box */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-cyan-400" />
                METADATOS ERC-721 (OPENSEA & ZORA COMPLIANT):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMetadata}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .json</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-black/90 border border-white/10 rounded-xl text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-48 leading-relaxed">
              {metadataString}
            </pre>
          </div>

          {/* Action to Re-Roll or Mint next */}
          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div>
              <div className="text-white font-semibold">¿Generar nuevo Bloque / Token?</div>
              <div className="text-slate-400 text-[11px]">
                Calcula un nuevo hash de transacción 0x... y semilla aleatoria.
              </div>
            </div>
            <button
              onClick={handleSimulateMint}
              disabled={isMinting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isMinting ? 'animate-spin' : ''}`} />
              <span>{isMinting ? 'Minteando en Bloque...' : 'Mintear Nuevo Token'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firma ECDSA simulada con éxito</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
