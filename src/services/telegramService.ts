import TelegramBot from "node-telegram-bot-api";

import { CoinPrice } from "../types/bybit";

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

  private formatPumpAlert(coins: CoinPrice[]): string {
    if (coins.length === 0) return "";

    const messages = coins.map((coin, index) => {
      const volumeStr = coin.volume24h
        ? `$${(coin.volume24h / 1000000).toFixed(2)}M`
        : "N/A";

      return `${index + 1}. <b>${coin.symbol.replace("USDT", "")}</b>
   📈 +${coin.change24hPercent.toFixed(2)}%
   💰 $${coin.currentPrice.toLocaleString("en-US", {
     minimumFractionDigits: 2,
     maximumFractionDigits: 8,
   })}
   📊 거래량: ${volumeStr}`;
    });

    const header = `🚀 <b>급등 코인 알림</b>\n${new Date().toLocaleString(
      "ko-KR",
      {
        timeZone: "Asia/Seoul",
      }
    )}\n\n`;

    return header + messages.join("\n\n");
  }

  // 급등 코인 알림 (중복 방지 10분)
  async sendPumpAlert(coins: CoinPrice[]): Promise<void> {
    try {
      const newCoins = coins.filter(
        (coin) => !this.lastAlertedCoins.has(coin.symbol)
      );

      if (newCoins.length === 0) return;

      const topCoins = newCoins.slice(0, 10);
      const message = this.formatPumpAlert(topCoins);

      if (message) {
        await this.bot.sendMessage(this.chatId, message, {
          parse_mode: "HTML",
        });

        // 알림 기록 + 10분 후 캐시 삭제
        topCoins.forEach((coin) => {
          this.lastAlertedCoins.add(coin.symbol);
          setTimeout(() => {
            this.lastAlertedCoins.delete(coin.symbol);
          }, 10 * 60 * 1000);
        });
      }
    } catch (error) {
      console.error("❌ 텔레그램 알림 전송 실패:", error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: "HTML" });
    } catch (error) {
      console.error("❌ 텔레그램 메시지 전송 실패:", error);
      throw error;
    }
  }
}
