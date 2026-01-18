# 🎰 Blackjack Statistics - Quick Start Guide

Welcome! This guide will get you up and running quickly.

## 📦 What You Have

Your complete Blackjack Statistics app with:
- ✅ Full game implementation (Regular, Switch, Bahama modes)
- ✅ Statistical odds display for all actions
- ✅ 1-3 player support (Human/AI configurable)
- ✅ 6-8 deck selection
- ✅ Coin system with 24-hour lockout
- ✅ Responsive design for all screen sizes
- ✅ Terms of Use screen
- ✅ Links to m2ea Labs and m2ea Circle

## 🚀 3-Minute Setup

### Option 1: Test Locally

```bash
# 1. Navigate to the project folder
cd blackjack-statistics

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser to http://localhost:3000
```

That's it! Your app is running locally.

### Option 2: Deploy to GitHub Pages (Free Hosting)

```bash
# 1. Create GitHub repository at github.com/new
#    Name: blackjack-statistics
#    Visibility: Public

# 2. Push your code
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/blackjack-statistics.git
git branch -M main
git push -u origin main

# 3. Enable GitHub Pages in repository Settings → Pages
#    Select "GitHub Actions" as source

# 4. Your app will be live at:
#    https://YOUR_USERNAME.github.io/blackjack-statistics/
```

## 📱 Path to Mobile Apps

### Timeline: ~1-2 weeks
1. **This week**: Test the web app, gather feedback
2. **Next week**: Convert to mobile apps using Capacitor
3. **Week 3**: Submit to app stores
4. **Week 4-5**: Review and approval

### What You'll Need
- **For Android**: Google Play Console account ($25 one-time)
- **For iOS**: Apple Developer account ($99/year) + macOS with Xcode

Full instructions in: `DEPLOYMENT.md`

## 📂 Project Structure

```
blackjack-statistics/
├── src/
│   ├── blackjack-stats.jsx  ← Main game component
│   ├── main.jsx              ← App entry point  
│   └── index.css             ← Global styles
├── public/
│   └── manifest.json         ← PWA configuration
├── .github/workflows/
│   └── deploy.yml            ← Auto-deploy to GitHub Pages
├── README.md                 ← Full documentation
├── DEPLOYMENT.md             ← App store guide
├── GITHUB_SETUP.md           ← GitHub instructions
├── PRIVACY_POLICY.md         ← Required for app stores
├── CHECKLIST.md              ← Step-by-step deployment checklist
└── package.json              ← Dependencies
```

## 🎮 Features Overview

### Game Modes
- **Regular**: Classic blackjack (21)
- **Switch**: Blackjack Switch variation
- **Bahama**: Caribbean-style rules

### Player Configuration
- Choose 1-3 players
- Toggle each between Human/AI
- Custom names for human players
- AI players auto-labeled "AI 1", "AI 2"

### Statistical Odds
Each action button shows win probability:
- **HIT**: Chance of improving without busting
- **STAND**: Chance of beating dealer
- **DOUBLE**: Chance with one more card
- **SPLIT**: Chance with split pairs

### Coin System
- Start with 100 coins
- 5 coins per bet
- Lose all coins? 24-hour lockout
- Tracks across sessions

## 🔑 Key Files Explained

### `src/blackjack-stats.jsx`
The complete game logic:
- Game state management
- Card dealing and shuffling
- Statistical calculations
- UI rendering
- Local storage handling

### `package.json`
All dependencies:
- React 18
- Vite (fast build tool)
- Lucide React (icons)

### `vite.config.js`
Build configuration for production

### `.github/workflows/deploy.yml`
Automatic deployment to GitHub Pages

## 🛠️ Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
git add .            # Stage changes
git commit -m "msg"  # Commit changes
git push             # Push to GitHub
```

## ✅ Testing Checklist

Before deploying:
- [ ] Test on mobile browser (Chrome mobile, Safari)
- [ ] Test all three game modes
- [ ] Test player switching (Human/AI)
- [ ] Test coin system and lockout
- [ ] Test Terms of Use acceptance
- [ ] Click all links (m2ea Labs, m2ea Circle)
- [ ] Test statistical odds display
- [ ] Try different screen sizes

## 📞 Get Help

### Documentation
- **README.md** - Comprehensive documentation
- **DEPLOYMENT.md** - Mobile app deployment guide
- **GITHUB_SETUP.md** - GitHub instructions
- **CHECKLIST.md** - Step-by-step deployment

### Resources
- m2ea Circle: https://www.m2eacircle.com/
- m2ea Labs: https://www.m2ealabs.com/

## 🎯 Next Steps

Choose your path:

### Path A: Just Want to Test?
→ Run `npm install && npm run dev`
→ Test at localhost:3000

### Path B: Deploy to Web?
→ Follow "Option 2" above
→ Share with friends
→ Gather feedback

### Path C: Build Mobile Apps?
→ Test the web version first
→ Read DEPLOYMENT.md
→ Set up Capacitor
→ Submit to app stores

## 💡 Pro Tips

1. **Start Simple**: Test locally first, then deploy to web, then mobile
2. **Gather Feedback**: Have friends test before app store submission
3. **Read Privacy Policy**: Required for app stores - already created!
4. **Emphasize Education**: This is a learning tool, not gambling
5. **Version Control**: Commit often with clear messages

## 🚨 Important Reminders

### Educational Purpose
- This app is for **learning blackjack odds**
- **NOT** for real money gambling
- Make this clear in all marketing

### Privacy
- **No data collection** - everything stored locally
- No analytics, no tracking
- Complete privacy

### Compliance
- Terms of Use enforced
- Privacy Policy provided
- Age rating: 12+ (simulated gambling)

## 🎉 You're Ready!

You have everything you need:
- ✅ Complete working app
- ✅ All documentation
- ✅ Deployment guides
- ✅ GitHub setup instructions
- ✅ Privacy policy
- ✅ Checklist

### Start Here:
1. Open terminal in `blackjack-statistics` folder
2. Run `npm install`
3. Run `npm run dev`
4. Open http://localhost:3000

**Have fun and good luck with your launch! 🚀**

---

Questions? Check the documentation files or visit m2ea Circle.

© 2025 m2ea Labs. All rights reserved.
