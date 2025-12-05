# Binance Scalping Alert Bot

⚡ Real-time scalping alerts for Binance - Detect 5-minute pumps with volume spikes

## Features

✅ **Optimized for Scalping** - 5min/15min timeframe analysis  
✅ **Volume Spike Detection** - 3x average volume or more  
✅ **RSI Indicator** - Overbought/oversold detection  
✅ **Clear Price Targets** - Entry/Target/Stop-loss prices  
✅ **1-Minute Scanning** - Fast opportunity capture  
✅ **Risk Assessment** - Risk level for each signal

## Strategy

### Entry Conditions

- 5-min change: **+2% or more**
- Volume spike: **3x average or more**
- RSI: **Below 80** (exclude overbought)
- Minimum volume: **$500K**

### Take-Profit / Stop-Loss

- 🎯 **Target: +3%** (Quick profit-taking)
- ❌ **Stop-loss: -2%** (Risk management)
- Average R:R ratio: **1.5:1**

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

Adjust in `src/bot.ts`:

```typescript
const MIN_CHANGE_5MIN = 2; // Minimum 5-min change (%)
const MIN_VOLUME_SPIKE = 3; // Volume spike multiplier
const MIN_VOLUME = 500000; // Minimum volume ($)
const CHECK_INTERVAL_MS = 60000; // Check interval (1 min)
```

## Alert Example

```
⚡ Scalping Alert (Binance)
2025. 12. 3. AM 2:30:00

1. BTC 🔥🔥🔥

   🎯 Entry: $98,450.30
   ✅ Target: $101,403.81 (+3%)
   ❌ Stop: $96,521.29 (-2%)

   📊 5min: +3.5% | 15min: +5.2%
   🔥 Volume: 4.2x spike
   📈 RSI: 65 ✅

   📍 Check Chart Now
   💎 Risk: Low (Good entry timing)
```

## Usage Tips

### ✅ DO

1. **Check Chart Immediately** - Check within 5 seconds of alert
2. **Take Profit at Target** - No greed
3. **Always Set Stop-loss** - Remove emotions
4. **Start Small** - Max 10% of total capital
5. **Track Statistics** - Monitor win rate

### ❌ DON'T

1. ~~Hesitate after alert~~ → Too late
2. ~~Wait beyond target~~ → Loss
3. ~~Ignore stop-loss~~ → Big loss
4. ~~Enter multiple coins~~ → Lost focus
5. ~~Trade high-risk signals~~ → Loss

## Risk Management

### Signal Strength Response

- 🔥🔥🔥 **Strong**: Quick entry, quick profit
- 🔥🔥 **Medium**: Check chart before entry
- 🔥 **Weak**: Be cautious

### RSI Guidelines

- **RSI < 30**: Oversold (good timing)
- **RSI 30-70**: Normal range
- **RSI > 70**: Overbought (caution)
- **RSI > 80**: Excluded

### Risk Levels

- 💎 **Low**: Stable entry
- ✅ **Medium**: Quick profit required
- ⚠️ **High**: Experienced only, fast stop-loss

## Expected Performance

- Win rate: **55-65%** (with proper filtering)
- Average profit: **+3%**
- Average loss: **-2%**
- R:R ratio: **1.5:1**
- Daily trades: **5-15** (depends on market)

## Notes

⚠️ **Important**

- Scalping requires focus
- No emotional trading
- Always set stop-loss
- Watch for overbought signals

💡 **Tips**

- Set alert volume high
- Keep charts ready
- Test with small amounts for first week
