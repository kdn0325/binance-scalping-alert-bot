import axios from "axios";

import { BybitTickerResponse, CoinPrice } from "../types/bybit";

const BYBIT_API_BASE_URL = "https://api.bybit.com/v5/market/tickers";

export interface BybitServiceConfig {
  pumpThreshold: number;
  minVolume: number;
}

export class BybitService {
  private pumpThreshold: number;
  private minVolume: number;

  constructor(config: BybitServiceConfig) {
    this.pumpThreshold = config.pumpThreshold;
    this.minVolume = config.minVolume;
  }

  // 바이비트 전체 USDT 마켓 스캔 → 급등 코인 필터링
  async findPumpingCoins(): Promise<CoinPrice[]> {
    try {
      const response = await axios.get<BybitTickerResponse>(
        `${BYBIT_API_BASE_URL}?category=spot`
      );

      if (response.data.retCode !== 0) {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }

      const tickers = response.data.result.list;
      const pumpingCoins: CoinPrice[] = [];

      for (const ticker of tickers) {
        if (!ticker.symbol.endsWith("USDT")) continue;

        const currentPrice = parseFloat(ticker.lastPrice);
        const price24hAgo = parseFloat(ticker.prevPrice24h);
        const volume24h = parseFloat(ticker.turnover24h);
        const change24hPercent = parseFloat(ticker.price24hPcnt) * 100;

        // 필터: 급등률 + 거래량 + 유효한 가격
        if (
          change24hPercent >= this.pumpThreshold &&
          volume24h >= this.minVolume &&
          currentPrice > 0
        ) {
          pumpingCoins.push({
            symbol: ticker.symbol,
            currentPrice,
            price24hAgo,
            change24h: currentPrice - price24hAgo,
            change24hPercent,
            timestamp: Date.now(),
            volume24h,
          });
        }
      }

      // 급등률 높은 순 정렬
      return pumpingCoins.sort(
        (a, b) => b.change24hPercent - a.change24hPercent
      );
    } catch (error) {
      console.error("Error fetching pumping coins:", error);
      throw error;
    }
  }
}
