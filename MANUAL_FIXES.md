# CRITICAL FIXES NEEDED

## Issue 1: Players need splitHand initialized
Line 139-143 needs to be:
```javascript
const [players, setPlayers] = useState([
  { id: 1, type: 'human', name: 'Player 1', coins: 100, hand: [], bet: 0, locked: false, splitHand: null, playingSplit: false },
  { id: 2, type: 'ai', name: 'AI 1', coins: 100, hand: [], bet: 0, locked: false, splitHand: null, playingSplit: false },
  { id: 3, type: 'ai', name: 'AI 2', coins: 100, hand: [], bet: 0, locked: false, splitHand: null, playingSplit: false }
]);
```

## Issue 2: Add showTerms and closeTermsModal functions
After line 170, add:
```javascript
const showTerms = () => {
  setShowTermsModal(true);
};

const closeTermsModal = () => {
  setShowTermsModal(false);
};
```

## Issue 3: Add backToMain function
Add this function:
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

## Issue 4: Fix split display - only show one set initially
In the player display section (around line 1300+), the split hand should show BOTH cards but appear as ONE SET initially. Then when playing the split hand, highlight which hand is active.

Change from displaying 2 separate rows to:
```javascript
{player.splitHand && (
  <div className="split-indicator">
    Playing Hand {player.playingSplit ? '2' : '1'} of 2
  </div>
)}

<div className="hand-display">
  {player.hand.map((card, cardIdx) => (
    <div key={cardIdx} className={`card ${player.playingSplit ? 'dimmed' : ''}`}>
      {/* card content */}
    </div>
  ))}
  
  {player.splitHand && player.splitHand.map((card, cardIdx) => (
    <div key={`split-${cardIdx}`} className={`card ${!player.playingSplit ? 'dimmed' : ''}`}>
      {/* card content */}
    </div>
  ))}
</div>
```

## Issue 5: Add Back to Main button on game screen
In actions section (around line 1400), add:
```javascript
{(gamePhase === 'betting' || gamePhase === 'result') && (
  <button className="action-btn back-btn-game" onClick={backToMain}>
    <ArrowLeft size={20} />
    Back to Main
  </button>
)}
```

## Issue 6: Fix all footer buttons to use showTerms
Replace ALL instances of:
```javascript
<button onClick={() => setAcceptedTerms(false)} className="terms-link">Terms of Use</button>
```

With:
```javascript
<button onClick={showTerms} className="terms-link">Terms of Use</button>
```

## Issue 7: Add Terms Modal to all screens
At the start of EACH return statement (mode selection, setup, game), add:
```javascript
{showTermsModal && <TermsModal onClose={closeTermsModal} alreadyAccepted={true} />}
```

## Issue 8: Add ArrowLeft import
Line 2 should be:
```javascript
import { Home, ArrowLeft } from 'lucide-react';
```

## Complete checklist to manually fix the file:

1. [ ] Line 2: Add ArrowLeft to imports
2. [ ] Line 139-143: Add splitHand: null, playingSplit: false to all 3 players
3. [ ] After line 170: Add showTerms() and closeTermsModal() functions
4. [ ] After functions: Add backToMain() function
5. [ ] Game screen: Add {showTermsModal && <TermsModal.../>} at start of return
6. [ ] Game screen: Fix split card display to show both sets
7. [ ] Game screen: Add Back to Main button in actions section
8. [ ] All screens: Change footer to use showTerms instead of setAcceptedTerms(false)
9. [ ] Mode selection screen: Add Terms modal
10. [ ] Setup screen: Add Terms modal
