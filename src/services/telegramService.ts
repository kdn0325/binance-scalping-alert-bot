import TelegramBot from "node-telegram-bot-api";

import { CoinPrice } from "../types/binance";

export interface TelegramServiceConfig {
  token: string;
  chatId: string;
}

export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;
  private lastAlertedCoins: Set<string> = new Set();

  constructor(config: TelegramServiceConfig) {
    this.bot = new TelegramBot(config.token, { polling: false });
    this.chatId = config.chatId;
  }

  private formatScalpingAlert(coins: CoinPrice[]): string {
    if (coins.length === 0) return "";

    const messages = coins.map((coin, index) => {
      const coinName = coin.symbol.replace("USDT", "");

      // 신호 강도 계산
      const signalStrength = this.getSignalStrength(coin);
      const riskLevel = this.getRiskLevel(coin);

      return `${index + 1}. <b>${coinName}</b> ${signalStrength}
   
   🎯 <b>진입가:</b> $${coin.entryPrice.toFixed(6)}
   ✅ <b>목표가:</b> $${coin.targetPrice.toFixed(6)} (+3%)
   ❌ <b>손절가:</b> $${coin.stopLoss.toFixed(6)} (-2%)
   
   📊 5분: <b>+${coin.change5min.toFixed(
     2
   )}%</b> | 15분: +${coin.change15min.toFixed(2)}%
   🔥 볼륨: <b>${coin.volumeSpike.toFixed(1)}배</b> 급증
   📈 RSI: ${coin.rsi.toFixed(0)} ${this.getRSIStatus(coin.rsi)}
   
   📍 <a href="https://www.binance.com/en/trade/${coinName}_USDT?type=spot">즉시 차트 확인</a>
   ${riskLevel}`;
    });

    const header = `⚡ <b>단타 급등 알림</b> (Binance)\n${new Date().toLocaleString(
      "ko-KR",
      {
        timeZone: "Asia/Seoul",
      }
    )}\n`;

    return header + messages.join("\n\n");
  }

  private getSignalStrength(coin: CoinPrice): string {
    const score = coin.change5min + coin.volumeSpike * 2;

    if (score >= 10) return "🔥🔥🔥";
    if (score >= 7) return "🔥🔥";
    return "🔥";
  }

  private getRSIStatus(rsi: number): string {
    if (rsi >= 70) return "⚠️ 과매수 주의";
    if (rsi <= 30) return "✅ 과매도";
    return "✅";
  }

  private getRiskLevel(coin: CoinPrice): string {
    // 리스크 평가
    if (coin.rsi >= 75 || coin.volumeSpike >= 10) {
      return "⚠️ <b>리스크:</b> 높음 (빠른 손절 필수)";
    }

    if (coin.change5min >= 5 && coin.volumeSpike >= 4) {
      return "✅ <b>리스크:</b> 중간 (목표가 도달 시 즉시 익절)";
    }

    return "💎 <b>리스크:</b> 낮음 (좋은 진입 타이밍)";
  }

  async sendScalpingAlert(coins: CoinPrice[]): Promise<void> {
    try {
      const newCoins = coins.filter(
        (coin) => !this.lastAlertedCoins.has(coin.symbol)
      );

      if (newCoins.length === 0) return;

      // 최대 5개까지만 (단타는 집중 필요)
      const topCoins = newCoins.slice(0, 5);
      const message = this.formatScalpingAlert(topCoins);

      if (message) {
        await this.bot.sendMessage(this.chatId, message, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });

        // 5분간 중복 방지
        topCoins.forEach((coin) => {
          this.lastAlertedCoins.add(coin.symbol);
          setTimeout(() => {
            this.lastAlertedCoins.delete(coin.symbol);
          }, 5 * 60 * 1000);
        });
      }
    } catch (error) {
      console.error("❌ 텔레그램 알림 전송 실패:", error);
    }
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: "HTML" });
    } catch (error) {
      console.error("❌ 텔레그램 메시지 전송 실패:", error);
    }
  }
}
