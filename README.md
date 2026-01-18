# Blackjack Statistics

An educational blackjack application that displays statistical odds of winning for each action. Designed for learning purposes to understand blackjack probability and basic strategy.

## ⚠️ Important Disclaimer

This app is designed for **educational and entertainment purposes only**. It is **NOT** intended for real-money gambling. The statistical odds displayed are estimates based on basic strategy and may contain variations from actual probabilities.

## Features

### 🎮 Game Modes
- **Regular**: Classic blackjack rules
- **Switch**: Blackjack Switch variation
- **Bahama**: Caribbean-style blackjack

### 👥 Flexible Player Configuration
- 1-3 players (default: 1 human + 2 AI)
- Switch between human and AI players
- Custom names for human players
- AI players labeled as "AI 1" and "AI 2"

### 🃏 Deck Management
- Choose from 6, 7, or 8 decks
- Automatic shuffle when cut card appears (at ~75% of shoe)
- Realistic card dealing mechanics

### 💰 Coin System
- Each player starts with 100 coins
- 5 coins per game bet
- 24-hour lockout when player loses all coins
- Persistent coin tracking

### 📊 Statistical Odds Display
Each action button shows the estimated winning percentage:
- **Hit**: Probability of improving hand without busting
- **Stand**: Probability of winning with current hand
- **Double**: Probability of winning with one additional card
- **Split**: Probability of winning with split pairs

> **Note**: These are statistical estimates based on visible cards and basic strategy principles. Actual outcomes will vary since we cannot predict the next card.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blackjack-statistics.git
cd blackjack-statistics
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## 🏗️ Building for Production

Build the app for production:
```bash
npm run build
```

The optimized files will be in the `dist` directory.

Preview the production build:
```bash
npm run preview
```

## 📱 Mobile App Deployment

### Prerequisites for App Stores
- **Google Play Store**: Android Studio, Google Play Console account
- **Apple App Store**: Xcode, Apple Developer account

### Converting to Mobile App

This React app can be converted to a native mobile app using frameworks like:

1. **React Native** (recommended for native feel)
2. **Capacitor** (easiest conversion from web app)
3. **Cordova** (older alternative)

#### Using Capacitor (Recommended)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# Build the web app
npm run build

# Add platforms
npx cap add android
npx cap add ios

# Copy web assets
npx cap copy

# Open in native IDE
npx cap open android
npx cap open ios
```

## 📂 Project Structure

```
blackjack-statistics/
├── src/
│   ├── blackjack-stats.jsx   # Main game component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── package.json               # Dependencies
├── vite.config.js            # Build configuration
└── README.md                  # Documentation
```

## 🎯 Game Rules

### Basic Gameplay
1. Accept Terms of Use
2. Select game mode (Regular/Switch/Bahama)
3. Configure players and deck count
4. Each round:
   - Bets are automatically placed (5 coins)
   - Cards are dealt
   - Players make decisions based on statistical odds
   - Dealer plays according to standard rules (hit until 17)
   - Winnings are distributed

### Actions
- **Hit**: Take another card
- **Stand**: Keep current hand
- **Double**: Double bet and take one card (then stand)
- **Split**: Split pairs into two hands (coming soon)

### Winning
- Beat the dealer without going over 21
- Dealer busts while you're still in play
- Blackjack (21 with first two cards) pays 2:1

## 🔧 Technical Details

### Technologies Used
- React 18
- Vite (build tool)
- Lucide React (icons)
- Local Storage (persistent data)

### Statistical Calculation
The app uses simplified probability calculations based on:
- Current hand total
- Dealer's up card
- Basic strategy principles
- Deck composition awareness

**Note**: These are educational estimates, not precise mathematical probabilities.

## 🌐 Deployment

### GitHub Pages
```bash
npm run build
# Deploy the dist folder to GitHub Pages
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
Simply drag and drop the `dist` folder to Netlify.

## 📜 Terms of Use

By using this application, you acknowledge and agree that:
- The blackjack game and its statistical odds information are for **study purposes only**
- The statistical information **may contain errors**
- This app is designed for **entertainment and learning** only
- This app is **NOT** intended for real-money gambling

## 🔗 Links
- **m2ea Labs**: [https://www.m2ealabs.com/](https://www.m2ealabs.com/)
- **m2ea Circle**: [https://www.m2eacircle.com/](https://www.m2eacircle.com/)

## 📄 License

© 2025 m2ea Labs. All rights reserved.

## 🤝 Contributing

This is an educational project. If you find bugs or have suggestions for improvements, feel free to open an issue or submit a pull request.

## 📞 Support

For questions or support, please visit [m2ea Circle](https://www.m2eacircle.com/) or contact through [m2ea Labs](https://www.m2ealabs.com/).

---

**Remember**: This is an educational tool. Always gamble responsibly and never with real money using educational apps.
