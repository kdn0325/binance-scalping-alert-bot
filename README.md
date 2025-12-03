# Bybit Pumping Coins Alert Bot

Real-time Telegram alerts for pumping coins on Bybit USDT market.

## Installation

```bash
yarn install
```

## Environment Setup

Create `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## Run

```bash
# Development
yarn dev

# Production
yarn start
```

## Configuration

Adjust settings in `src/bot.ts`:

```typescript
const PUMP_THRESHOLD = 5; // Pump threshold (%)
const MIN_VOLUME = 100000; // Minimum volume ($)
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check interval (5min)
```

## Alert Example

```
🚀 Pumping Coins Alert
2025. 12. 3. AM 1:45:00

1. BTC
   📈 +8.50%
   💰 $98,450.30
   📊 Volume: $25.5M

2. ETH
   📈 +6.20%
   💰 $3,850.00
   📊 Volume: $12.3M
```
