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

// Binance Kline은 배열로 응답 [openTime, open, high, low, close, volume, closeTime, quoteVolume, ...]
export type BinanceKlineResponse = [
  number, // 0: openTime
  string, // 1: open
  string, // 2: high
  string, // 3: low
  string, // 4: close
  string, // 5: volume
  number, // 6: closeTime
  string, // 7: quoteVolume
  number, // 8: trades
  string, // 9: takerBuyBaseVolume
  string, // 10: takerBuyQuoteVolume
  string // 11: ignore
];

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
