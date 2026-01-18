import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';

// Statistical calculation utilities
const calculateWinProbability = (playerHand, dealerUpCard, action, deckComposition) => {
  // Simplified basic strategy probability calculator
  // In a real app, this would use Monte Carlo simulation or lookup tables
  const playerTotal = calculateHandValue(playerHand);
  const dealerCard = dealerUpCard.value;
  
  let probability = 0.5; // Base probability
  
  if (action === 'stand') {
    // Probability based on dealer bust chances
    if (dealerCard >= 2 && dealerCard <= 6) {
      probability = 0.40 + (6 - dealerCard) * 0.05; // Dealer more likely to bust
    } else if (dealerCard >= 7 && dealerCard <= 10) {
      probability = 0.35 - (dealerCard - 7) * 0.02;
    } else if (dealerCard === 11) { // Ace
      probability = 0.30;
    }
    
    // Adjust based on player total
    if (playerTotal >= 17 && playerTotal <= 21) {
      probability += 0.10;
    } else if (playerTotal >= 12 && playerTotal <= 16) {
      probability -= 0.05;
    }
  } else if (action === 'hit') {
    // Probability of not busting and improving
    const bustCards = Math.max(0, playerTotal - 11);
    const totalCards = 13; // Simplified
    probability = 1 - (bustCards / totalCards);
    
    if (playerTotal <= 11) {
      probability = 0.65; // Can't bust
    } else if (playerTotal >= 17) {
      probability = 0.25; // High risk
    }
  } else if (action === 'double') {
    // Similar to hit but only one card
    if (playerTotal === 11) {
      probability = 0.70;
    } else if (playerTotal === 10) {
      probability = 0.65;
    } else if (playerTotal === 9) {
      probability = 0.55;
    } else {
      probability = 0.45;
    }
  } else if (action === 'split') {
    // Depends on the pair
    const cardValue = playerHand[0].value;
    if (cardValue === 11) { // Aces
      probability = 0.75;
    } else if (cardValue === 8) {
      probability = 0.60;
    } else if (cardValue === 9) {
      probability = 0.55;
    } else if (cardValue === 10) {
      probability = 0.50;
    } else {
      probability = 0.45;
    }
  }
  
  // Add variance to simulate uncertainty
  const variance = (Math.random() - 0.5) * 0.08;
  probability = Math.max(0.05, Math.min(0.95, probability + variance));
  
  return Math.round(probability * 100);
};

const calculateHandValue = (hand) => {
  let total = 0;
  let aces = 0;
  
  hand.forEach(card => {
    if (card.value === 11) {
      aces++;
      total += 11;
    } else {
      total += card.value;
    }
  });
  
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  
  return total;
};

const createDeck = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = [
    { display: 'A', value: 11 },
    { display: '2', value: 2 },
    { display: '3', value: 3 },
    { display: '4', value: 4 },
    { display: '5', value: 5 },
    { display: '6', value: 6 },
    { display: '7', value: 7 },
    { display: '8', value: 8 },
    { display: '9', value: 9 },
    { display: '10', value: 10 },
    { display: 'J', value: 10 },
    { display: 'Q', value: 10 },
    { display: 'K', value: 10 }
  ];
  
  const deck = [];
  suits.forEach(suit => {
    values.forEach(val => {
      deck.push({ suit, display: val.display, value: val.value });
    });
  });
  
  return deck;
};

const BlackjackStats = () => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [gameMode, setGameMode] = useState(null); // 'regular', 'switch', 'bahama'
  const [numDecks, setNumDecks] = useState(6);
  const [players, setPlayers] = useState([
    { id: 1, type: 'human', name: 'Player 1', coins: 100, hand: [], bet: 0, locked: false },
    { id: 2, type: 'ai', name: 'AI 1', coins: 100, hand: [], bet: 0, locked: false },
    { id: 3, type: 'ai', name: 'AI 2', coins: 100, hand: [], bet: 0, locked: false }
  ]);
  const [dealer, setDealer] = useState({ hand: [], showAll: false });
  const [shoe, setShoe] = useState([]);
  const [cutCardPosition, setCutCardPosition] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'betting', 'playing', 'dealer', 'result'
  const [showStats, setShowStats] = useState(false);
  const [editingPlayers, setEditingPlayers] = useState(false);
  
  useEffect(() => {
    const terms = localStorage.getItem('blackjackTermsAccepted');
    if (terms === 'true') {
      setAcceptedTerms(true);
    }
    
    // Check for locked players
    const lockedPlayers = JSON.parse(localStorage.getItem('lockedPlayers') || '{}');
    const now = Date.now();
    players.forEach(player => {
      if (lockedPlayers[player.id] && lockedPlayers[player.id] > now) {
        player.locked = true;
      }
    });
  }, []);
  
  const acceptTerms = () => {
    localStorage.setItem('blackjackTermsAccepted', 'true');
    setAcceptedTerms(true);
  };
  
  const initializeShoe = (decks) => {
    let newShoe = [];
    for (let i = 0; i < decks; i++) {
      newShoe = [...newShoe, ...createDeck()];
    }
    
    // Shuffle
    for (let i = newShoe.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newShoe[i], newShoe[j]] = [newShoe[j], newShoe[i]];
    }
    
    // Place cut card at 75% through shoe
    const cutPosition = Math.floor(newShoe.length * 0.75);
    setCutCardPosition(cutPosition);
    
    return newShoe;
  };
  
  const startGame = () => {
    const newShoe = initializeShoe(numDecks);
    setShoe(newShoe);
    setGamePhase('betting');
  };
  
  const placeBets = () => {
    const updatedPlayers = players.map(player => {
      if (!player.locked && player.coins >= 5) {
        return { ...player, bet: 5, coins: player.coins - 5 };
      }
      return player;
    });
    setPlayers(updatedPlayers);
    dealInitialCards(updatedPlayers);
  };
  
  const dealInitialCards = (currentPlayers) => {
    let currentShoe = [...shoe];
    const updatedPlayers = currentPlayers.map(player => ({
      ...player,
      hand: player.locked ? [] : [currentShoe.pop(), currentShoe.pop()]
    }));
    
    const dealerHand = [currentShoe.pop(), currentShoe.pop()];
    
    setPlayers(updatedPlayers);
    setDealer({ hand: dealerHand, showAll: false });
    setShoe(currentShoe);
    setCurrentPlayerIndex(0);
    setGamePhase('playing');
    
    // Check if we hit the cut card
    if (currentShoe.length <= cutCardPosition) {
      setTimeout(() => {
        alert('Cut card reached! Reshuffling after this hand.');
      }, 1000);
    }
  };
  
  const playerAction = (action) => {
    const player = players[currentPlayerIndex];
    if (!player || player.type === 'ai' || player.locked) return;
    
    let currentShoe = [...shoe];
    let updatedPlayers = [...players];
    
    if (action === 'hit') {
      updatedPlayers[currentPlayerIndex].hand.push(currentShoe.pop());
      const handValue = calculateHandValue(updatedPlayers[currentPlayerIndex].hand);
      
      if (handValue > 21) {
        // Busted - move to next player
        moveToNextPlayer(updatedPlayers, currentShoe);
      } else {
        setPlayers(updatedPlayers);
        setShoe(currentShoe);
      }
    } else if (action === 'stand') {
      moveToNextPlayer(updatedPlayers, currentShoe);
    } else if (action === 'double') {
      if (player.coins >= 5) {
        updatedPlayers[currentPlayerIndex].coins -= 5;
        updatedPlayers[currentPlayerIndex].bet += 5;
        updatedPlayers[currentPlayerIndex].hand.push(currentShoe.pop());
        moveToNextPlayer(updatedPlayers, currentShoe);
      }
    } else if (action === 'split') {
      // Simplified split - would need more complex logic for full implementation
      if (player.coins >= 5 && player.hand.length === 2 && 
          player.hand[0].value === player.hand[1].value) {
        alert('Split functionality coming soon!');
      }
    }
  };
  
  const moveToNextPlayer = (updatedPlayers, currentShoe) => {
    let nextIndex = currentPlayerIndex + 1;
    
    // Skip AI players and locked players for now (in full version, AI would play)
    while (nextIndex < updatedPlayers.length && 
           (updatedPlayers[nextIndex].type === 'ai' || updatedPlayers[nextIndex].locked)) {
      nextIndex++;
    }
    
    if (nextIndex >= updatedPlayers.length) {
      // All players done, dealer plays
      playDealer(updatedPlayers, currentShoe);
    } else {
      setCurrentPlayerIndex(nextIndex);
      setPlayers(updatedPlayers);
      setShoe(currentShoe);
    }
  };
  
  const playDealer = (updatedPlayers, currentShoe) => {
    setGamePhase('dealer');
    let dealerHand = [...dealer.hand];
    
    setDealer({ hand: dealerHand, showAll: true });
    
    const dealerPlay = () => {
      let handValue = calculateHandValue(dealerHand);
      
      if (handValue < 17) {
        dealerHand.push(currentShoe.pop());
        setDealer({ hand: dealerHand, showAll: true });
        setTimeout(dealerPlay, 1000);
      } else {
        resolveHands(updatedPlayers, dealerHand, currentShoe);
      }
    };
    
    setTimeout(dealerPlay, 1000);
  };
  
  const resolveHands = (updatedPlayers, dealerHand, currentShoe) => {
    const dealerValue = calculateHandValue(dealerHand);
    const dealerBusted = dealerValue > 21;
    
    updatedPlayers = updatedPlayers.map(player => {
      if (player.locked || player.bet === 0) return player;
      
      const playerValue = calculateHandValue(player.hand);
      const playerBusted = playerValue > 21;
      
      let winnings = 0;
      
      if (playerBusted) {
        // Player loses bet (already deducted)
        winnings = 0;
      } else if (dealerBusted || playerValue > dealerValue) {
        // Player wins
        winnings = player.bet * 2;
      } else if (playerValue === dealerValue) {
        // Push
        winnings = player.bet;
      }
      // else player loses (winnings stays 0)
      
      const newCoins = player.coins + winnings;
      
      // Check if player is locked out
      let isLocked = false;
      if (newCoins === 0) {
        const lockTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        const lockedPlayers = JSON.parse(localStorage.getItem('lockedPlayers') || '{}');
        lockedPlayers[player.id] = lockTime;
        localStorage.setItem('lockedPlayers', JSON.stringify(lockedPlayers));
        isLocked = true;
      }
      
      return { ...player, coins: newCoins, locked: isLocked };
    });
    
    setPlayers(updatedPlayers);
    setShoe(currentShoe);
    setGamePhase('result');
  };
  
  const nextRound = () => {
    if (shoe.length <= cutCardPosition) {
      // Reshuffle
      const newShoe = initializeShoe(numDecks);
      setShoe(newShoe);
    }
    
    const resetPlayers = players.map(player => ({
      ...player,
      hand: [],
      bet: 0
    }));
    
    setPlayers(resetPlayers);
    setDealer({ hand: [], showAll: false });
    setGamePhase('betting');
  };
  
  const togglePlayerType = (index) => {
    const updatedPlayers = [...players];
    if (updatedPlayers[index].type === 'ai') {
      updatedPlayers[index].type = 'human';
      updatedPlayers[index].name = `Player ${index + 1}`;
    } else {
      updatedPlayers[index].type = 'ai';
      updatedPlayers[index].name = `AI ${index}`;
    }
    setPlayers(updatedPlayers);
  };
  
  const updatePlayerName = (index, name) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].name = name;
    setPlayers(updatedPlayers);
  };
  
  if (!acceptedTerms) {
    return (
      <div className="terms-screen">
        <div className="terms-container">
          <div className="logo-section">
            <h1 className="app-title">Blackjack Statistics</h1>
            <p className="app-subtitle">Learn Winning Odds Through Play</p>
          </div>
          
          <div className="terms-content">
            <h2>Terms of Use</h2>
            <div className="terms-text">
              <p>
                By checking here, I acknowledge and agree that the blackjack and its 
                statistical odds of winning information are for study purposes only and 
                may contain errors.
              </p>
              <p>
                This app is a game designed to learn about winning odds. It is designed 
                for entertainment purposes only and is not intended for real-money gambling.
              </p>
            </div>
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                onChange={(e) => e.target.checked && acceptTerms()} 
              />
              <span>I accept the Terms of Use</span>
            </label>
          </div>
        </div>
        
        <style jsx>{`
          .terms-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: 'Georgia', serif;
          }
          
          .terms-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          }
          
          .logo-section {
            text-align: center;
            margin-bottom: 40px;
          }
          
          .app-title {
            font-size: 2.5rem;
            color: #1a1a1a;
            margin: 0 0 10px 0;
            font-weight: 700;
            letter-spacing: -1px;
          }
          
          .app-subtitle {
            color: #666;
            font-size: 1.1rem;
            margin: 0;
            font-style: italic;
          }
          
          .terms-content h2 {
            color: #2c5364;
            margin-bottom: 20px;
            font-size: 1.8rem;
          }
          
          .terms-text {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          
          .terms-text p {
            margin: 0 0 15px 0;
            color: #333;
          }
          
          .terms-text p:last-child {
            margin-bottom: 0;
          }
          
          .checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 1.1rem;
            color: #1a1a1a;
          }
          
          .checkbox-label input {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            cursor: pointer;
          }
          
          @media (max-width: 640px) {
            .terms-container {
              padding: 30px 20px;
            }
            
            .app-title {
              font-size: 2rem;
            }
            
            .app-subtitle {
              font-size: 1rem;
            }
          }
        `}</style>
      </div>
    );
  }
  
  if (!gameMode) {
    return (
      <div className="game-select-screen">
        <div className="header">
          <h1 className="main-title">Blackjack Statistics</h1>
          <a href="https://www.m2eacircle.com/" className="circle-link">
            <Home size={24} />
            <span>m2ea Circle</span>
          </a>
        </div>
        
        <div className="mode-container">
          <h2>Select Game Mode</h2>
          <div className="mode-grid">
            <button 
              className="mode-card"
              onClick={() => setGameMode('regular')}
            >
              <div className="mode-icon">♠</div>
              <h3>Regular</h3>
              <p>Classic blackjack rules</p>
            </button>
            
            <button 
              className="mode-card"
              onClick={() => setGameMode('switch')}
            >
              <div className="mode-icon">♥</div>
              <h3>Switch</h3>
              <p>Switch cards between hands</p>
            </button>
            
            <button 
              className="mode-card"
              onClick={() => setGameMode('bahama')}
            >
              <div className="mode-icon">♦</div>
              <h3>Bahama</h3>
              <p>Caribbean style rules</p>
            </button>
          </div>
        </div>
        
        <footer className="footer">
          <a href="https://www.m2ealabs.com/" className="footer-link">© 2025 m2ea Labs. All rights reserved.</a>
          <button onClick={() => setAcceptedTerms(false)} className="terms-link">Terms of Use</button>
        </footer>
        
        <style jsx>{`
          .game-select-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            font-family: 'Georgia', serif;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 60px;
            flex-wrap: wrap;
            gap: 20px;
          }
          
          .main-title {
            font-size: 2.5rem;
            color: white;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .circle-link {
            display: flex;
            align-items: center;
            gap: 8px;
            color: white;
            text-decoration: none;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 25px;
            transition: all 0.3s;
          }
          
          .circle-link:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
          
          .mode-container {
            max-width: 900px;
            margin: 0 auto;
          }
          
          .mode-container h2 {
            text-align: center;
            color: white;
            font-size: 2rem;
            margin-bottom: 40px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .mode-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin-bottom: 60px;
          }
          
          .mode-card {
            background: white;
            border: none;
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          
          .mode-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          
          .mode-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            color: #667eea;
          }
          
          .mode-card h3 {
            font-size: 1.8rem;
            color: #1a1a1a;
            margin: 0 0 10px 0;
          }
          
          .mode-card p {
            color: #666;
            margin: 0;
            font-size: 1.1rem;
          }
          
          .footer {
            text-align: center;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          
          .footer-link, .terms-link {
            color: white;
            text-decoration: none;
            background: none;
            border: none;
            cursor: pointer;
            font-family: inherit;
            font-size: 1rem;
          }
          
          .footer-link:hover, .terms-link:hover {
            text-decoration: underline;
          }
          
          @media (max-width: 640px) {
            .main-title {
              font-size: 1.8rem;
            }
            
            .mode-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }
  
  if (gamePhase === 'setup') {
    return (
      <div className="setup-screen">
        <div className="header">
          <h1 className="main-title">Setup Game</h1>
          <a href="https://www.m2eacircle.com/" className="circle-link">
            <Home size={24} />
            <span>m2ea Circle</span>
          </a>
        </div>
        
        <div className="setup-container">
          <div className="setup-section">
            <h3>Number of Decks</h3>
            <div className="deck-selector">
              {[6, 7, 8].map(num => (
                <button
                  key={num}
                  className={`deck-btn ${numDecks === num ? 'active' : ''}`}
                  onClick={() => setNumDecks(num)}
                >
                  {num} Decks
                </button>
              ))}
            </div>
          </div>
          
          <div className="setup-section">
            <h3>Players</h3>
            <div className="players-list">
              {players.map((player, index) => (
                <div key={player.id} className="player-row">
                  <button 
                    className="type-toggle"
                    onClick={() => togglePlayerType(index)}
                  >
                    {player.type === 'human' ? '👤' : '🤖'}
                  </button>
                  
                  {player.type === 'human' ? (
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="name-input"
                      placeholder="Player name"
                    />
                  ) : (
                    <span className="ai-name">{player.name}</span>
                  )}
                  
                  <span className="coins-display">{player.coins} 🪙</span>
                </div>
              ))}
            </div>
          </div>
          
          <button className="start-btn" onClick={startGame}>
            Start Game
          </button>
          
          <button className="back-btn" onClick={() => setGameMode(null)}>
            ← Back to Mode Selection
          </button>
        </div>
        
        <footer className="footer">
          <a href="https://www.m2ealabs.com/" className="footer-link">© 2025 m2ea Labs. All rights reserved.</a>
          <button onClick={() => setAcceptedTerms(false)} className="terms-link">Terms of Use</button>
        </footer>
        
        <style jsx>{`
          .setup-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 20px;
            font-family: 'Georgia', serif;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            flex-wrap: wrap;
            gap: 20px;
          }
          
          .main-title {
            font-size: 2.5rem;
            color: white;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .circle-link {
            display: flex;
            align-items: center;
            gap: 8px;
            color: white;
            text-decoration: none;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 25px;
            transition: all 0.3s;
          }
          
          .circle-link:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          .setup-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          
          .setup-section {
            margin-bottom: 40px;
          }
          
          .setup-section h3 {
            color: #1a1a1a;
            margin-bottom: 20px;
            font-size: 1.5rem;
          }
          
          .deck-selector {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          
          .deck-btn {
            padding: 15px;
            border: 2px solid #ddd;
            background: white;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.3s;
            font-family: inherit;
          }
          
          .deck-btn:hover {
            border-color: #f5576c;
          }
          
          .deck-btn.active {
            background: #f5576c;
            color: white;
            border-color: #f5576c;
          }
          
          .players-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .player-row {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          
          .type-toggle {
            font-size: 1.5rem;
            background: white;
            border: 2px solid #ddd;
            border-radius: 10px;
            width: 50px;
            height: 50px;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .type-toggle:hover {
            border-color: #f5576c;
          }
          
          .name-input {
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 1.1rem;
            font-family: inherit;
          }
          
          .ai-name {
            flex: 1;
            font-size: 1.1rem;
            color: #666;
          }
          
          .coins-display {
            font-size: 1.1rem;
            font-weight: bold;
            color: #f5576c;
          }
          
          .start-btn, .back-btn {
            width: 100%;
            padding: 18px;
            border: none;
            border-radius: 10px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s;
            font-family: inherit;
            font-weight: bold;
          }
          
          .start-btn {
            background: #f5576c;
            color: white;
            margin-bottom: 15px;
          }
          
          .start-btn:hover {
            background: #e04659;
            transform: translateY(-2px);
          }
          
          .back-btn {
            background: #f8f9fa;
            color: #666;
          }
          
          .back-btn:hover {
            background: #e9ecef;
          }
          
          .footer {
            text-align: center;
            color: white;
            margin-top: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          
          .footer-link, .terms-link {
            color: white;
            text-decoration: none;
            background: none;
            border: none;
            cursor: pointer;
            font-family: inherit;
            font-size: 1rem;
          }
          
          .footer-link:hover, .terms-link:hover {
            text-decoration: underline;
          }
          
          @media (max-width: 640px) {
            .setup-container {
              padding: 30px 20px;
            }
            
            .deck-selector {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }
  
  // Game screen
  const currentPlayer = players[currentPlayerIndex];
  const canHit = gamePhase === 'playing' && currentPlayer && currentPlayer.type === 'human' && !currentPlayer.locked;
  const canDouble = canHit && currentPlayer.hand.length === 2 && currentPlayer.coins >= 5;
  const canSplit = canHit && currentPlayer.hand.length === 2 && 
                   currentPlayer.hand[0].value === currentPlayer.hand[1].value && 
                   currentPlayer.coins >= 5;
  
  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="title-section">
          <h1>Blackjack Statistics</h1>
          <span className="mode-badge">{gameMode.toUpperCase()}</span>
        </div>
        <a href="https://www.m2eacircle.com/" className="circle-link">
          <Home size={20} />
          <span>m2ea Circle</span>
        </a>
      </div>
      
      <div className="game-content">
        {/* Dealer Section */}
        <div className="dealer-section">
          <h3>Dealer</h3>
          <div className="hand-display">
            {dealer.hand.map((card, idx) => (
              <div key={idx} className={`card ${!dealer.showAll && idx === 1 ? 'face-down' : ''}`}>
                {dealer.showAll || idx === 0 ? (
                  <>
                    <span className={`card-suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                      {card.suit}
                    </span>
                    <span className="card-value">{card.display}</span>
                  </>
                ) : (
                  <span className="card-back">🂠</span>
                )}
              </div>
            ))}
          </div>
          {dealer.showAll && (
            <div className="hand-value">Total: {calculateHandValue(dealer.hand)}</div>
          )}
        </div>
        
        {/* Players Section */}
        <div className="players-section">
          {players.map((player, idx) => (
            <div 
              key={player.id} 
              className={`player-box ${idx === currentPlayerIndex && gamePhase === 'playing' ? 'active' : ''} ${player.locked ? 'locked' : ''}`}
            >
              <div className="player-info">
                <h4>{player.name}</h4>
                <div className="player-stats">
                  <span>🪙 {player.coins}</span>
                  {player.bet > 0 && <span className="bet-amount">Bet: {player.bet}</span>}
                </div>
              </div>
              
              {player.locked ? (
                <div className="locked-message">
                  🔒 Out of coins. Try again in 24 hours.
                </div>
              ) : (
                <>
                  <div className="hand-display">
                    {player.hand.map((card, cardIdx) => (
                      <div key={cardIdx} className="card">
                        <span className={`card-suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                          {card.suit}
                        </span>
                        <span className="card-value">{card.display}</span>
                      </div>
                    ))}
                  </div>
                  
                  {player.hand.length > 0 && (
                    <div className="hand-value">
                      Total: {calculateHandValue(player.hand)}
                      {calculateHandValue(player.hand) > 21 && <span className="bust"> BUST!</span>}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="actions-section">
          {gamePhase === 'betting' && (
            <button className="action-btn primary" onClick={placeBets}>
              Place Bets (5 coins)
            </button>
          )}
          
          {canHit && (
            <div className="action-grid">
              <button 
                className="action-btn" 
                onClick={() => playerAction('hit')}
              >
                <div className="btn-content">
                  <span>HIT</span>
                  <span className="win-prob">
                    {calculateWinProbability(currentPlayer.hand, dealer.hand[0], 'hit', null)}%
                  </span>
                </div>
              </button>
              
              <button 
                className="action-btn" 
                onClick={() => playerAction('stand')}
              >
                <div className="btn-content">
                  <span>STAND</span>
                  <span className="win-prob">
                    {calculateWinProbability(currentPlayer.hand, dealer.hand[0], 'stand', null)}%
                  </span>
                </div>
              </button>
              
              {canDouble && (
                <button 
                  className="action-btn" 
                  onClick={() => playerAction('double')}
                >
                  <div className="btn-content">
                    <span>DOUBLE</span>
                    <span className="win-prob">
                      {calculateWinProbability(currentPlayer.hand, dealer.hand[0], 'double', null)}%
                    </span>
                  </div>
                </button>
              )}
              
              {canSplit && (
                <button 
                  className="action-btn" 
                  onClick={() => playerAction('split')}
                >
                  <div className="btn-content">
                    <span>SPLIT</span>
                    <span className="win-prob">
                      {calculateWinProbability(currentPlayer.hand, dealer.hand[0], 'split', null)}%
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}
          
          {gamePhase === 'dealer' && (
            <div className="status-message">Dealer playing...</div>
          )}
          
          {gamePhase === 'result' && (
            <button className="action-btn primary" onClick={nextRound}>
              Next Round
            </button>
          )}
        </div>
        
        <div className="stats-info">
          <p>💡 Win percentages are statistical estimates based on current cards and basic strategy.</p>
          <p>📊 Actual results may vary as we cannot predict the next card.</p>
        </div>
      </div>
      
      <footer className="footer">
        <a href="https://www.m2ealabs.com/" className="footer-link">© 2025 m2ea Labs. All rights reserved.</a>
        <button onClick={() => setAcceptedTerms(false)} className="terms-link">Terms of Use</button>
      </footer>
      
      <style jsx>{`
        .game-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%);
          padding: 20px;
          font-family: 'Georgia', serif;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .title-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .title-section h1 {
          font-size: 1.8rem;
          color: white;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .mode-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9rem;
        }
        
        .circle-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          transition: all 0.3s;
          font-size: 0.9rem;
        }
        
        .circle-link:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .game-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .dealer-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
        }
        
        .dealer-section h3 {
          color: white;
          margin: 0 0 15px 0;
          font-size: 1.3rem;
        }
        
        .hand-display {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        
        .card {
          width: 80px;
          height: 112px;
          background: white;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          position: relative;
          transition: transform 0.3s;
        }
        
        .card:hover {
          transform: translateY(-5px);
        }
        
        .card.face-down {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .card-suit {
          font-size: 1.5rem;
          color: black;
        }
        
        .card-suit.red {
          color: #dc2626;
        }
        
        .card-value {
          font-size: 1.8rem;
          font-weight: bold;
          color: inherit;
        }
        
        .card-back {
          font-size: 3rem;
          color: white;
        }
        
        .hand-value {
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .hand-value .bust {
          color: #ff4444;
        }
        
        .players-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .player-box {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 20px;
          backdrop-filter: blur(10px);
          border: 2px solid transparent;
          transition: all 0.3s;
        }
        
        .player-box.active {
          border-color: #fbbf24;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }
        
        .player-box.locked {
          opacity: 0.6;
        }
        
        .player-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .player-info h4 {
          color: white;
          margin: 0;
          font-size: 1.2rem;
        }
        
        .player-stats {
          display: flex;
          gap: 15px;
          color: white;
          font-size: 1rem;
        }
        
        .bet-amount {
          background: rgba(251, 191, 36, 0.3);
          padding: 4px 10px;
          border-radius: 10px;
        }
        
        .locked-message {
          color: #fbbf24;
          text-align: center;
          padding: 20px;
          font-size: 1.1rem;
        }
        
        .actions-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 25px;
          backdrop-filter: blur(10px);
          margin-bottom: 20px;
        }
        
        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 15px;
        }
        
        .action-btn {
          padding: 15px 25px;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.9);
          color: #1a1a1a;
        }
        
        .action-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
        }
        
        .action-btn.primary {
          background: #fbbf24;
          color: #1a1a1a;
          width: 100%;
        }
        
        .btn-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .win-prob {
          font-size: 0.85rem;
          color: #059669;
          font-weight: normal;
        }
        
        .status-message {
          color: white;
          text-align: center;
          font-size: 1.3rem;
          padding: 20px;
        }
        
        .stats-info {
          background: rgba(251, 191, 36, 0.2);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .stats-info p {
          color: white;
          margin: 5px 0;
          font-size: 0.95rem;
        }
        
        .footer {
          text-align: center;
          color: white;
          margin-top: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .footer-link, .terms-link {
          color: white;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.95rem;
        }
        
        .footer-link:hover, .terms-link:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .title-section h1 {
            font-size: 1.4rem;
          }
          
          .players-section {
            grid-template-columns: 1fr;
          }
          
          .card {
            width: 60px;
            height: 84px;
          }
          
          .card-suit {
            font-size: 1.2rem;
          }
          
          .card-value {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BlackjackStats;
