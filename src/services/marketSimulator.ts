import { MarineData, MarketData, MempoolTx, PoetryAnalysis } from '../types/generative';

export class MarketSimulator {
  private data: MarketData;
  private txCounter: number = 1000;

  constructor() {
    this.data = {
      pair: '$POET / $FLRPA',
      priceUsd: 111.85,
      priceChange24h: +4.82,
      liquidityTvlUsd: 14250000,
      depthRatio: 0.78,
      volatilityIndex: 32,
      gasGwei: 21,
      volume24h: 3420800,
      slippagePercent: 0.45,
      mempoolTxs: []
    };

    // Pre-populate mempool
    for (let i = 0; i < 5; i++) {
      this.generateMempoolTx(null, null);
    }
  }

  public getMarketData(): MarketData {
    return { ...this.data };
  }

  public step(marine: MarineData, poetry: PoetryAnalysis | null): MarketData {
    // Wave height directly amplifies volatility
    // Typical waves: 1.0m - 3.5m -> Volatility: 15% - 90%
    const marineVolFactor = Math.min(100, Math.max(10, (marine.waveHeight / 2.0) * 45));
    const poetryEntropyFactor = poetry ? (poetry.shannonEntropy / 4.5) * 20 : 10;
    
    // Target volatility based on real live sea state + poetry
    const targetVol = Math.min(95, Math.max(8, marineVolFactor + poetryEntropyFactor));
    // Smooth transition
    this.data.volatilityIndex += (targetVol - this.data.volatilityIndex) * 0.12;

    // Tide influence on liquidity: High tide = deep pool; Low tide = shallow pool
    const tideMultiplier = 1 + (marine.tideLevel * 0.2); // +/- 20%
    const baseTvl = 14000000 * tideMultiplier;
    this.data.liquidityTvlUsd += (baseTvl - this.data.liquidityTvlUsd) * 0.05;

    // Gas Gwei surges with high waves and high poetry length
    const waveGas = Math.round(14 + (marine.waveHeight * 12) + (poetry ? poetry.length * 0.15 : 0));
    this.data.gasGwei += (waveGas - this.data.gasGwei) * 0.2;

    // Random walk with ocean wave frequency drift
    const drift = Math.sin(Date.now() / 4000) * (this.data.volatilityIndex / 100) * 0.8;
    const noise = (Math.random() - 0.49) * (this.data.volatilityIndex / 40);
    this.data.priceUsd = Math.max(1.0, this.data.priceUsd + drift + noise);
    this.data.priceChange24h += (noise * 0.05);

    // Slippage expands when TVL drops or volatility spikes
    this.data.slippagePercent = Number((0.2 + (this.data.volatilityIndex / 80) * 1.8).toFixed(2));
    this.data.depthRatio = Math.max(0.1, Math.min(1.0, this.data.liquidityTvlUsd / 20000000));

    // Occasionally push a new mempool transaction
    if (Math.random() < 0.6) {
      this.generateMempoolTx(marine, poetry);
    }

    return { ...this.data };
  }

  public triggerShock(type: 'WHALE_BUY' | 'WHALE_SELL' | 'TIDAL_SURGE' | 'FLASH_CRASH') {
    switch (type) {
      case 'WHALE_BUY':
        this.data.priceUsd *= 1.15;
        this.data.priceChange24h += 15.0;
        this.data.liquidityTvlUsd += 1200000;
        this.data.volatilityIndex = Math.min(100, this.data.volatilityIndex + 25);
        this.pushTx('SWAP_BUY', '350.0 ETH -> 39,200 $POET', '0x71a...99b', 0.9);
        break;
      case 'WHALE_SELL':
        this.data.priceUsd *= 0.88;
        this.data.priceChange24h -= 12.0;
        this.data.volatilityIndex = Math.min(100, this.data.volatilityIndex + 30);
        this.pushTx('SWAP_SELL', '25,000 $POET -> 218.4 ETH', '0x32f...c0a', -0.85);
        break;
      case 'TIDAL_SURGE':
        this.data.liquidityTvlUsd *= 1.4;
        this.data.gasGwei += 45;
        this.pushTx('ADD_LIQUIDITY', '+$2.5M Liquidity Pool Joaquina-AMM', '0xFloripa...Pool', 0.5);
        break;
      case 'FLASH_CRASH':
        this.data.priceUsd *= 0.78;
        this.data.volatilityIndex = 98;
        this.data.gasGwei += 90;
        this.pushTx('REMOVE_LIQUIDITY', '-$1.8M Retiro de Urgencia', '0xPanic...999', -0.95);
        break;
    }
  }

  private generateMempoolTx(marine: MarineData | null, poetry: PoetryAnalysis | null) {
    this.txCounter++;
    const isBuy = Math.random() > 0.45;
    const ethAmt = (0.5 + Math.random() * 22).toFixed(2);
    const poetAmt = Math.round(Number(ethAmt) * 111.1);

    const txType: MempoolTx['type'] = isBuy ? 'SWAP_BUY' : 'SWAP_SELL';
    const desc = isBuy 
      ? `Swap ${ethAmt} ETH → ${poetAmt.toLocaleString()} POET`
      : `Swap ${poetAmt.toLocaleString()} POET → ${ethAmt} ETH`;

    const randomHex = Math.random().toString(16).substring(2, 8);
    const hash = `0x${randomHex}...${Math.random().toString(16).substring(2, 6)}`;
    const sender = `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;

    this.pushTx(txType, desc, sender, isBuy ? 0.3 : -0.3, hash);
  }

  private pushTx(
    type: MempoolTx['type'],
    amount: string,
    sender: string,
    impact: number,
    hash?: string
  ) {
    const newTx: MempoolTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type,
      amount,
      sender,
      hash: hash || `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
      impact,
      timestamp: Date.now()
    };

    this.data.mempoolTxs = [newTx, ...this.data.mempoolTxs.slice(0, 7)];
  }
}
