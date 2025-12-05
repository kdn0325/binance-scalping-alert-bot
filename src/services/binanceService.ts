import axios from "axios";

import {
  BinanceKlineResponse,
  BinanceTickerResponse,
  CoinPrice,
} from "../types/binance";

const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3";

export interface BinanceServiceConfig {
  minChange5min: number;
  minVolumeSpike: number;
  minVolume: number;
}

export class BinanceService {
  private config: BinanceServiceConfig;
  private tradingSymbols: Set<string> = new Set();
  private lastSymbolUpdate: number = 0;

  constructor(config: BinanceServiceConfig) {
    this.config = config;
  }

  // 거래 가능한 심볼 목록 가져오기 (10분마다 갱신)
  private async getTradingSymbols(): Promise<Set<string>> {
    const now = Date.now();
    if (
      now - this.lastSymbolUpdate < 10 * 60 * 1000 &&
      this.tradingSymbols.size > 0
    ) {
      return this.tradingSymbols;
    }

    try {
      const response = await axios.get(`${BINANCE_API_BASE_URL}/exchangeInfo`);
      this.tradingSymbols = new Set(
        response.data.symbols
          .filter(
            (s: any) => s.status === "TRADING" && s.symbol.endsWith("USDT")
          )
          .map((s: any) => s.symbol)
      );
      this.lastSymbolUpdate = now;
      console.log(`   ✅ 거래 가능 심볼: ${this.tradingSymbols.size}개`);
    } catch (error) {
      console.error("거래 심볼 목록 가져오기 실패:", error);
    }

    return this.tradingSymbols;
  }

  // 단타 급등 코인 찾기
  async findScalpingCoins(): Promise<CoinPrice[]> {
    try {
      // 거래 가능한 심볼 목록 가져오기
      const tradingSymbols = await this.getTradingSymbols();

      // 1단계: 24시간 데이터로 빠른 필터링
      const response = await axios.get<BinanceTickerResponse[]>(
        `${BINANCE_API_BASE_URL}/ticker/24hr`
      );

      const tickers = response.data
        .filter((t) => t.symbol.endsWith("USDT"))
        .filter((t) => tradingSymbols === null || tradingSymbols.has(t.symbol)) // 거래 가능한 코인만
        .filter((t) => {
          const volume = parseFloat(t.quoteVolume);
          const change24h = parseFloat(t.priceChangePercent);
          // 24시간 0% 이상 + 최소 거래량
          return volume >= this.config.minVolume && change24h >= 0;
        }); // 모든 후보 스캔 (제한 없음)

      console.log(`   📋 후보: ${tickers.length}개 (거래 가능 + 24h 0%↑)`);

      const scalpingCoins: CoinPrice[] = [];

      // 2단계: 5분 데이터 상세 분석
      for (const ticker of tickers) {
        const symbol = ticker.symbol;
        const currentPrice = parseFloat(ticker.lastPrice);

        const changes = await this.getShortTermChanges(symbol, currentPrice);
        if (!changes) continue;

        const { change5min, change15min, volumeSpike, rsi } = changes;

        // 단타 조건 체크
        if (
          change5min >= this.config.minChange5min &&
          volumeSpike >= this.config.minVolumeSpike &&
          rsi < 80
        ) {
          scalpingCoins.push({
            symbol,
            currentPrice,
            change5min,
            change15min,
            volumeSpike,
            rsi,
            entryPrice: currentPrice,
            targetPrice: currentPrice * 1.03,
            stopLoss: currentPrice * 0.98,
            timestamp: Date.now(),
          });
        }
      }

      // 5분 변동률 높은 순 정렬
      return scalpingCoins.sort((a, b) => b.change5min - a.change5min);
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

      const prices = data.map((k) => parseFloat(k[4])); // close price
      const volumes = data.map((k) => parseFloat(k[7])); // quote volume

      // 5분 변동률
      const price5minAgo = prices[prices.length - 6];
      const change5min = ((currentPrice - price5minAgo) / price5minAgo) * 100;

      // 15분 변동률
      const price15minAgo = prices[prices.length - 16];
      const change15min =
        ((currentPrice - price15minAgo) / price15minAgo) * 100;

      // 볼륨 스파이크 (최근 5분 vs 이전 평균)
      const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const avgVolume = volumes.slice(0, 15).reduce((a, b) => a + b, 0) / 15;
      const volumeSpike = avgVolume > 0 ? recentVolume / avgVolume : 0;

      // RSI 계산
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
