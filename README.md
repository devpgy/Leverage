# 🥈 Leveraged Silver Position Calculator

A professional web app for modeling leveraged long silver positions. Track your position sizing, P&L, and required stop levels as silver price moves from $60 to $300.

## Features

- **Real-time Calculations**: All metrics update instantly as you adjust inputs
- **Position Summary**: Quick overview of position size, notional exposure, and risk
- **Price Scenarios Table**: 13 price levels showing P&L, equity, and required stops
- **Interactive Chart**: Visual tracking of stop level progression
- **Data Persistence**: Your inputs are saved to browser storage
- **Fully Responsive**: Works on desktop, tablet, and mobile
- **No Backend Required**: Pure client-side app, easy to host anywhere

## How It Works

1. Enter your cash, leverage multiple, and entry price
2. View your position metrics instantly
3. Check the scenarios table to see where your stops should be at each price level
4. As silver rises, your equity grows and your stops move higher to maintain leverage

### Key Formula

The model maintains a constant leverage ratio by adjusting your stop:

```
Max Loss Allowed = Account Equity ÷ Leverage Multiple
Required Stop = Current Price - (Max Loss ÷ Position Size)
```

As your equity grows with profits, your stop moves higher proportionally.

## Deploy to Cloudflare Pages

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `silver-position-calc`)
3. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/silver-position-calc.git
   cd silver-position-calc
   ```

### Step 2: Add Files

Copy these three files to your repo:
- `index.html`
- `style.css`
- `script.js`
- `README.md`

### Step 3: Commit and Push

```bash
git add .
git commit -m "Initial commit: Leveraged silver position calculator"
git push origin main
```

### Step 4: Deploy to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Connect your GitHub account
4. Select your repository
5. Set **Build settings**:
   - Framework: **None**
   - Build command: (leave blank)
   - Build output directory: `/` (root)
6. Click **Save and Deploy**

### Step 5: Share Your Link

Once deployed, Cloudflare will give you a URL like:
```
https://silver-position-calc.pages.dev
```

Share this link with your friend!

## Alternative Hosting Options

If you don't want to use Cloudflare Pages:

- **GitHub Pages**: Free, easy setup (just enable Pages in repo settings)
- **Netlify**: Free tier with continuous deployment
- **Vercel**: Free tier with excellent performance
- **Any static host**: Upload the three files to any web server

## Customization

You can easily customize:

- **Default values**: Edit `value="60"` in the HTML inputs
- **Price scenarios**: Modify the `priceScenarios` array in `script.js`
- **Colors**: Change CSS variables in `style.css` (`:root` section)
- **Title and branding**: Edit header text in `index.html`

## Browser Compatibility

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes

- Data is saved in your browser's localStorage (survives page refreshes)
- No personal data is sent anywhere
- Calculations are done 100% client-side
- Compatible with any screen size

## License

Free to use and modify. Share with friends!

---

**Questions or feedback?** Feel free to modify the code or submit issues.
