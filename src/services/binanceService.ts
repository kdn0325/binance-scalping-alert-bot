import axios from "axios";

import {
  BinanceKlineResponse,
  BinanceTickerResponse,
  CoinPrice,
} from "../types/binance";

const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3";

export interface BinanceServiceConfig {
  minChange5min: number; // 5분 최소 변동률
  minVolumeSpike: number; // 볼륨 스파이크 배수
  minVolume: number; // 최소 거래량
}

export class BinanceService {
  private config: BinanceServiceConfig;
  private volumeHistory: Map<string, number[]> = new Map();
  private priceHistory: Map<string, number[]> = new Map();

  constructor(config: BinanceServiceConfig) {
    this.config = config;
  }

  // 단타 급등 코인 찾기 (5분/15분 기준)
  async findScalpingCoins(): Promise<CoinPrice[]> {
    try {
      const response = await axios.get<BinanceTickerResponse[]>(
        `${BINANCE_API_BASE_URL}/ticker/24hr`
      );

      const tickers = response.data.filter((t) => t.symbol.endsWith("USDT"));
      const scalpingCoins: CoinPrice[] = [];

      for (const ticker of tickers) {
        const symbol = ticker.symbol;
        const currentPrice = parseFloat(ticker.lastPrice);
        const volume24h = parseFloat(ticker.quoteVolume);

        // 최소 거래량 필터
        if (volume24h < this.config.minVolume) continue;

        // 5분, 15분 데이터 가져오기
        const changes = await this.getShortTermChanges(symbol, currentPrice);
        if (!changes) continue;

        const { change5min, change15min, volumeSpike, rsi } = changes;

        // 단타 조건: 5분 급등 + 볼륨 스파이크
        if (
          change5min >= this.config.minChange5min &&
          volumeSpike >= this.config.minVolumeSpike &&
          rsi < 80 // 과매수 아님
        ) {
          scalpingCoins.push({
            symbol,
            currentPrice,
            change5min,
            change15min,
            volumeSpike,
            rsi,
            entryPrice: currentPrice,
            targetPrice: currentPrice * 1.03, // +3% 익절
            stopLoss: currentPrice * 0.98, // -2% 손절
            timestamp: Date.now(),
          });
        }
      }

      // 5분 변동률 + 볼륨 스파이크 순으로 정렬
      return scalpingCoins.sort(
        (a, b) => b.change5min * b.volumeSpike - a.change5min * a.volumeSpike
      );
    } catch (error) {
      console.error("Error finding scalping coins:", error);
      return [];
    }
  }

  // 5분, 15분 변동률 및 볼륨 스파이크 계산
  private async getShortTermChanges(
    symbol: string,
    currentPrice: number
  ): Promise<{
    change5min: number;
    change15min: number;
    volumeSpike: number;
    rsi: number;
  } | null> {
    try {
      // 1분봉 20개 = 20분 데이터
      const klines = await axios.get<BinanceKlineResponse[]>(
        `${BINANCE_API_BASE_URL}/klines`,
        {
          params: {
            symbol,
            interval: "1m",
            limit: 20,
          },
        }
      );

      const data = klines.data;
      if (data.length < 20) return null;

      const prices = data.map((k) => parseFloat(k.close));
      const volumes = data.map((k) => parseFloat(k.quoteVolume));

      // 5분 변동률 (최근 5개)
      const price5minAgo = prices[prices.length - 6];
      const change5min = ((currentPrice - price5minAgo) / price5minAgo) * 100;

      // 15분 변동률 (최근 15개)
      const price15minAgo = prices[prices.length - 16];
      const change15min =
        ((currentPrice - price15minAgo) / price15minAgo) * 100;

      // 볼륨 스파이크 (최근 5분 vs 이전 평균)
      const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0);
      const avgVolume = volumes.slice(0, 15).reduce((a, b) => a + b, 0) / 15;
      const volumeSpike = recentVolume / 5 / avgVolume;

      // RSI 계산 (14 기간)
      const rsi = this.calculateRSI(prices.slice(-14));

      return { change5min, change15min, volumeSpike, rsi };
    } catch (error) {
      return null;
    }
  }

  // RSI 계산
  private calculateRSI(prices: number[]): number {
    if (prices.length < 14) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / (prices.length - 1);
    const avgLoss = losses / (prices.length - 1);

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }
}
