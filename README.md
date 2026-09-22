# 🥈 Leveraged Silver Rebalancing Calculator

A professional web app for tracking when to buy additional silver to maintain your target leverage as the price rises.

## The Problem

When you open a leveraged position at a price (e.g., 5x leverage at $60), your leverage ratio drops as the price rises and you profit:

- **At $60**: 8,333 oz × 5x = $500k notional / $100k equity = 5x leverage ✓
- **At $100**: 8,333 oz × 1x = $833k notional / $433k equity = 1.92x leverage ✗

Your equity grows (you make gains) but your position size stays the same, so leverage falls.

## The Solution

This app tells you **exactly when and how much to buy** to maintain constant 5x leverage:

- **At $100**: Buy 13,320 more oz → Total 21,653 oz → $2.165M / $433k = 5x ✓
- **At $200**: Buy more as equity grows further → Keep rebalancing to maintain discipline

## Features

✅ Real-time calculations as you adjust inputs
✅ Initial position summary (size, notional, leverage)
✅ Interactive rebalancing table showing exact purchases needed
✅ Three-axis chart showing:
  - Your growing position size
  - Cumulative additional oz to purchase
  - Current leverage ratio deterioration without rebalancing
✅ Exact prices (not rounded to $5 increments)
✅ 0.01 oz minimum lot sizing
✅ Browser storage persists your inputs
✅ Fully responsive design

## How It Works

**Input:**
- Starting cash: $100,000
- Target leverage: 5x
- Entry price: $60

**The app shows at each price level:**
- Your account equity (cash + unrealized P&L)
- Current leverage ratio (what you'd have if you don't rebalance)
- Exactly how many oz to buy to get back to 5x
- Cost in dollars for that purchase
- Your new total position size

**Example at $100:**
- Unrealized P&L: +$333,000
- Account equity: $433,000
- Current leverage: 1.92x (unbalanced)
- **Additional oz needed: 13,320 oz**
- **Cost to buy: $1,332,000**
- New total position: 21,653 oz
- New leverage: 5.0x ✓

## Key Formula

```
Target Notional = Account Equity × Leverage Multiple
Additional Oz = (Target Notional − Current Notional) / Current Price
```

As your account grows from gains, the additional oz needed also grows—you're pyramiding your position up.

## Trading Strategy

1. **Start**: Open initial leveraged position at your entry price
2. **Monitor**: Watch the rebalancing table
3. **Execute**: When you're comfortable (not necessarily at every price point):
   - Check the table at current price
   - See how many oz to buy
   - Check if you have margin/capital available
   - Execute the purchase
4. **Rebalance**: Your new position size maintains your target leverage
5. **Repeat**: As silver continues rising, keep rebalancing

This keeps your leverage constant while pyramiding up for maximum upside capture.

## Deployment

See `DEPLOYMENT_GUIDE.md` for step-by-step GitHub + Cloudflare Pages setup (takes 5 minutes).

## Features

- **Exact Prices**: Dynamic price scenarios from entry to $300, not just $5 increments
- **Precise Lot Sizing**: All calculations rounded to 0.01 oz minimum
- **Three Views**:
  - Position summary
  - Detailed rebalancing table
  - Multi-axis chart
- **Fully Responsive**: Works on desktop, tablet, mobile
- **No Backend**: Pure client-side, instant updates
- **Data Persistence**: Your inputs saved locally

## Notes

- This model assumes constant leverage rebalancing (you buy at every (or many) price points)
- Each rebalance requires additional capital (either margin or fresh cash)
- Verify with your broker on margin requirements and available leverage
- Manage risk appropriately—don't over-leverage beyond your comfort level

---

Built for tracking leveraged commodity positions. Use with caution and verify all calculations with your broker.
