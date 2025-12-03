import dotenv from "dotenv";

import { BybitService } from "./services/bybitService";
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

// 설정
const PUMP_THRESHOLD = 5; // 급등 기준 (%)
const MIN_VOLUME = 100000; // 최소 거래량 ($100K)
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5분마다 체크

const bybitService = new BybitService({
  pumpThreshold: PUMP_THRESHOLD,
  minVolume: MIN_VOLUME,
});

const telegramService = new TelegramService({
  token: TELEGRAM_BOT_TOKEN,
  chatId: TELEGRAM_CHAT_ID,
});

// 급등 코인 스캔 → 알림
async function scanPumpingCoins(): Promise<void> {
  try {
    console.log(
      `\n🔍 [${new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      })}] 급등 코인 스캔 중...`
    );

    const pumpingCoins = await bybitService.findPumpingCoins();

    if (pumpingCoins.length === 0) {
      console.log("📊 현재 급등 코인 없음");
      return;
    }

    console.log(
      `🚀 급등 코인 ${pumpingCoins.length}개 발견: ${pumpingCoins
        .slice(0, 5)
        .map((c) => `${c.symbol} +${c.change24hPercent.toFixed(2)}%`)
        .join(", ")}`
    );

    await telegramService.sendPumpAlert(pumpingCoins);
    console.log("✅ 알림 완료\n");
  } catch (error) {
    console.error("❌ 스캔 오류:", error);
  }
}

async function startBot(): Promise<void> {
  console.log("🚀 바이비트 급등 코인 알림 봇 시작");
  console.log(`📊 급등 기준: ${PUMP_THRESHOLD}% 이상`);
  console.log(`💰 최소 거래량: $${(MIN_VOLUME / 1000).toFixed(0)}K`);
  console.log(`⏰ 체크 간격: ${CHECK_INTERVAL_MS / 1000 / 60}분\n`);

  await scanPumpingCoins();

  setInterval(scanPumpingCoins, CHECK_INTERVAL_MS);
}

startBot().catch((error) => {
  console.error("❌ 봇 시작 실패:", error);
  process.exit(1);
});
