import dotenv from "dotenv";

import { BinanceService } from "./services/binanceService";
import { TelegramService } from "./services/telegramService";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error(
    "❌ .env 파일에 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 설정 필요"
  );
  process.exit(1);
}

// 단타 설정
const MIN_CHANGE_5MIN = 2; // 5분 2% 이상 급등
const MIN_VOLUME_SPIKE = 3; // 평균 대비 3배 이상 볼륨
const MIN_VOLUME = 500000; // 최소 $500K 거래량
const CHECK_INTERVAL_MS = 60 * 1000; // 1분마다 체크 (초단타)

const binanceService = new BinanceService({
  minChange5min: MIN_CHANGE_5MIN,
  minVolumeSpike: MIN_VOLUME_SPIKE,
  minVolume: MIN_VOLUME,
});

const telegramService = new TelegramService({
  token: TELEGRAM_BOT_TOKEN,
  chatId: TELEGRAM_CHAT_ID,
});

async function scanScalpingCoins(): Promise<void> {
  try {
    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    console.log(`\n⚡ [${now}] 단타 급등 스캔...`);

    const scalpingCoins = await binanceService.findScalpingCoins();

    if (scalpingCoins.length === 0) {
      console.log("📊 급등 신호 없음");
      return;
    }

    console.log(`🔥 발견: ${scalpingCoins.length}개`);
    scalpingCoins.slice(0, 3).forEach((coin) => {
      console.log(
        `   ${coin.symbol}: 5min +${coin.change5min.toFixed(
          2
        )}% | Vol ${coin.volumeSpike.toFixed(1)}x | RSI ${coin.rsi.toFixed(0)}`
      );
    });

    await telegramService.sendScalpingAlert(scalpingCoins);
    console.log("✅ 알림 전송");
  } catch (error) {
    console.error("❌ 스캔 오류:", error);
  }
}

async function startBot(): Promise<void> {
  console.log("⚡ 바이낸스 단타 급등 알림 봇");
  console.log(`📊 조건: 5분 ${MIN_CHANGE_5MIN}%↑ + 볼륨 ${MIN_VOLUME_SPIKE}배`);
  console.log(`⏰ 체크: ${CHECK_INTERVAL_MS / 1000}초마다`);
  console.log(`🎯 목표: +3% 익절 | 손절: -2%\n`);

  await scanScalpingCoins();
  setInterval(scanScalpingCoins, CHECK_INTERVAL_MS);
}

startBot().catch((error) => {
  console.error("❌ 봇 실패:", error);
  process.exit(1);
});
