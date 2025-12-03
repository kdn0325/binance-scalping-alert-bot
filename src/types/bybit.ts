export interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitTicker[];
  };
}

export interface BybitTicker {
  symbol: string;
  lastPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  prevPrice1h: string;
  price1hPcnt: string;
  markPrice: string;
  indexPrice: string;
  openInterest: string;
  turnover24h: string;
  volume24h: string;
  fundingRate: string;
  nextFundingTime: string;
  predictedDeliveryPrice: string;
  basisRate: string;
  deliveryFeeRate: string;
  deliveryTime: string;
}

export interface CoinPrice {
  symbol: string;
  currentPrice: number;
  price24hAgo: number;
  change24h: number;
  change24hPercent: number;
  timestamp: number;
  volume24h?: number;
}
