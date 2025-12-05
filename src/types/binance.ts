// Binance API Types
export interface BinanceTickerResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openPrice: string;
  prevClosePrice: string;
}

export interface BinanceKlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

export interface CoinPrice {
  symbol: string;
  currentPrice: number;
  change5min: number;
  change15min: number;
  volumeSpike: number; // 평균 대비 몇 배
  rsi: number;
  entryPrice: number;
  targetPrice: number; // +3%
  stopLoss: number; // -2%
  timestamp: number;
}
