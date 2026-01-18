# FINAL FIX INSTRUCTIONS

## All Issues and Solutions

### ✅ ICON & INSTALLATION - COMPLETE
- Icon created at `/public/icon.svg`
- `index.html` updated with manifest link
- `manifest.json` configured
- **Users can now install from browser!**

### ❌ ISSUE 1: Terms of Use doesn't save
**Problem**: The `showTermsModal` state exists but `showTerms` and `closeTermsModal` functions are missing.

**FIX**: Add these functions after line 170 in `src/blackjack-stats.jsx`:
```javascript
const showTerms = () => {
  setShowTermsModal(true);
};

const closeTermsModal = () => {
  setShowTermsModal(false);
};
```

Then replace ALL instances of:
```javascript
onClick={() => setAcceptedTerms(false)}
```
With:
```javascript
onClick={showTerms}
```

### ❌ ISSUE 2: No Back to Main button on game screen  
**Problem**: `backToMain` function doesn't exist

**FIX**: Add this function:
```javascript
const backToMain = () => {
  setGameMode(null);
  setGamePhase('setup');
  const resetPlayers = players.map(player => ({
    ...player,
    hand: [],
    bet: 0,
    splitHand: null,
    playingSplit: false
  }));
  setPlayers(resetPlayers);
  setDealer({ hand: [], showAll: false });
};
```

Then add button in game screen actions section (find where "Next Round" button is):
```javascript
{(gamePhase === 'betting' || gamePhase === 'result') && (
  <button className="action-btn back-btn-game" onClick={backToMain}>
    <ArrowLeft size={20} /> Back to Main
  </button>
)}
```

### ❌ ISSUE 3: Split shows 2 sets but should show as 1
**Problem**: Split hands display separately

**FIX**: In the player card display section (around line 1300), change to:
```javascript
{player.splitHand && (
  <div style={{ color: 'white', marginBottom: '10px', fontSize: '0.9rem' }}>
    Playing Hand {player.playingSplit ? '2' : '1'} of 2
  </div>
)}

<div className="hand-display">
  {/* Show both hands in ONE row */}
  {player.hand.map((card, cardIdx) => (
    <div key={cardIdx} className={`card ${player.playingSplit ? 'dimmed' : ''}`}>
      <span className={`card-suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
        {card.suit}
      </span>
      <span className="card-value">{card.display}</span>
    </div>
  ))}
  
  {/* Divider if split */}
  {player.splitHand && (
    <div style={{ width: '2px', background: 'rgba(255,255,255,0.3)', margin: '0 10px' }} />
  )}
  
  {/* Split hand cards */}
  {player.splitHand && player.splitHand.map((card, cardIdx) => (
    <div key={`split-${cardIdx}`} className={`card ${!player.playingSplit ? 'dimmed' : ''}`}>
      <span className={`card-suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
        {card.suit}
      </span>
      <span className="card-value">{card.display}</span>
    </div>
  ))}
</div>

{/* Show values */}
{player.hand.length > 0 && (
  <div className="hand-value">
    Hand 1: {calculateHandValue(player.hand)}
    {calculateHandValue(player.hand) > 21 && <span className="bust"> BUST!</span>}
    {player.splitHand && (
      <>
        {' | '}
        Hand 2: {calculateHandValue(player.splitHand)}
        {calculateHandValue(player.splitHand) > 21 && <span className="bust"> BUST!</span>}
      </>
    )}
  </div>
)}
```

### ❌ ISSUE 4: Players don't have splitHand initialized
**FIX**: Line 139-143, change to:
```javascript
const [players, setPlayers] = useState([
  { id: 1, type: 'human', name: 'Player 1', coins: 100, hand: [], bet: 0, locked: false, splitHand: null, playingSplit: false },
  { id: 2, type: 'ai', name: 'AI 1', coins: 100, hand: [], bet: 0, locked: false, splitHand: null, playingSplit: false },
  { id: 3, type: 'ai', name: 'AI 2', coins: 100, hand: [], bet: 0, locked: false, splitHand: null, playingSplit: false }
]);
```

### ❌ ISSUE 5: Missing ArrowLeft import
**FIX**: Line 2, change to:
```javascript
import { Home, ArrowLeft } from 'lucide-react';
```

### ❌ ISSUE 6: Terms Modal not showing on all screens
**FIX**: Add at the start of EACH return statement (mode selection, setup, game):
```javascript
{showTermsModal && <TermsModal onClose={closeTermsModal} alreadyAccepted={true} />}
```

## Quick Fix Summary

1. Line 2: Add `ArrowLeft` to imports
2. Lines 139-143: Add `splitHand: null, playingSplit: false` to all 3 players
3. After line 170: Add `showTerms()` and `closeTermsModal()` functions
4. Add `backToMain()` function
5. Replace all `onClick={() => setAcceptedTerms(false)}` with `onClick={showTerms}`
6. Add Terms modal to all screens
7. Fix split card display to show both sets in ONE row with divider
8. Add Back to Main button with ArrowLeft icon
9. Add CSS for `.dimmed` class:
```css
.card.dimmed {
  opacity: 0.4;
}
```

## Files Already Fixed ✅
- ✅ `/public/icon.svg` - App icon created
- ✅ `/public/manifest.json` - PWA config updated
- ✅ `/index.html` - Manifest link added
- ✅ `/src/index.css` - No drag/copy protection added
- ✅ `vite.config.js` - Build fixed
- ✅ `package.json` - Dependencies updated

## Installation Instructions for Users

Once deployed, users can install on:

**Desktop (Chrome/Edge/Brave):**
1. Visit your app URL
2. Look for install icon in address bar (⊕)
3. Click "Install Blackjack Statistics"
4. App opens in own window

**Mac (Safari):**
1. Visit app
2. File → Add to Dock

**Mobile:**
1. Open in browser
2. Share → Add to Home Screen

---

**Note**: The main file `src/blackjack-stats.jsx` needs the manual edits listed above. The file is too large to replace entirely, so please make these targeted changes.
