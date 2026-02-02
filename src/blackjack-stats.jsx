import React, { useState, useEffect, useRef } from 'react';
import { Home } from 'lucide-react';

// Statistical calculation based on Edward Thorp's methodology
// References: "Beat the Dealer" (1962) and refined card counting mathematics
const calculateWinProbability = (playerHand, dealerUpCard, action, shoe) => {
  const playerTotal = calculateHandValue(playerHand);
  const dealerValue = dealerUpCard.value;
  
  // Thorp's approach: Calculate based on remaining deck composition
  // For simplification, we use his basic strategy probabilities refined through simulation
  
  // SPECIAL CASE: Player has 21 (Blackjack)
  if (playerTotal === 21) {
    if (action === 'hit') return 0; // Automatic bust
    if (action === 'stand') return 100; // Optimal
    if (action === 'double') return 0; // Can't improve
    if (action === 'split') return 0; // Already 21
  }
  
  // Thorp's dealer bust probabilities by upcard
  const dealerBustProbability = {
    2: 0.3539,  // Dealer busts 35.39% with 2 showing
    3: 0.3745,  // 37.45% with 3
    4: 0.4022,  // 40.22% with 4
    5: 0.4281,  // 42.81% with 5
    6: 0.4315,  // 43.15% with 6 (highest bust rate)
    7: 0.2618,  // 26.18% with 7
    8: 0.2385,  // 23.85% with 8
    9: 0.2307,  // 23.07% with 9
    10: 0.2130, // 21.30% with 10
    11: 0.1157  // 11.57% with Ace (lowest bust rate)
  };
  
  // Get dealer bust probability
  const dealerBust = dealerBustProbability[dealerValue] || 0.25;
  
  if (action === 'stand') {
    // Thorp's standing probabilities
    // Based on dealer's final total distribution
    let winProb = 0;
    
    if (playerTotal >= 17) {
      // Strong hands - Thorp's calculations show these win rates
      if (dealerValue >= 2 && dealerValue <= 6) {
        // Dealer weak upcard - high win probability
        winProb = 0.40 + dealerBust * 0.5 + (playerTotal - 17) * 0.03;
      } else if (dealerValue >= 7 && dealerValue <= 9) {
        // Dealer medium upcard
        winProb = 0.30 + dealerBust * 0.4 + (playerTotal - 17) * 0.04;
      } else {
        // Dealer strong upcard (10 or Ace)
        winProb = 0.20 + dealerBust * 0.5 + (playerTotal - 17) * 0.05;
      }
    } else if (playerTotal >= 12 && playerTotal <= 16) {
      // Stiff hands - Thorp showed these are highly dependent on dealer upcard
      if (dealerValue >= 2 && dealerValue <= 6) {
        // Stand on stiffs vs dealer bust cards
        winProb = dealerBust + (6 - dealerValue) * 0.02;
      } else {
        // Stand on stiffs vs dealer pat cards - poor odds
        winProb = dealerBust * 0.6;
      }
    } else {
      // Very weak hands (11 or less)
      winProb = dealerBust * 0.5;
    }
    
    return Math.round(Math.min(95, Math.max(5, winProb * 100)));
  }
  
  if (action === 'hit') {
    // Thorp's hitting probabilities
    // Calculate probability of improving without busting
    
    if (playerTotal <= 11) {
      // Cannot bust - Thorp showed these have ~58-65% win rate
      return Math.round(58 + (11 - playerTotal) * 0.7);
    }
    
    if (playerTotal >= 17) {
      // Very likely to bust - Thorp's calculations
      const bustProb = (playerTotal - 16) * 0.20; // 20% per point over 16
      return Math.round(Math.max(5, (1 - bustProb) * 20));
    }
    
    // 12-16: Stiff hands
    // Thorp's key insight: hitting stiffs depends heavily on dealer upcard
    const cardsNotBusting = 21 - playerTotal;
    const approximateBustProb = Math.max(0, (playerTotal - 11) / 10);
    const notBustProb = 1 - approximateBustProb;
    
    let hitValue = notBustProb * 0.5; // Base value if not busting
    
    // Thorp: Adjust for dealer upcard strength
    if (dealerValue >= 7) {
      // Must hit against strong dealer cards
      hitValue += 0.15;
    }
    
    return Math.round(Math.min(70, Math.max(5, hitValue * 100)));
  }
  
  if (action === 'double') {
    // Thorp's doubling strategy - double down on advantageous hands only
    
    if (playerTotal === 11) {
      // Thorp: 11 is the strongest doubling hand
      if (dealerValue >= 2 && dealerValue <= 10) {
        return Math.round(65 + (10 - dealerValue) * 0.5); // 65-70%
      }
      return 62; // Against Ace
    }
    
    if (playerTotal === 10) {
      // Thorp: Double on 10 vs 2-9
      if (dealerValue >= 2 && dealerValue <= 9) {
        return Math.round(60 + (9 - dealerValue) * 0.5); // 60-65%
      }
      return 50; // Against 10 or Ace
    }
    
    if (playerTotal === 9) {
      // Thorp: Double on 9 vs 3-6 only
      if (dealerValue >= 3 && dealerValue <= 6) {
        return Math.round(52 + (6 - dealerValue) * 1.0); // 52-56%
      }
      return 45; // Otherwise just hit
    }
    
    // Soft hands (with Ace counted as 11)
    const hasAce = playerHand.some(card => card.value === 11);
    if (hasAce && playerTotal <= 21) {
      if (playerTotal >= 17 && playerTotal <= 18) {
        // Soft 17-18: Thorp recommends doubling vs 3-6
        if (dealerValue >= 3 && dealerValue <= 6) {
          return Math.round(53 + (6 - dealerValue) * 0.5);
        }
      }
      if (playerTotal >= 13 && playerTotal <= 16) {
        // Soft 13-16: Double vs 5-6
        if (dealerValue === 5 || dealerValue === 6) {
          return 54;
        }
      }
    }
    
    return 45; // Default for non-optimal doubling situations
  }
  
  if (action === 'split') {
    // Thorp's pair splitting strategy
    const pairValue = playerHand[0].value;
    
    if (pairValue === 11) {
      // Thorp: ALWAYS split Aces - highest expected value
      return 75;
    }
    
    if (pairValue === 8) {
      // Thorp: ALWAYS split 8s - avoid 16
      return 62;
    }
    
    if (pairValue === 10) {
      // Thorp: NEVER split 10s - already have 20
      return 35;
    }
    
    if (pairValue === 9) {
      // Thorp: Split 9s vs 2-9 except 7
      if ((dealerValue >= 2 && dealerValue <= 6) || dealerValue === 8 || dealerValue === 9) {
        return 58;
      }
      return 40; // Stand on 18 vs 7, 10, A
    }
    
    if (pairValue === 7) {
      // Thorp: Split 7s vs 2-7
      if (dealerValue >= 2 && dealerValue <= 7) {
        return 54;
      }
      return 38;
    }
    
    if (pairValue === 6) {
      // Thorp: Split 6s vs 2-6
      if (dealerValue >= 2 && dealerValue <= 6) {
        return 52;
      }
      return 35;
    }
    
    if (pairValue === 4) {
      // Thorp: Split 4s vs 5-6 only
      if (dealerValue === 5 || dealerValue === 6) {
        return 51;
      }
      return 38;
    }
    
    if (pairValue === 3 || pairValue === 2) {
      // Thorp: Split 2s/3s vs 2-7
      if (dealerValue >= 2 && dealerValue <= 7) {
        return 50;
      }
      return 36;
    }
    
    if (pairValue === 5) {
      // Thorp: NEVER split 5s - treat as 10 and double
      return 35;
    }
    
    return 45;
  }
  
  return 50; // Default fallback
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

// Terms Modal Component
const TermsModal = ({ onClose, alreadyAccepted }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '30px 30px 20px 30px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.8rem' }}>Terms of Use</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '2rem',
            color: '#666',
            cursor: 'pointer',
            lineHeight: 1,
            padding: 0,
            width: '30px',
            height: '30px'
          }}>×</button>
        </div>
        
        <div style={{ padding: '30px', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 15px 0', color: '#333' }}>
            By checking here, I acknowledge and agree that the casino games and their 
            statistical odds of winning information are for study purposes only and 
            may contain errors.
          </p>
          <p style={{ margin: '0 0 15px 0', color: '#333' }}>
            This app is a game designed to learn about winning odds. It is designed 
            for entertainment purposes only and is not intended for real-money gambling.
          </p>
          
          {alreadyAccepted && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#d1fae5',
              borderRadius: '10px',
              color: '#065f46',
              fontWeight: 'bold'
            }}>
              ✓ You have already accepted these terms
            </div>
          )}
        </div>
        
        <div style={{ padding: '20px 30px 30px 30px', textAlign: 'right' }}>
          <button onClick={onClose} style={{
            padding: '12px 30px',
            background: '#1e3c72',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Replay Game Log Modal
const ReplayModal = ({ onClose, gameHistory }) => {
  if (!gameHistory) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        borderRadius: '20px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        color: 'white'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '30px 30px 20px 30px',
          borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '2rem' }}>📋 Game Log Replay</h2>
            <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>{gameHistory.timestamp}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '2.5rem',
            color: 'white',
            cursor: 'pointer',
            lineHeight: 1,
            padding: 0,
            width: '40px',
            height: '40px',
            opacity: 0.7
          }}>×</button>
        </div>
        
        <div style={{ padding: '30px' }}>
          {/* Dealer Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '25px',
            border: '2px solid rgba(251, 191, 36, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#fbbf24', fontSize: '1.3rem' }}>🎰 Dealer</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {gameHistory.dealer.hand.map((card, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  color: card.suit === '♥' || card.suit === '♦' ? '#ef4444' : '#1f2937',
                  padding: '15px',
                  borderRadius: '8px',
                  minWidth: '50px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  <div>{card.suit}</div>
                  <div>{card.display}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '1.1rem' }}>
              <strong>Total:</strong> {gameHistory.dealer.value}
              {gameHistory.dealer.busted && <span style={{ color: '#ef4444', marginLeft: '10px', fontWeight: 'bold' }}>BUST!</span>}
            </div>
          </div>
          
          {/* Players Section */}
          <h3 style={{ margin: '0 0 15px 0', color: '#fbbf24', fontSize: '1.3rem' }}>👥 Players</h3>
          {gameHistory.players.map((player, idx) => {
            // Calculate results for each hand if split
            const dealerValue = gameHistory.dealer.value;
            const dealerBusted = gameHistory.dealer.busted;
            
            const getHandResult = (hand) => {
              const handValue = hand.reduce((sum, card) => {
                let value = sum;
                if (card.value === 11) {
                  value += 11;
                } else {
                  value += card.value;
                }
                return value;
              }, 0);
              
              // Adjust for aces
              let total = handValue;
              let aces = hand.filter(c => c.value === 11).length;
              while (total > 21 && aces > 0) {
                total -= 10;
                aces--;
              }
              
              const handBusted = total > 21;
              
              if (handBusted) {
                return 'LOSE';
              } else if (dealerBusted || total > dealerValue) {
                return 'WIN';
              } else if (total === dealerValue) {
                return 'PUSH';
              } else {
                return 'LOSE';
              }
            };
            
            const hand1Result = getHandResult(player.hand);
            const hand2Result = player.splitHand ? getHandResult(player.splitHand) : null;
            
            // Determine border color based on overall result or worst result if split
            let borderColor = '#fbbf24'; // Default PUSH
            if (player.splitHand) {
              // If split, show border based on worst result
              if (hand1Result === 'LOSE' || hand2Result === 'LOSE') {
                borderColor = '#ef4444';
              } else if (hand1Result === 'WIN' && hand2Result === 'WIN') {
                borderColor = '#10b981';
              }
            } else {
              borderColor = hand1Result === 'WIN' ? '#10b981' : 
                           hand1Result === 'LOSE' ? '#ef4444' : '#fbbf24';
            }
            
            return (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '15px',
                border: `2px solid ${borderColor}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>
                      {player.type === 'ai' ? '🤖' : '👤'} {player.name}
                    </h4>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      Bet: <strong>{player.bet} coins</strong> {player.splitHand && '(×2 for split)'}
                    </div>
                  </div>
                  
                  {/* Show separate badges for split hands */}
                  {player.splitHand ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        background: hand1Result === 'WIN' ? '#10b981' : 
                                   hand1Result === 'LOSE' ? '#ef4444' : '#fbbf24',
                        color: 'white'
                      }}>
                        H1: {hand1Result === 'WIN' ? '🎉 WIN' : 
                             hand1Result === 'LOSE' ? '💔 LOSE' : '🤝 PUSH'}
                      </div>
                      <div style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        background: hand2Result === 'WIN' ? '#10b981' : 
                                   hand2Result === 'LOSE' ? '#ef4444' : '#fbbf24',
                        color: 'white'
                      }}>
                        H2: {hand2Result === 'WIN' ? '🎉 WIN' : 
                             hand2Result === 'LOSE' ? '💔 LOSE' : '🤝 PUSH'}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      background: hand1Result === 'WIN' ? '#10b981' : 
                                 hand1Result === 'LOSE' ? '#ef4444' : '#fbbf24',
                      color: 'white'
                    }}>
                      {hand1Result === 'WIN' ? '🎉 WIN' : 
                       hand1Result === 'LOSE' ? '💔 LOSE' : '🤝 PUSH'}
                    </div>
                  )}
                </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px' }}>Hand:</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {player.hand.map((card, cardIdx) => (
                    <div key={cardIdx} style={{
                      background: 'white',
                      color: card.suit === '♥' || card.suit === '♦' ? '#ef4444' : '#1f2937',
                      padding: '12px',
                      borderRadius: '6px',
                      minWidth: '40px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ fontSize: '0.8rem' }}>{card.suit}</div>
                      <div>{card.display}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px', fontSize: '1rem' }}>
                  <strong>Total:</strong> {player.handValue}
                  {player.busted && <span style={{ color: '#ef4444', marginLeft: '10px', fontWeight: 'bold' }}>BUST!</span>}
                </div>
              </div>
              
              {player.splitHand && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px' }}>Split Hand:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {player.splitHand.map((card, cardIdx) => (
                      <div key={cardIdx} style={{
                        background: 'white',
                        color: card.suit === '♥' || card.suit === '♦' ? '#ef4444' : '#1f2937',
                        padding: '12px',
                        borderRadius: '6px',
                        minWidth: '40px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        <div style={{ fontSize: '0.8rem' }}>{card.suit}</div>
                        <div>{card.display}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '1rem' }}>
                    <strong>Total:</strong> {player.splitHandValue}
                  </div>
                </div>
              )}
              
              {/* Decision Log */}
              {player.decisions && player.decisions.length > 0 && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '10px', color: '#fbbf24' }}>
                    📊 Decision Log:
                  </div>
                  {player.decisions.map((decision, decIdx) => (
                    <div key={decIdx} style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '10px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ color: '#fbbf24' }}>#{decIdx + 1}:</strong>{' '}
                          <span style={{ 
                            background: decision.action === 'HIT' ? '#3b82f6' : 
                                       decision.action === 'STAND' ? '#10b981' : 
                                       decision.action === 'DOUBLE' ? '#f59e0b' : 
                                       decision.action === 'SPLIT' ? '#8b5cf6' : '#6b7280',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}>
                            {decision.action}
                          </span>
                          {decision.splitHand && <span style={{ marginLeft: '8px', opacity: 0.7 }}>(Split Hand)</span>}
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          Hand: {decision.handValue} vs Dealer {decision.dealerCard.display}{decision.dealerCard.suit}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px', fontSize: '0.75rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '4px 6px', borderRadius: '4px' }}>
                          HIT: <strong>{decision.probabilities.hit}%</strong>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '4px 6px', borderRadius: '4px' }}>
                          STAND: <strong>{decision.probabilities.stand}%</strong>
                        </div>
                        {decision.probabilities.double !== null && (
                          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '4px 6px', borderRadius: '4px' }}>
                            DOUBLE: <strong>{decision.probabilities.double}%</strong>
                          </div>
                        )}
                        {decision.probabilities.split !== null && (
                          <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '4px 6px', borderRadius: '4px' }}>
                            SPLIT: <strong>{decision.probabilities.split}%</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ 
                marginTop: '15px', 
                paddingTop: '15px', 
                borderTop: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.95rem'
              }}>
                <div>
                  Coins Before: <strong>{player.initialCoins}</strong>
                </div>
                <div style={{ 
                  color: player.finalCoins > player.initialCoins ? '#10b981' : 
                         player.finalCoins < player.initialCoins ? '#ef4444' : '#fbbf24',
                  fontWeight: 'bold'
                }}>
                  Coins After: <strong>{player.finalCoins}</strong>
                  {player.finalCoins > player.initialCoins && <span> (+{player.finalCoins - player.initialCoins})</span>}
                  {player.finalCoins < player.initialCoins && <span> ({player.finalCoins - player.initialCoins})</span>}
                </div>
              </div>
            </div>
          );
          })}
        </div>
        
        <div style={{ padding: '20px 30px 30px 30px', textAlign: 'center', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
          <button onClick={onClose} style={{
            padding: '15px 40px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 'bold'
          }}>Close Replay</button>
        </div>
      </div>
    </div>
  );
};

// Rules Modal Component
const RulesModal = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          padding: '30px',
          color: 'white'
        }}>
          <h2 style={{
            margin: '0 0 25px 0',
            fontSize: '2rem',
            textAlign: 'center',
            borderBottom: '2px solid rgba(255,255,255,0.3)',
            paddingBottom: '15px'
          }}>
            Blackjack Regular Rules
          </h2>
          
          <div style={{
            fontSize: '1.1rem',
            lineHeight: '1.8'
          }}>
            <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '1.4rem' }}>
              🎯 Goal
            </h3>
            <p style={{ marginLeft: '15px' }}>
              The goal of blackjack is to reach 21 without going over.
            </p>
            
            <h3 style={{ marginTop: '25px', marginBottom: '10px', fontSize: '1.4rem' }}>
              🃏 Card Values
            </h3>
            <ul style={{ marginLeft: '30px' }}>
              <li><strong>Aces:</strong> Count as 1 or 11</li>
              <li><strong>J, Q, K:</strong> Count as 10</li>
              <li><strong>Number cards:</strong> Face value</li>
            </ul>
            
            <h3 style={{ marginTop: '25px', marginBottom: '10px', fontSize: '1.4rem' }}>
              🎮 Game Actions
            </h3>
            <div style={{ marginLeft: '15px' }}>
              <p><strong>Hit:</strong> Request one or more additional cards.</p>
              <p><strong>Stand:</strong> Stop taking cards and play with your current hand.</p>
              <p><strong>Split:</strong> If the first two cards have the same value, you can split into two hands, up to a maximum of four hands. Each hand is played separately.</p>
              <p><strong>Double:</strong> After the first two cards are dealt, wager an additional amount equal to the original bet. You receive only one additional card after doubling down.</p>
            </div>
            
            <h3 style={{ marginTop: '25px', marginBottom: '10px', fontSize: '1.4rem' }}>
              🏆 Winning
            </h3>
            <ul style={{ marginLeft: '30px' }}>
              <li><strong>Blackjack:</strong> 21 with first 2 cards (pays 3:2)</li>
              <li><strong>Win:</strong> Higher total than dealer without busting</li>
              <li><strong>Push:</strong> Same total as dealer (tie)</li>
              <li><strong>Bust:</strong> Over 21 (automatic loss)</li>
            </ul>
          </div>
        </div>
        
        <div style={{
          padding: '20px 30px 30px 30px',
          textAlign: 'center',
          borderTop: '2px solid rgba(255,255,255,0.2)'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '15px 40px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Switch Rules Modal Component
const SwitchRulesModal = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '20px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          padding: '30px',
          color: 'white'
        }}>
          <h2 style={{
            margin: '0 0 25px 0',
            fontSize: '2rem',
            textAlign: 'center',
            borderBottom: '2px solid rgba(255,255,255,0.3)',
            paddingBottom: '15px'
          }}>
            Blackjack Switch Rules
          </h2>
          
          <div style={{
            fontSize: '1.1rem',
            lineHeight: '1.8'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                ℹ️ The basic rules are the same as Regular Mode, with additional rules specific to Switch Mode.
              </p>
            </div>
            
            <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '1.4rem' }}>
              🃏 Starting Hands
            </h3>
            <p style={{ marginLeft: '15px' }}>
              In Switch Mode, a player is dealt <strong>two pairs of cards</strong> to start the game.
              Each pair becomes a separate hand that is played independently.
            </p>
            
            <h3 style={{ marginTop: '25px', marginBottom: '10px', fontSize: '1.4rem' }}>
              🎮 Game Actions and Rules
            </h3>
            
            <div style={{ marginLeft: '15px' }}>
              <p><strong>🔄 Switch:</strong></p>
              <p style={{ marginLeft: '20px', marginTop: '5px' }}>
                After receiving the first two cards for both hands, a player may choose to 
                <strong> keep the hands as dealt</strong> or ask the dealer to 
                <strong> switch the second card between the two hands</strong>.
              </p>
              
              <p style={{ marginTop: '15px' }}><strong>🤝 Push (Dealer 22):</strong></p>
              <p style={{ marginLeft: '20px', marginTop: '5px' }}>
                If a player's hand is not a blackjack and the dealer's hand totals a 
                <strong> hard 22</strong>, the result is a <strong>push</strong>. 
                The hand neither wins nor loses, and the player's bet is returned.
              </p>
              
              <p style={{ marginTop: '15px' }}><strong>💎 Super Match:</strong></p>
              <p style={{ marginLeft: '20px', marginTop: '5px' }}>
                A player may wager half of the original bet on the Super Match side bet. 
                If the player's two pairs meet the conditions below, the Super Match wins:
              </p>
              <ul style={{ marginLeft: '40px', marginTop: '10px' }}>
                <li>One pair: 1:1</li>
                <li>Three of a kind: 5:1</li>
                <li>Two pairs: 7:1</li>
                <li>Four of a kind: 50:1</li>
              </ul>
            </div>
            
            <div style={{
              background: 'rgba(255,255,0,0.2)',
              border: '2px solid rgba(255,255,0,0.5)',
              padding: '15px',
              borderRadius: '10px',
              marginTop: '25px'
            }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                <strong>⚠️ Note:</strong> Due to logic complexity, the Switch Mode in this app 
                does not fully follow the real Switch rules. For example, this app does not 
                support Split play in Switch Mode, while the official Switch rules allow Split 
                play with the same rules as Regular Mode.
              </p>
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '20px 30px 30px 30px',
          textAlign: 'center',
          borderTop: '2px solid rgba(255,255,255,0.2)'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '15px 40px',
              background: '#f5576c',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const BlackjackStats = () => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [gameMode, setGameMode] = useState(null); // 'regular', 'switch', 'bahama'
  const [numDecks, setNumDecks] = useState(6);
  const [numAIPlayers, setNumAIPlayers] = useState(2); // 2-4 AI players
  const [players, setPlayers] = useState([
    { id: 1, type: 'human', name: 'Human Player', coins: 100, hand: [], splitHand: null, numSplits: 0, bet: 0, locked: false },
    { id: 2, type: 'ai', name: 'AI 1', coins: 100, hand: [], splitHand: null, numSplits: 0, bet: 0, locked: false },
    { id: 3, type: 'ai', name: 'AI 2', coins: 100, hand: [], splitHand: null, numSplits: 0, bet: 0, locked: false }
  ]);
  const [dealer, setDealer] = useState({ hand: [], showAll: false });
  const [shoe, setShoe] = useState([]);
  const [cutCardPosition, setCutCardPosition] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'betting', 'superMatch', 'playing', 'dealer', 'result', 'switch'
  const [showStats, setShowStats] = useState(false);
  const [editingPlayers, setEditingPlayers] = useState(false);
  const [showShuffleAnimation, setShowShuffleAnimation] = useState(false);
  const [gameHistory, setGameHistory] = useState(null); // Store last game for replay
  const [showReplay, setShowReplay] = useState(false); // Show replay modal
  const [showRulesModal, setShowRulesModal] = useState(false); // Show rules modal
  const [showSwitchRulesModal, setShowSwitchRulesModal] = useState(false); // Show Switch rules modal
  
  // Refs to always have latest state in callbacks
  const playersRef = useRef(players);
  const shoeRef = useRef(shoe);
  const dealerRef = useRef(dealer);
  
  // Update refs when state changes
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  
  useEffect(() => {
    shoeRef.current = shoe;
  }, [shoe]);
  
  useEffect(() => {
    dealerRef.current = dealer;
  }, [dealer]);
  
  // AUTO-TRIGGER AI SWITCH DECISION
  useEffect(() => {
    if (gamePhase !== 'switch') return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // If current player is AI and not locked, make switch decision after delay
    if (currentPlayer.type === 'ai' && !currentPlayer.locked && currentPlayer.hand.length > 0 && currentPlayer.splitHand) {
      const timeoutId = setTimeout(() => {
        handleAISwitchDecision();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayerIndex, players, gamePhase]);
  
  // AUTO-TRIGGER AI SUPER MATCH DECISION
  useEffect(() => {
    if (gamePhase !== 'superMatch') return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // If current player is AI and not locked, make Super Match decision after delay
    if (currentPlayer.type === 'ai' && !currentPlayer.locked) {
      const timeoutId = setTimeout(() => {
        handleAISuperMatchDecision();
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayerIndex, players, gamePhase]);
  
  const handleAISuperMatchDecision = () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== 'ai' || currentPlayer.locked) return;
    
    // AI strategy: Always bet on Super Match if they have enough coins
    // It's a side bet with good odds
    if (currentPlayer.coins >= 5) {
      console.log(`AI ${currentPlayer.name} places Super Match bet`);
      placeSuperMatchBet();
    } else {
      console.log(`AI ${currentPlayer.name} skips Super Match (not enough coins)`);
      skipSuperMatchBet();
    }
  };
  
  const handleAISwitchDecision = () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== 'ai' || currentPlayer.locked) return;
    if (!currentPlayer.hand || !currentPlayer.splitHand) return;
    
    // AI strategy: Switch if it improves the worse hand
    const hand1Value = calculateHandValue(currentPlayer.hand);
    const hand2Value = calculateHandValue(currentPlayer.splitHand);
    
    // Calculate values after switch
    const hand1AfterSwitch = calculateHandValue([currentPlayer.hand[0], currentPlayer.splitHand[1]]);
    const hand2AfterSwitch = calculateHandValue([currentPlayer.splitHand[0], currentPlayer.hand[1]]);
    
    // Calculate minimum hand value (worst hand)
    const minValueBefore = Math.min(hand1Value, hand2Value);
    const minValueAfter = Math.min(hand1AfterSwitch, hand2AfterSwitch);
    
    // Switch if it improves the worst hand
    if (minValueAfter > minValueBefore) {
      console.log(`AI ${currentPlayer.name} decides to SWITCH`);
      executeSwitch();
    } else {
      console.log(`AI ${currentPlayer.name} decides to KEEP`);
      keepHands();
    }
  };
  
  // AUTO-TRIGGER AI PLAY
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // If current player is AI and not locked, play after delay
    if (currentPlayer.type === 'ai' && !currentPlayer.locked && currentPlayer.hand.length > 0) {
      const timeoutId = setTimeout(() => {
        handleAITurn();
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayerIndex, players, gamePhase]);
  
  const handleAITurn = () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== 'ai' || currentPlayer.locked) return;
    if (!dealer.hand[0]) return;
    
    const decision = getAIDecision(currentPlayer.hand, dealer.hand[0]);
    console.log(`AI ${currentPlayerIndex} (${currentPlayer.name}) decides:`, decision);
    
    // Track AI decision with probabilities
    const dealerUpCard = dealer.hand[0];
    const aiDecisionRecord = {
      action: decision.toUpperCase(),
      hand: [...currentPlayer.hand],
      handValue: calculateHandValue(currentPlayer.hand),
      dealerCard: dealerUpCard,
      probabilities: {
        hit: calculateWinProbability(currentPlayer.hand, dealerUpCard, 'hit', null),
        stand: calculateWinProbability(currentPlayer.hand, dealerUpCard, 'stand', null),
        double: currentPlayer.hand.length === 2 ? calculateWinProbability(currentPlayer.hand, dealerUpCard, 'double', null) : null,
        split: currentPlayer.hand.length === 2 && currentPlayer.hand[0].value === currentPlayer.hand[1].value ? calculateWinProbability(currentPlayer.hand, dealerUpCard, 'split', null) : null
      },
      splitHand: false
    };
    
    // Execute decision
    if (decision === 'hit') {
      const newShoe = [...shoe];
      const newPlayers = [...players];
      
      // Add decision record before executing
      if (!newPlayers[currentPlayerIndex].decisions) {
        newPlayers[currentPlayerIndex].decisions = [];
      }
      newPlayers[currentPlayerIndex].decisions.push(aiDecisionRecord);
      
      newPlayers[currentPlayerIndex].hand.push(newShoe.pop());
      
      const handValue = calculateHandValue(newPlayers[currentPlayerIndex].hand);
      console.log(`AI ${currentPlayerIndex} hits, new total:`, handValue);
      
      setPlayers(newPlayers);
      setShoe(newShoe);
      
      if (handValue > 21) {
        console.log(`AI ${currentPlayerIndex} BUSTED!`);
        setTimeout(() => {
          moveToNextPlayer(newPlayers, newShoe);
        }, 1000);
      }
      // If not busted, useEffect will trigger again automatically
      
    } else if (decision === 'stand') {
      const newPlayers = [...players];
      if (!newPlayers[currentPlayerIndex].decisions) {
        newPlayers[currentPlayerIndex].decisions = [];
      }
      newPlayers[currentPlayerIndex].decisions.push(aiDecisionRecord);
      setPlayers(newPlayers);
      
      console.log(`AI ${currentPlayerIndex} stands`);
      setTimeout(() => {
        moveToNextPlayer(newPlayers, shoe);
      }, 1000);
      
    } else if (decision === 'double') {
      if (currentPlayer.coins >= 5 && currentPlayer.hand.length === 2) {
        const newShoe = [...shoe];
        const newPlayers = [...players];
        
        if (!newPlayers[currentPlayerIndex].decisions) {
          newPlayers[currentPlayerIndex].decisions = [];
        }
        newPlayers[currentPlayerIndex].decisions.push(aiDecisionRecord);
        
        newPlayers[currentPlayerIndex].coins -= 5;
        newPlayers[currentPlayerIndex].bet += 5;
        newPlayers[currentPlayerIndex].hand.push(newShoe.pop());
        
        console.log(`AI ${currentPlayerIndex} doubles`);
        setPlayers(newPlayers);
        setShoe(newShoe);
        
        setTimeout(() => {
          moveToNextPlayer(newPlayers, newShoe);
        }, 1000);
      } else {
        // Can't double, hit instead
        const newShoe = [...shoe];
        const newPlayers = [...players];
        newPlayers[currentPlayerIndex].hand.push(newShoe.pop());
        setPlayers(newPlayers);
        setShoe(newShoe);
      }
      
    } else if (decision === 'split') {
      if (currentPlayer.coins >= 5 && currentPlayer.hand.length === 2 && 
          currentPlayer.hand[0].value === currentPlayer.hand[1].value && !currentPlayer.splitHand) {
        const newShoe = [...shoe];
        const newPlayers = [...players];
        
        if (!newPlayers[currentPlayerIndex].decisions) {
          newPlayers[currentPlayerIndex].decisions = [];
        }
        newPlayers[currentPlayerIndex].decisions.push(aiDecisionRecord);
        
        newPlayers[currentPlayerIndex].coins -= 5;
        
        const card1 = currentPlayer.hand[0];
        const card2 = currentPlayer.hand[1];
        newPlayers[currentPlayerIndex].hand = [card1, newShoe.pop()];
        newPlayers[currentPlayerIndex].splitHand = [card2, newShoe.pop()];
        newPlayers[currentPlayerIndex].playingSplit = false;
        
        console.log(`AI ${currentPlayerIndex} splits`);
        setPlayers(newPlayers);
        setShoe(newShoe);
      } else {
        // Can't split, hit instead
        const newShoe = [...shoe];
        const newPlayers = [...players];
        newPlayers[currentPlayerIndex].hand.push(newShoe.pop());
        setPlayers(newPlayers);
        setShoe(newShoe);
      }
    }
  };
  
  // Update players when number of AI players changes
  useEffect(() => {
    if (gamePhase === 'setup') {
      // Load saved coins if available - use different key per game mode
      const coinKey = gameMode === 'switch' ? 'blackjackSwitchPlayerCoins' : 'blackjackPlayerCoins';
      const savedCoins = localStorage.getItem(coinKey);
      let coinsByPlayerId = {};
      
      if (savedCoins) {
        try {
          const coinsData = JSON.parse(savedCoins);
          const now = Date.now();
          
          // Check if data is still valid (within 24 hours)
          if (coinsData.timestamp && (now - coinsData.timestamp < 24 * 60 * 60 * 1000)) {
            coinsByPlayerId = coinsData.coins;
          }
        } catch (e) {
          console.error('Error loading saved coins:', e);
        }
      }
      
      const newPlayers = [
        { 
          id: 1, 
          type: 'human', 
          name: 'Human Player', 
          coins: coinsByPlayerId[1] !== undefined ? coinsByPlayerId[1] : (gameMode === 'switch' ? 500 : 200), 
          hand: [], 
          bet: 0, 
          locked: false 
        }
      ];
      
      // Add AI players based on selection (2-4)
      for (let i = 0; i < numAIPlayers; i++) {
        const playerId = i + 2;
        newPlayers.push({
          id: playerId,
          type: 'ai',
          name: `AI ${i + 1}`,
          coins: coinsByPlayerId[playerId] !== undefined ? coinsByPlayerId[playerId] : (gameMode === 'switch' ? 500 : 200),
          hand: [],
          splitHand: null,
          numSplits: 0,
          bet: 0,
          locked: false
        });
      }
      
      setPlayers(newPlayers);
    }
  }, [numAIPlayers, gamePhase, gameMode]);
  
  // Load saved coins on mount
  useEffect(() => {
    const savedCoins = localStorage.getItem('blackjackPlayerCoins');
    if (savedCoins) {
      try {
        const coinsData = JSON.parse(savedCoins);
        const now = Date.now();
        
        // Check if data is still valid (within 24 hours)
        if (coinsData.timestamp && (now - coinsData.timestamp < 24 * 60 * 60 * 1000)) {
          setPlayers(prevPlayers => 
            prevPlayers.map(player => ({
              ...player,
              coins: coinsData.coins[player.id] !== undefined ? coinsData.coins[player.id] : 100
            }))
          );
        } else {
          // Data expired, remove it
          localStorage.removeItem(coinKey);
        }
      } catch (e) {
        console.error('Error loading saved coins:', e);
      }
    }
  }, []);
  
  // Save coins whenever players change - use different key per game mode
  useEffect(() => {
    if (players.length > 0 && gamePhase !== 'setup' && gameMode) {
      const coinKey = gameMode === 'switch' ? 'blackjackSwitchPlayerCoins' : 'blackjackPlayerCoins';
      const coinsData = {
        timestamp: Date.now(),
        coins: {}
      };
      
      players.forEach(player => {
        coinsData.coins[player.id] = player.coins;
      });
      
      localStorage.setItem(coinKey, JSON.stringify(coinsData));
    }
  }, [players, gamePhase, gameMode]);
  
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
  
  const showTerms = () => {
    setShowTermsModal(true);
  };
  
  const closeTermsModal = () => {
    setShowTermsModal(false);
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
    
    // Place cut card at 50% through shoe (shuffle when under 50% remains)
    const cutPosition = Math.floor(newShoe.length * 0.5);
    setCutCardPosition(cutPosition);
    
    return newShoe;
  };
  
  const resetGameState = () => {
    // Reset all game state
    setDealer({ hand: [], showAll: false });
    setShoe([]);
    setCurrentPlayerIndex(0);
    setGameHistory(null);
    setShowReplay(false);
    
    // Reset player hands and bets (keep coins)
    setPlayers(prevPlayers => prevPlayers.map(player => ({
      ...player,
      hand: [],
      splitHand: null,
      playingSplit: false,
      numSplits: 0,
      bet: 0,
      decisions: []
    })));
  };
  
  const startGame = () => {
    resetGameState();
    const newShoe = initializeShoe(numDecks);
    setShoe(newShoe);
    setGamePhase('betting');
  };
  
  const placeBets = () => {
    const betAmount = gameMode === 'switch' ? 10 : 5;
    const updatedPlayers = players.map(player => {
      if (!player.locked && player.coins >= betAmount) {
        return { ...player, bet: betAmount, coins: player.coins - betAmount, superMatchBet: 0 };
      }
      return player;
    });
    setPlayers(updatedPlayers);
    
    // In Switch mode, go to Super Match betting phase
    if (gameMode === 'switch') {
      setGamePhase('superMatch');
      setCurrentPlayerIndex(0);
    } else {
      dealInitialCards(updatedPlayers);
    }
  };
  
  // Super Match betting functions
  const placeSuperMatchBet = () => {
    setPlayers(prevPlayers => {
      const updated = [...prevPlayers];
      const player = updated[currentPlayerIndex];
      
      if (player.coins >= 5) {
        player.coins -= 5;
        player.superMatchBet = 5;
      }
      
      return updated;
    });
    
    moveToNextPlayerSuperMatch();
  };
  
  const skipSuperMatchBet = () => {
    // Don't place Super Match bet, just move on
    moveToNextPlayerSuperMatch();
  };
  
  const moveToNextPlayerSuperMatch = () => {
    const nextPlayerIndex = currentPlayerIndex + 1;
    
    // Find next non-locked player
    let nextIndex = nextPlayerIndex;
    while (nextIndex < players.length && players[nextIndex].locked) {
      nextIndex++;
    }
    
    if (nextIndex >= players.length) {
      // All players decided on Super Match, deal cards
      setCurrentPlayerIndex(0);
      dealInitialCards(players);
    } else {
      // Next player makes Super Match decision
      setCurrentPlayerIndex(nextIndex);
    }
  };
  
  // Calculate Super Match winnings based on 4 cards
  const calculateSuperMatchWinnings = (cards) => {
    if (!cards || cards.length !== 4) return 0;
    
    // For Super Match, use FACE values (A, 2, 3, ..., J, Q, K)
    // NOT blackjack values where J, Q, K all = 10
    const valueCounts = {};
    cards.forEach(card => {
      const faceValue = card.display; // Use display (face value) instead of value
      valueCounts[faceValue] = (valueCounts[faceValue] || 0) + 1;
    });
    
    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    
    // Four of a kind: 50:1
    if (counts[0] === 4) return 50;
    
    // Three of a kind: 5:1
    if (counts[0] === 3) return 5;
    
    // Two pairs: 7:1
    if (counts[0] === 2 && counts[1] === 2) return 7;
    
    // One pair: 1:1
    if (counts[0] === 2) return 1;
    
    // No match
    return 0;
  };

  
  const dealInitialCards = (currentPlayers) => {
    let currentShoe = [...shoe];
    
    // Check if we need to reshuffle BEFORE dealing
    if (currentShoe.length <= cutCardPosition) {
      setShowShuffleAnimation(true);
      
      setTimeout(() => {
        // Reshuffle the deck
        const newShoe = initializeShoe(numDecks);
        
        // Now deal from the new shoe
        // In Switch mode, each player gets TWO hands (4 cards total)
        const updatedPlayers = currentPlayers.map(player => {
          if (gameMode === 'switch') {
            const hand = player.locked ? [] : [newShoe.pop(), newShoe.pop()];
            const splitHand = player.locked ? null : [newShoe.pop(), newShoe.pop()];
            
            // Process Super Match winnings if bet was placed
            let superMatchWinnings = 0;
            if (player.superMatchBet > 0 && hand.length === 2 && splitHand && splitHand.length === 2) {
              const allFourCards = [...hand, ...splitHand];
              const multiplier = calculateSuperMatchWinnings(allFourCards);
              if (multiplier > 0) {
                superMatchWinnings = player.superMatchBet + (player.superMatchBet * multiplier);
                console.log(`${player.name} Super Match WIN! Multiplier: ${multiplier}:1, Winnings: ${superMatchWinnings}`);
              } else {
                console.log(`${player.name} Super Match LOSE`);
              }
            }
            
            return {
              ...player,
              hand,
              splitHand,
              playingSplit: false,
              numSplits: 0,
              decisions: [],
              coins: player.coins + superMatchWinnings,
              superMatchResult: superMatchWinnings > 0 ? `WIN ${superMatchWinnings}` : (player.superMatchBet > 0 ? 'LOSE' : null)
            };
          } else {
            return {
              ...player,
              hand: player.locked ? [] : [newShoe.pop(), newShoe.pop()],
              splitHand: null,
              playingSplit: false,
              numSplits: 0,
              decisions: []
            };
          }
        });
        
        const dealerHand = [newShoe.pop(), newShoe.pop()];
        
        setPlayers(updatedPlayers);
        setDealer({ hand: dealerHand, showAll: false });
        setShoe(newShoe);
        setCurrentPlayerIndex(0);
        
        // In Switch mode, go to switch phase first
        if (gameMode === 'switch') {
          setGamePhase('switch');
        } else {
          setGamePhase('playing');
        }
        setShowShuffleAnimation(false);
      }, 3000); // Wait for animation
      
      return; // Exit - will deal after reshuffle
    }
    
    // Normal dealing (no reshuffle needed)
    // In Switch mode, each player gets TWO hands (4 cards total)
    const updatedPlayers = currentPlayers.map(player => {
      if (gameMode === 'switch') {
        const hand = player.locked ? [] : [currentShoe.pop(), currentShoe.pop()];
        const splitHand = player.locked ? null : [currentShoe.pop(), currentShoe.pop()];
        
        // Process Super Match winnings if bet was placed
        let superMatchWinnings = 0;
        if (player.superMatchBet > 0 && hand.length === 2 && splitHand && splitHand.length === 2) {
          const allFourCards = [...hand, ...splitHand];
          const multiplier = calculateSuperMatchWinnings(allFourCards);
          if (multiplier > 0) {
            superMatchWinnings = player.superMatchBet + (player.superMatchBet * multiplier);
            console.log(`${player.name} Super Match WIN! Multiplier: ${multiplier}:1, Winnings: ${superMatchWinnings}`);
          } else {
            console.log(`${player.name} Super Match LOSE`);
          }
        }
        
        return {
          ...player,
          hand,
          splitHand,
          playingSplit: false,
          numSplits: 0,
          decisions: [],
          coins: player.coins + superMatchWinnings,
          superMatchResult: superMatchWinnings > 0 ? `WIN ${superMatchWinnings}` : (player.superMatchBet > 0 ? 'LOSE' : null)
        };
      } else {
        return {
          ...player,
          hand: player.locked ? [] : [currentShoe.pop(), currentShoe.pop()],
          splitHand: null,
          playingSplit: false,
          numSplits: 0,
          decisions: []
        };
      }
    });
    
    const dealerHand = [currentShoe.pop(), currentShoe.pop()];
    
    setPlayers(updatedPlayers);
    setDealer({ hand: dealerHand, showAll: false });
    setShoe(currentShoe);
    setCurrentPlayerIndex(0);
    
    // In Switch mode, go to switch phase first
    if (gameMode === 'switch') {
      setGamePhase('switch');
    } else {
      setGamePhase('playing');
    }
  };
  
  // Switch mode - swap 2nd cards between two hands
  const executeSwitch = () => {
    setPlayers(prevPlayers => {
      const updated = [...prevPlayers];
      const player = updated[currentPlayerIndex];
      
      if (player.hand && player.splitHand && player.hand.length >= 2 && player.splitHand.length >= 2) {
        // Swap the 2nd cards (index 1) between the two hands
        const hand1Card2 = player.hand[1];
        const hand2Card2 = player.splitHand[1];
        
        player.hand = [player.hand[0], hand2Card2];
        player.splitHand = [player.splitHand[0], hand1Card2];
      }
      
      return updated;
    });
    
    // Move to next player's switch decision or start playing
    moveToNextPlayerSwitch();
  };
  
  const keepHands = () => {
    // Keep hands as dealt, move to next player
    moveToNextPlayerSwitch();
  };
  
  const moveToNextPlayerSwitch = () => {
    const nextPlayerIndex = currentPlayerIndex + 1;
    
    // Find next non-locked player
    let nextIndex = nextPlayerIndex;
    while (nextIndex < players.length && players[nextIndex].locked) {
      nextIndex++;
    }
    
    if (nextIndex >= players.length) {
      // All players decided, start playing
      setCurrentPlayerIndex(0);
      setGamePhase('playing');
    } else {
      // Next player makes switch decision
      setCurrentPlayerIndex(nextIndex);
    }
  };

  
  const playerAction = (action) => {
    const player = players[currentPlayerIndex];
    if (!player || player.type === 'ai' || player.locked) return;
    
    let currentShoe = [...shoe];
    let updatedPlayers = [...players];
    
    // Determine which hand we're playing
    const playingSplitHand = player.splitHand && player.playingSplit;
    const activeHand = playingSplitHand ? 'splitHand' : 'hand';
    
    // Track decision with probabilities
    const handToUse = playingSplitHand ? player.splitHand : player.hand;
    const dealerUpCard = dealer.hand[0];
    const decision = {
      action: action.toUpperCase(),
      hand: [...handToUse],
      handValue: calculateHandValue(handToUse),
      dealerCard: dealerUpCard,
      probabilities: {
        hit: calculateWinProbability(handToUse, dealerUpCard, 'hit', null),
        stand: calculateWinProbability(handToUse, dealerUpCard, 'stand', null),
        double: handToUse.length === 2 ? calculateWinProbability(handToUse, dealerUpCard, 'double', null) : null,
        split: handToUse.length === 2 && handToUse[0].value === handToUse[1].value ? calculateWinProbability(handToUse, dealerUpCard, 'split', null) : null
      },
      splitHand: playingSplitHand
    };
    
    // Add decision to player's decisions array
    if (!updatedPlayers[currentPlayerIndex].decisions) {
      updatedPlayers[currentPlayerIndex].decisions = [];
    }
    updatedPlayers[currentPlayerIndex].decisions.push(decision);
    
    if (action === 'hit') {
      updatedPlayers[currentPlayerIndex][activeHand].push(currentShoe.pop());
      const handValue = calculateHandValue(updatedPlayers[currentPlayerIndex][activeHand]);
      
      if (handValue > 21) {
        // Busted
        if (playingSplitHand || !player.splitHand) {
          // If second hand busted OR no split, move to next player
          moveToNextPlayer(updatedPlayers, currentShoe);
        } else {
          // First hand busted, switch to second hand
          updatedPlayers[currentPlayerIndex].playingSplit = true;
          setPlayers(updatedPlayers);
          setShoe(currentShoe);
        }
      } else {
        setPlayers(updatedPlayers);
        setShoe(currentShoe);
      }
    } else if (action === 'stand') {
      if (playingSplitHand || !player.splitHand) {
        // If second hand stands OR no split, move to next player
        moveToNextPlayer(updatedPlayers, currentShoe);
      } else {
        // First hand stands, switch to second hand
        updatedPlayers[currentPlayerIndex].playingSplit = true;
        setPlayers(updatedPlayers);
        setShoe(currentShoe);
      }
    } else if (action === 'double') {
      if (player.coins >= 5) {
        updatedPlayers[currentPlayerIndex].coins -= 5;
        
        // Track which hand is being doubled
        if (playingSplitHand) {
          // Doubling second hand
          updatedPlayers[currentPlayerIndex].splitHandBet = (updatedPlayers[currentPlayerIndex].splitHandBet || 5) + 5;
        } else {
          // Doubling first hand
          updatedPlayers[currentPlayerIndex].mainHandBet = (updatedPlayers[currentPlayerIndex].mainHandBet || 5) + 5;
        }
        
        updatedPlayers[currentPlayerIndex].bet += 5; // Keep total bet updated
        updatedPlayers[currentPlayerIndex][activeHand].push(currentShoe.pop());
        
        if (playingSplitHand || !player.splitHand) {
          // If second hand doubles OR no split, move to next player
          moveToNextPlayer(updatedPlayers, currentShoe);
        } else {
          // First hand doubled, switch to second hand
          updatedPlayers[currentPlayerIndex].playingSplit = true;
          setPlayers(updatedPlayers);
          setShoe(currentShoe);
        }
      }
    } else if (action === 'split') {
      console.log('SPLIT clicked! Player:', player);
      console.log('Can split?', player.coins >= 5, player.hand.length === 2, player.hand[0].value === player.hand[1].value, player.numSplits === 0);
      
      // Only allow ONE split (numSplits === 0 means no splits yet)
      if (player.coins >= 5 && 
          player.hand.length === 2 && 
          player.hand[0].value === player.hand[1].value && 
          player.numSplits === 0 &&      // Changed from < 2 to === 0
          !player.splitHand) {            // Ensure no split hand exists
        // Deduct additional bet for split hand
        updatedPlayers[currentPlayerIndex].coins -= 5;
        updatedPlayers[currentPlayerIndex].numSplits = 1; // Set to 1 (one split done)
        
        // Initialize separate bets for each hand (both start at 5)
        updatedPlayers[currentPlayerIndex].mainHandBet = 5;
        updatedPlayers[currentPlayerIndex].splitHandBet = 5;
        
        // Create split hands
        const card1 = player.hand[0];
        const card2 = player.hand[1];
        
        console.log('Splitting:', card1, 'and', card2);
        
        // First hand gets one new card
        updatedPlayers[currentPlayerIndex].hand = [card1, currentShoe.pop()];
        updatedPlayers[currentPlayerIndex].splitHand = [card2, currentShoe.pop()];
        updatedPlayers[currentPlayerIndex].playingSplit = false; // Start with first hand
        
        console.log('After split:');
        console.log('Hand 1:', updatedPlayers[currentPlayerIndex].hand);
        console.log('Hand 2 (split):', updatedPlayers[currentPlayerIndex].splitHand);
        console.log('Playing split?', updatedPlayers[currentPlayerIndex].playingSplit);
        console.log('Total splits:', updatedPlayers[currentPlayerIndex].numSplits);
        
        setPlayers(updatedPlayers);
        setShoe(currentShoe);
      } else {
        console.log('SPLIT conditions not met!');
      }
    }
  };
  
  // AI decision making based on basic blackjack strategy
  const getAIDecision = (hand, dealerUpCard) => {
    const handValue = calculateHandValue(hand);
    const dealerValue = dealerUpCard.value;
    const isPair = hand.length === 2 && hand[0].value === hand[1].value;
    
    // Pair splitting strategy
    if (isPair) {
      const pairValue = hand[0].value;
      if (pairValue === 11 || pairValue === 8) return 'split'; // Always split Aces and 8s
      if (pairValue === 10) return 'stand'; // Never split 10s
      if (pairValue === 9 && dealerValue <= 9 && dealerValue !== 7) return 'split';
      if (pairValue === 7 && dealerValue <= 7) return 'split';
      if (pairValue === 6 && dealerValue <= 6) return 'split';
      if (pairValue === 4 && (dealerValue === 5 || dealerValue === 6)) return 'split';
      if (pairValue === 3 || pairValue === 2) {
        if (dealerValue <= 7) return 'split';
      }
    }
    
    // Soft hands (with Ace counted as 11)
    const hasAce = hand.some(card => card.value === 11);
    if (hasAce && handValue <= 21) {
      if (handValue >= 19) return 'stand';
      if (handValue === 18) {
        if (dealerValue <= 8) return 'stand';
        return 'hit';
      }
      return 'hit'; // Soft 17 or less, always hit
    }
    
    // Hard hands
    if (handValue >= 17) return 'stand';
    if (handValue >= 13 && handValue <= 16) {
      if (dealerValue <= 6) return 'stand';
      return 'hit';
    }
    if (handValue === 12) {
      if (dealerValue >= 4 && dealerValue <= 6) return 'stand';
      return 'hit';
    }
    if (handValue === 11) {
      return hand.length === 2 ? 'double' : 'hit';
    }
    if (handValue === 10) {
      return hand.length === 2 && dealerValue <= 9 ? 'double' : 'hit';
    }
    if (handValue === 9) {
      return hand.length === 2 && dealerValue >= 3 && dealerValue <= 6 ? 'double' : 'hit';
    }
    
    return 'hit'; // Default: hit on anything 8 or less
  };
  
  const moveToNextPlayer = (updatedPlayers, currentShoe) => {
    let nextIndex = currentPlayerIndex + 1;
    
    // Skip locked players only
    while (nextIndex < updatedPlayers.length && updatedPlayers[nextIndex].locked) {
      nextIndex++;
    }
    
    if (nextIndex >= updatedPlayers.length) {
      // All players done, dealer plays
      playDealer(updatedPlayers, currentShoe);
    } else {
      // Just move to next player - useEffect will handle AI automatically
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
      
      let totalWinnings = 0;
      
      console.log(`=== Resolving ${player.name} ===`);
      console.log(`Has split hand: ${!!player.splitHand}`);
      console.log(`Total bet: ${player.bet}`);
      console.log(`Coins before resolution: ${player.coins}`);
      
      // Calculate winnings for main hand
      const playerValue = calculateHandValue(player.hand);
      const playerBusted = playerValue > 21;
      
      // Use actual bet for this hand (mainHandBet for split, otherwise total bet)
      const mainHandBetAmount = player.splitHand ? (player.mainHandBet || 5) : player.bet;
      console.log(`Main hand bet: ${mainHandBetAmount}`);
      
      let mainHandWinnings = 0;
      if (playerBusted) {
        mainHandWinnings = 0; // Lose bet
        console.log(`Main hand BUSTED (${playerValue}). Winnings: 0`);
      } else if (dealerBusted || playerValue > dealerValue) {
        mainHandWinnings = mainHandBetAmount * 2; // Win: return bet + winnings
        console.log(`Main hand WIN (${playerValue} vs ${dealerValue}). Winnings: ${mainHandWinnings}`);
      } else if (playerValue === dealerValue) {
        mainHandWinnings = mainHandBetAmount; // Push: return bet only
        console.log(`Main hand PUSH (${playerValue} vs ${dealerValue}). Winnings: ${mainHandWinnings}`);
      } else {
        console.log(`Main hand LOSE (${playerValue} vs ${dealerValue}). Winnings: 0`);
      }
      
      totalWinnings += mainHandWinnings;
      
      // Calculate winnings for split hand if exists
      if (player.splitHand) {
        const splitValue = calculateHandValue(player.splitHand);
        const splitBusted = splitValue > 21;
        
        // Use actual bet for split hand
        const splitHandBetAmount = player.splitHandBet || 5;
        console.log(`Split hand bet: ${splitHandBetAmount}`);
        
        let splitHandWinnings = 0;
        if (splitBusted) {
          splitHandWinnings = 0; // Lose bet
          console.log(`Split hand BUSTED (${splitValue}). Winnings: 0`);
        } else if (dealerBusted || splitValue > dealerValue) {
          splitHandWinnings = splitHandBetAmount * 2; // Win: return bet + winnings
          console.log(`Split hand WIN (${splitValue} vs ${dealerValue}). Winnings: ${splitHandWinnings}`);
        } else if (splitValue === dealerValue) {
          splitHandWinnings = splitHandBetAmount; // Push: return bet only
          console.log(`Split hand PUSH (${splitValue} vs ${dealerValue}). Winnings: ${splitHandWinnings}`);
        } else {
          console.log(`Split hand LOSE (${splitValue} vs ${dealerValue}). Winnings: 0`);
        }
        
        totalWinnings += splitHandWinnings;
      }
      
      console.log(`Total winnings: ${totalWinnings}`);
      const newCoins = player.coins + totalWinnings;
      console.log(`Coins after resolution: ${newCoins}`);
      console.log(`Net change: ${newCoins - player.coins}`);
      
      
      // Check if player is locked out
      let isLocked = false;
      if (newCoins === 0) {
        const lockTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        const lockKey = gameMode === 'switch' ? 'lockedSwitchPlayers' : 'lockedPlayers';
        const lockedPlayers = JSON.parse(localStorage.getItem(lockKey) || '{}');
        lockedPlayers[player.id] = lockTime;
        localStorage.setItem(lockKey, JSON.stringify(lockedPlayers));
        isLocked = true;
      }
      
      return { ...player, coins: newCoins, locked: isLocked };
    });
    
    setPlayers(updatedPlayers);
    setShoe(currentShoe);
    
    // Check if all AI players are out of coins (exception to 24-hour rule)
    const aiPlayers = updatedPlayers.filter(p => p.type === 'ai');
    const allAIBroke = aiPlayers.length > 0 && aiPlayers.every(p => p.coins === 0);
    
    if (allAIBroke) {
      // Reset ALL players to mode-specific starting coins and clear locks (exception rule)
      const startingCoins = gameMode === 'switch' ? 500 : 200;
      const resetPlayers = updatedPlayers.map(player => ({
        ...player,
        coins: startingCoins,
        locked: false
      }));
      
      setPlayers(resetPlayers);
      
      // Clear locked players from localStorage
      const lockKey = gameMode === 'switch' ? 'lockedSwitchPlayers' : 'lockedPlayers';
      const coinKey = gameMode === 'switch' ? 'blackjackSwitchPlayerCoins' : 'blackjackPlayerCoins';
      localStorage.removeItem(lockKey);
      
      // Clear saved coins so they start fresh
      localStorage.removeItem(coinKey);
      
      // Show message and go back to setup
      alert(`All AI players are out of coins! Resetting everyone to ${startingCoins} coins. Please set up a new game.`);
      resetGameState();
      setGamePhase('setup');
      return; // Exit early, don't save game history
    }
    
    // Save game history for replay
    const history = {
      players: updatedPlayers.map(p => {
        // Calculate initial coins BEFORE this round
        // Current coins already include winnings (or lack thereof)
        // To get coins before bet: if player had bet, they had bet deducted
        // So: initialCoins = currentCoins - winnings + bet
        let initialCoins;
        if (p.bet > 0) {
          // Player participated - calculate what they had before betting
          const playerValue = calculateHandValue(p.hand);
          const playerBusted = playerValue > 21;
          
          if (playerBusted) {
            // Lost - had no winnings
            initialCoins = p.coins + p.bet; // Add back the bet they lost
          } else if (dealerBusted || playerValue > dealerValue) {
            // Won - got bet * 2
            initialCoins = p.coins - (p.bet * 2) + p.bet; // Remove winnings, add back bet = p.coins - p.bet
          } else if (playerValue === dealerValue) {
            // Push - got bet back
            initialCoins = p.coins; // Same as before (bet was returned)
          } else {
            // Lost - had no winnings  
            initialCoins = p.coins + p.bet; // Add back the bet they lost
          }
        } else {
          initialCoins = p.coins; // Didn't play
        }
        
        return {
          name: p.name,
          type: p.type,
          initialCoins: initialCoins,
          bet: p.bet,
          hand: p.hand,
          splitHand: p.splitHand,
          handValue: calculateHandValue(p.hand),
          splitHandValue: p.splitHand ? calculateHandValue(p.splitHand) : null,
          busted: calculateHandValue(p.hand) > 21,
          finalCoins: p.coins,
          result: p.coins > initialCoins ? 'WIN' : 
                  p.coins === initialCoins ? 'PUSH' : 'LOSE',
          decisions: p.decisions || []
        };
      }),
      dealer: {
        hand: dealerHand,
        value: dealerValue,
        busted: dealerBusted
      },
      timestamp: new Date().toLocaleString()
    };
    
    setGameHistory(history);
    setGamePhase('result');
  };
  
  const nextRound = () => {
    // Check if all AI players are out of coins (exception to 24-hour rule)
    const aiPlayers = players.filter(p => p.type === 'ai');
    const allAIBroke = aiPlayers.length > 0 && aiPlayers.every(p => p.coins === 0);
    
    if (allAIBroke) {
      // Reset ALL players to mode-specific starting coins and clear locks (exception rule)
      const startingCoins = gameMode === 'switch' ? 500 : 200;
      const resetPlayers = players.map(player => ({
        ...player,
        coins: startingCoins,
        locked: false,
        hand: [],
        splitHand: null,
        playingSplit: false,
        numSplits: 0,
        bet: 0,
        decisions: []
      }));
      
      setPlayers(resetPlayers);
      
      // Clear locked players from localStorage
      const lockKey = gameMode === 'switch' ? 'lockedSwitchPlayers' : 'lockedPlayers';
      const coinKey = gameMode === 'switch' ? 'blackjackSwitchPlayerCoins' : 'blackjackPlayerCoins';
      localStorage.removeItem(lockKey);
      
      // Clear saved coins so they start fresh
      localStorage.removeItem(coinKey);
      
      // Show message and go back to setup
      alert(`All AI players are out of coins! Everyone has been reset to ${startingCoins} coins. Please set up a new game.`);
      resetGameState();
      setGamePhase('setup');
      return;
    }
    
    if (shoe.length <= cutCardPosition) {
      // Reshuffle
      const newShoe = initializeShoe(numDecks);
      setShoe(newShoe);
    }
    
    const resetPlayers = players.map(player => ({
      ...player,
      hand: [],
      splitHand: null,      // Reset split hand
      playingSplit: false,  // Reset split flag
      numSplits: 0,         // Reset split counter
      bet: 0
    }));
    
    setPlayers(resetPlayers);
    setDealer({ hand: [], showAll: false });
    setGamePhase('betting');
  };
  
  const nextRoundAndBet = () => {
    // Check if all AI players are out of coins (exception to 24-hour rule)
    const aiPlayers = players.filter(p => p.type === 'ai');
    const allAIBroke = aiPlayers.length > 0 && aiPlayers.every(p => p.coins === 0);
    
    if (allAIBroke) {
      // Reset ALL players to mode-specific starting coins and clear locks (exception rule)
      const startingCoins = gameMode === 'switch' ? 500 : 200;
      const resetPlayers = players.map(player => ({
        ...player,
        coins: startingCoins,
        locked: false,
        hand: [],
        splitHand: null,
        playingSplit: false,
        numSplits: 0,
        bet: 0,
        decisions: []
      }));
      
      setPlayers(resetPlayers);
      
      // Clear locked players from localStorage
      const lockKey = gameMode === 'switch' ? 'lockedSwitchPlayers' : 'lockedPlayers';
      const coinKey = gameMode === 'switch' ? 'blackjackSwitchPlayerCoins' : 'blackjackPlayerCoins';
      localStorage.removeItem(lockKey);
      
      // Clear saved coins so they start fresh
      localStorage.removeItem(coinKey);
      
      // Show message and go back to setup
      alert(`All AI players are out of coins! Everyone has been reset to ${startingCoins} coins. Please set up a new game.`);
      resetGameState();
      setGamePhase('setup');
      return;
    }
    
    if (shoe.length <= cutCardPosition) {
      // Reshuffle
      const newShoe = initializeShoe(numDecks);
      setShoe(newShoe);
    }
    
    // Reset players and place bets immediately
    const betAmount = gameMode === 'switch' ? 10 : 5;
    const resetPlayers = players.map(player => {
      if (!player.locked && player.coins >= betAmount) {
        return {
          ...player,
          hand: [],
          splitHand: null,
          playingSplit: false,
          numSplits: 0,
          bet: betAmount,
          coins: player.coins - betAmount,
          superMatchBet: 0  // Reset Super Match bet
        };
      }
      return {
        ...player,
        hand: [],
        splitHand: null,
        playingSplit: false,
        numSplits: 0,
        bet: 0,
        superMatchBet: 0  // Reset Super Match bet
      };
    });
    
    setPlayers(resetPlayers);
    setDealer({ hand: [], showAll: false });
    
    // In Switch mode, go to Super Match phase first
    if (gameMode === 'switch') {
      setGamePhase('superMatch');
      setCurrentPlayerIndex(0);
    } else {
      // Deal cards immediately in Regular mode
      dealInitialCards(resetPlayers);
    }
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
            <h1 className="app-title">Casino Games Statistics</h1>
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
      <>
        {showTermsModal && <TermsModal onClose={closeTermsModal} alreadyAccepted={true} />}
        {showRulesModal && <RulesModal onClose={() => setShowRulesModal(false)} />}
        {showSwitchRulesModal && <SwitchRulesModal onClose={() => setShowSwitchRulesModal(false)} />}
        
        <div className="game-select-screen">
        <div className="header">
          <h1 className="main-title">Casino Games Statistics</h1>
          <a href="https://www.m2eacircle.com/" className="circle-link">
            <Home size={24} />
            <span>m2ea Circle</span>
          </a>
        </div>
        
        <div className="mode-container">
          <h2>Select Game</h2>
          <div className="mode-grid">
            <button 
              className="mode-card"
              onClick={() => setGameMode('regular')}
            >
              <div className="mode-icon">🃏🂠</div>
              <h3>Blackjack Regular</h3>
              <p>Classic blackjack rules</p>
              <a 
                href="#"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowRulesModal(true);
                }}
                style={{
                  marginTop: '10px',
                  fontSize: '0.9rem',
                  color: '#6366f1',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  display: 'inline-block'
                }}
              >
                View Rules
              </a>
            </button>
            
            <button 
              className="mode-card"
              onClick={() => setGameMode('switch')}
            >
              <div className="mode-icon">🃏🂠 🃏🂠</div>
              <h3>Blackjack Switch</h3>
              <p>Switch cards between hands</p>
              <a 
                href="#"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowSwitchRulesModal(true);
                }}
                style={{
                  marginTop: '10px',
                  fontSize: '0.9rem',
                  color: '#6366f1',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  display: 'inline-block'
                }}
              >
                View Rules
              </a>
            </button>
            
            <button 
              className="mode-card"
              onClick={() => setGameMode('baccarat')}
            >
              <div className="mode-icon">🂡</div>
              <h3>Baccarat</h3>
              <p>Bet on Player or Banker</p>
            </button>
          </div>
        </div>
        
        <footer className="footer">
          <a href="https://www.m2ealabs.com/" className="footer-link">© 2025 m2ea Labs. All rights reserved.</a>
          <button onClick={showTerms} className="terms-link">Terms of Use</button>
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
          
          .mode-card.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: #f5f5f5;
          }
          
          .mode-card.disabled:hover {
            transform: none;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
      </>
    );
  }
  
  if (gamePhase === 'setup') {
    // Baccarat coming soon screen
    if (gameMode === 'baccarat') {
      return (
        <>
          {showTermsModal && <TermsModal onClose={closeTermsModal} alreadyAccepted={true} />}
          
          <div className="setup-screen">
            <div className="header">
              <h1 className="main-title">🂡 Baccarat</h1>
              <a href="https://www.m2eacircle.com/" className="circle-link">
                <Home size={24} />
                <span>m2ea Circle</span>
              </a>
            </div>
            
            <div className="setup-container" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '60px 40px',
                borderRadius: '20px',
                marginBottom: '30px'
              }}>
                <div style={{ fontSize: '6rem', marginBottom: '30px' }}>🂡</div>
                <h2 style={{ color: '#ffd700', fontSize: '2.5rem', marginBottom: '20px' }}>
                  Coming Soon!
                </h2>
                <p style={{ color: 'white', fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '30px' }}>
                  Baccarat is currently under development. This classic casino game will feature:
                </p>
                <ul style={{ 
                  color: 'white', 
                  fontSize: '1.1rem', 
                  textAlign: 'left', 
                  maxWidth: '400px', 
                  margin: '0 auto',
                  lineHeight: '2'
                }}>
                  <li>🎯 Player & Banker bets</li>
                  <li>🎲 Tie bet option</li>
                  <li>💰 Classic 1:1 and 8:1 payouts</li>
                  <li>📊 Real-time statistics</li>
                  <li>🤖 AI opponents</li>
                </ul>
              </div>
              
              <button 
                className="back-btn" 
                onClick={() => {
                  resetGameState();
                  setGameMode(null);
                }}
                style={{ width: '100%', maxWidth: '400px' }}
              >
                ← Back to Game Selection
              </button>
            </div>
            
            <footer className="footer">
              <a href="https://www.m2ealabs.com/" className="footer-link">© 2025 m2ea Labs. All rights reserved.</a>
              <button onClick={showTerms} className="terms-link">Terms of Use</button>
            </footer>
          </div>
        </>
      );
    }
    
    return (
      <>
        {showTermsModal && <TermsModal onClose={closeTermsModal} alreadyAccepted={true} />}
        
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
            <h3>Number of AI Players</h3>
            <div className="deck-selector">
              {[2, 3, 4].map(num => (
                <button
                  key={num}
                  className={`deck-btn ${numAIPlayers === num ? 'active' : ''}`}
                  onClick={() => setNumAIPlayers(num)}
                >
                  {num} AI Players
                </button>
              ))}
            </div>
          </div>
          
          <div className="setup-section">
            <h3>Players ({players.length} total)</h3>
            <div className="players-list">
              {players.map((player, index) => (
                <div key={player.id} className="player-row">
                  <button 
                    className="type-toggle"
                    style={{ cursor: 'default' }}
                  >
                    {player.type === 'human' ? '👤' : '🤖'}
                  </button>
                  
                  <span className={player.type === 'human' ? 'human-name' : 'ai-name'}>
                    {player.name}
                  </span>
                  
                  <span className="coins-display">{player.coins} 🪙</span>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className="start-btn" 
            onClick={startGame}
            disabled={players[0]?.coins === 0}
            style={{
              opacity: players[0]?.coins === 0 ? 0.5 : 1,
              cursor: players[0]?.coins === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {players[0]?.coins === 0 ? '⏳ Wait for 24 hours' : 'Start Game'}
          </button>
          
          <button className="back-btn" onClick={() => {
            resetGameState();
            setGameMode(null);
          }}>
            ← Back to Mode Selection
          </button>
        </div>
        
        <footer className="footer">
          <a href="https://www.m2ealabs.com/" className="footer-link">© 2025 m2ea Labs. All rights reserved.</a>
          <button onClick={showTerms} className="terms-link">Terms of Use</button>
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
          
          .human-name {
            flex: 1;
            font-size: 1.1rem;
            color: #1e3c72;
            font-weight: bold;
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
      </>
    );
  }
  
  // Game screen
  const currentPlayer = players[currentPlayerIndex];
  const activeHand = currentPlayer && currentPlayer.splitHand && currentPlayer.playingSplit 
    ? currentPlayer.splitHand 
    : (currentPlayer ? currentPlayer.hand : []);
  const canHit = gamePhase === 'playing' && currentPlayer && currentPlayer.type === 'human' && !currentPlayer.locked;
  const canDouble = canHit && activeHand.length === 2 && currentPlayer.coins >= 5;
  // Split rules:
  // 1. Only in Regular mode (not Switch)
  // 2. Only if no splits have been done yet (numSplits === 0)
  // 3. Only on the ACTIVE hand (not already split)
  // 4. Only if active hand has exactly 2 cards (first action)
  // 5. Only if both cards have same value
  // 6. Only if player has coins
  const canSplit = canHit && 
                   gameMode !== 'switch' && 
                   currentPlayer.numSplits === 0 &&  // Changed from < 2 to === 0
                   !currentPlayer.splitHand &&        // No split yet
                   activeHand.length === 2 &&         // First action on this hand
                   currentPlayer.hand.length === 2 && // Main hand has 2 cards
                   currentPlayer.hand[0].value === currentPlayer.hand[1].value && 
                   currentPlayer.coins >= 5;
  
  return (
    <>
      {showTermsModal && <TermsModal onClose={closeTermsModal} alreadyAccepted={true} />}
      {showReplay && <ReplayModal onClose={() => setShowReplay(false)} gameHistory={gameHistory} />}
      
      {/* Shuffle Animation Overlay */}
      {showShuffleAnimation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '30px',
            animation: 'shuffleCards 1s ease-in-out infinite'
          }}>
            🃏
          </div>
          <div style={{
            color: '#fbbf24',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '15px',
            textAlign: 'center',
            textShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
          }}>
            Cut Card Reached!
          </div>
          <div style={{
            color: 'white',
            fontSize: '1.5rem',
            textAlign: 'center',
            opacity: 0.9
          }}>
            Reshuffling after this hand...
          </div>
          <div style={{
            marginTop: '40px',
            display: 'flex',
            gap: '15px'
          }}>
            <div style={{ fontSize: '3rem', animation: 'float 1.5s ease-in-out infinite', animationDelay: '0s' }}>🂠</div>
            <div style={{ fontSize: '3rem', animation: 'float 1.5s ease-in-out infinite', animationDelay: '0.2s' }}>🂡</div>
            <div style={{ fontSize: '3rem', animation: 'float 1.5s ease-in-out infinite', animationDelay: '0.4s' }}>🂢</div>
            <div style={{ fontSize: '3rem', animation: 'float 1.5s ease-in-out infinite', animationDelay: '0.6s' }}>🂣</div>
          </div>
        </div>
      )}
      
      <div className="game-screen">
      <div className="game-header">
        <div className="title-section">
          <h1>Casino Games Statistics</h1>
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
                <div className="player-stats" style={{ flexWrap: 'wrap' }}>
                  <span>🪙 {player.coins}</span>
                  {/* Show Super Match bet FIRST if exists */}
                  {gameMode === 'switch' && player.superMatchBet > 0 && (
                    <span className="bet-amount" style={{ background: '#ffd700', color: '#000', order: -1, width: '100%' }}>
                      💎 Super Match: {player.superMatchBet}
                    </span>
                  )}
                  {player.bet > 0 && (
                    <span className="bet-amount">
                      {player.splitHand ? (
                        // Show actual bet amounts for each hand
                        <>Bet: {player.mainHandBet || 5} (H1) + {player.splitHandBet || 5} (H2)</>
                      ) : (
                        <>Bet: {player.bet}</>
                      )}
                    </span>
                  )}
                  {/* Show WIN/LOSE/PUSH badge during result phase */}
                  {gamePhase === 'result' && player.bet > 0 && (() => {
                    const dealerValue = calculateHandValue(dealer.hand);
                    const dealerBusted = dealerValue > 21;
                    
                    // Calculate actual winnings for each hand
                    const calculateHandWinnings = (hand, isMainHand) => {
                      const handValue = calculateHandValue(hand);
                      const handBusted = handValue > 21;
                      
                      // Use actual bet for each hand
                      let betAmount;
                      if (player.splitHand) {
                        // Split hands: use tracked bet for each hand
                        betAmount = isMainHand ? (player.mainHandBet || 5) : (player.splitHandBet || 5);
                      } else {
                        // No split: use total bet
                        betAmount = player.bet;
                      }
                      
                      if (handBusted) {
                        return { result: 'LOSE', coins: 0 };
                      } else if (dealerBusted || handValue > dealerValue) {
                        return { result: 'WIN', coins: betAmount };
                      } else if (handValue === dealerValue) {
                        return { result: 'PUSH', coins: 0 };
                      } else {
                        return { result: 'LOSE', coins: 0 };
                      }
                    };
                    
                    // Function to render badge with coins
                    const renderBadge = (result, coins, label) => (
                      <span style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        background: result === 'WIN' ? '#10b981' : 
                                   result === 'LOSE' ? '#ef4444' : '#fbbf24',
                        color: 'white',
                        display: 'inline-block',
                        minWidth: 'fit-content',
                        textAlign: 'center'
                      }}>
                        {label && <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>{label}: </span>}
                        {result === 'WIN' ? `🎉 WIN +${coins}` : 
                         result === 'LOSE' ? `💔 LOSE` : `🤝 PUSH`}
                      </span>
                    );
                    
                    // Check if player has split hand
                    if (player.splitHand) {
                      const hand1 = calculateHandWinnings(player.hand, true);  // true = main hand
                      const hand2 = calculateHandWinnings(player.splitHand, false);  // false = split hand
                      
                      return (
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '6px', 
                          marginTop: '8px', 
                          width: '100%',
                          justifyContent: 'flex-start',
                          alignItems: 'center'
                        }}>
                          {/* Show Super Match result FIRST if exists */}
                          {gameMode === 'switch' && player.superMatchResult && (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              background: player.superMatchResult.startsWith('WIN') ? '#ffd700' : '#666',
                              color: player.superMatchResult.startsWith('WIN') ? '#000' : '#fff',
                              display: 'inline-block',
                              width: '100%',
                              textAlign: 'center'
                            }}>
                              💎 {player.superMatchResult}
                            </span>
                          )}
                          {renderBadge(hand1.result, hand1.coins, 'H1')}
                          {renderBadge(hand2.result, hand2.coins, 'H2')}
                        </div>
                      );
                    } else {
                      // Single hand
                      const hand = calculateHandWinnings(player.hand, true);  // true = main hand
                      return (
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '6px', 
                          marginTop: '8px', 
                          width: '100%',
                          justifyContent: 'flex-start',
                          alignItems: 'center'
                        }}>
                          {/* Show Super Match result FIRST if exists */}
                          {gameMode === 'switch' && player.superMatchResult && (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              background: player.superMatchResult.startsWith('WIN') ? '#ffd700' : '#666',
                              color: player.superMatchResult.startsWith('WIN') ? '#000' : '#fff',
                              display: 'inline-block',
                              width: '100%',
                              textAlign: 'center'
                            }}>
                              💎 {player.superMatchResult}
                            </span>
                          )}
                          {renderBadge(hand.result, hand.coins, null)}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
              
              {player.locked ? (
                <div className="locked-message">
                  🔒 Out of coins. Try again in 24 hours.
                </div>
              ) : (
                <>
                  {/* Show AI decision and statistics when it's AI's turn */}
                  {player.type === 'ai' && idx === currentPlayerIndex && gamePhase === 'playing' && player.hand.length > 0 && dealer.hand.length > 0 && (
                    <div className="ai-thinking">
                      <div className="ai-label">🤖 AI Thinking...</div>
                      <div className="ai-stats">
                        <div className="stat-item">
                          <span className="stat-label">HIT:</span>
                          <span className="stat-value">{calculateWinProbability(player.hand, dealer.hand[0], 'hit', null)}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">STAND:</span>
                          <span className="stat-value">{calculateWinProbability(player.hand, dealer.hand[0], 'stand', null)}%</span>
                        </div>
                        {player.hand.length === 2 && player.coins >= 5 && (
                          <div className="stat-item">
                            <span className="stat-label">DOUBLE:</span>
                            <span className="stat-value">{calculateWinProbability(player.hand, dealer.hand[0], 'double', null)}%</span>
                          </div>
                        )}
                        {player.hand.length === 2 && player.hand[0].value === player.hand[1].value && player.coins >= 5 && (
                          <div className="stat-item">
                            <span className="stat-label">SPLIT:</span>
                            <span className="stat-value">{calculateWinProbability(player.hand, dealer.hand[0], 'split', null)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Show which hand is being played when split */}
                  {player.splitHand && (
                    <div style={{ color: '#fbbf24', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                      Playing Hand {player.playingSplit ? '2' : '1'} of 2
                    </div>
                  )}
                  
                  {/* Card display - show both hands if split */}
                  <div className="hand-display">
                    {/* First hand */}
                    {player.hand.map((card, cardIdx) => (
                      <div key={`hand1-${cardIdx}`} className={`card ${player.playingSplit && player.splitHand ? 'dimmed' : ''}`}>
                        <span className={`card-suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                          {card.suit}
                        </span>
                        <span className="card-value">{card.display}</span>
                      </div>
                    ))}
                    
                    {/* Divider between split hands */}
                    {player.splitHand && (
                      <div style={{ 
                        width: '3px', 
                        background: 'rgba(251, 191, 36, 0.5)', 
                        margin: '0 10px',
                        height: '112px',
                        borderRadius: '2px'
                      }} />
                    )}
                    
                    {/* Second hand (split hand) */}
                    {player.splitHand && player.splitHand.map((card, cardIdx) => (
                      <div key={`hand2-${cardIdx}`} className={`card ${!player.playingSplit ? 'dimmed' : ''}`}>
                        <span className={`card-suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                          {card.suit}
                        </span>
                        <span className="card-value">{card.display}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Hand values */}
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
                </>
              )}
              
              {/* Action Buttons - Only show for human player during their turn */}
              {player.type === 'human' && idx === currentPlayerIndex && gamePhase === 'playing' && !player.locked && canHit && (
                <div className="action-grid" style={{ marginTop: '15px' }}>
                  <button 
                    className="action-btn" 
                    onClick={() => playerAction('hit')}
                  >
                    <div className="btn-content">
                      <span>HIT</span>
                      <span className="win-prob">
                        {calculateWinProbability(activeHand, dealer.hand[0], 'hit', null)}%
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
                        {calculateWinProbability(activeHand, dealer.hand[0], 'stand', null)}%
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
                          {calculateWinProbability(activeHand, dealer.hand[0], 'double', null)}%
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
                          {calculateWinProbability(activeHand, dealer.hand[0], 'split', null)}%
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )}
              
              {/* Betting Phase - Show for human player */}
              {player.type === 'human' && gamePhase === 'betting' && (
                <div style={{ marginTop: '15px' }}>
                  <button className="action-btn primary" onClick={placeBets} style={{ width: '100%' }}>
                    Place Bets ({gameMode === 'switch' ? '10' : '5'} coins)
                  </button>
                </div>
              )}
              
              {/* Switch Phase - Show for human player when it's their turn */}
              {player.type === 'human' && idx === currentPlayerIndex && gamePhase === 'switch' && (
                <div className="switch-section" style={{ marginTop: '15px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '10px', color: '#ffd700' }}>
                    Switch Cards?
                  </h4>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '15px',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Current</div>
                      <div>H1: {player.hand?.map(c => c.display).join(' ')}</div>
                      <div style={{ marginTop: '3px' }}>
                        Total: {calculateHandValue(player.hand || [])}
                      </div>
                      <div style={{ marginTop: '8px' }}>H2: {player.splitHand?.map(c => c.display).join(' ')}</div>
                      <div style={{ marginTop: '3px' }}>
                        Total: {calculateHandValue(player.splitHand || [])}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem' }}>⇄</div>
                    
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>After Switch</div>
                      <div>H1: {player.hand?.[0]?.display} {player.splitHand?.[1]?.display}</div>
                      <div style={{ marginTop: '3px' }}>
                        Total: {player.hand && player.splitHand ? 
                          calculateHandValue([player.hand[0], player.splitHand[1]]) : 0}
                      </div>
                      <div style={{ marginTop: '8px' }}>H2: {player.splitHand?.[0]?.display} {player.hand?.[1]?.display}</div>
                      <div style={{ marginTop: '3px' }}>
                        Total: {player.hand && player.splitHand ?
                          calculateHandValue([player.splitHand[0], player.hand[1]]) : 0}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="action-btn primary"
                      onClick={executeSwitch}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                        color: '#000',
                        fontWeight: 'bold'
                      }}
                    >
                      Switch Cards
                    </button>
                    <button 
                      className="action-btn"
                      onClick={keepHands}
                      style={{ flex: 1 }}
                    >
                      Keep As Dealt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Global Action Buttons (Super Match for all players, Result buttons) */}
        <div className="actions-section">
          {gamePhase === 'betting' && (
            <div style={{ display: 'none' }}></div>
          )}
          
          {gamePhase === 'superMatch' && (
            <div className="super-match-section" style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '15px', color: '#fff', fontSize: '1.8rem' }}>
                💎 Super Match Side Bet
              </h3>
              <p style={{ color: '#ffd700', marginBottom: '20px', fontSize: '1.1rem' }}>
                {players[currentPlayerIndex]?.name} - Place Super Match bet?
              </p>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '20px',
                borderRadius: '15px',
                marginBottom: '25px',
                maxWidth: '500px',
                margin: '0 auto 25px auto'
              }}>
                <div style={{ color: '#fff', fontSize: '1rem', lineHeight: '2', textAlign: 'left' }}>
                  <div><strong>Bet:</strong> 5 coins</div>
                  <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '10px' }}>
                    <strong>Payouts:</strong>
                  </div>
                  <div style={{ marginLeft: '20px' }}>
                    <div>One pair: 1:1 (+5 coins)</div>
                    <div>Three of a kind: 5:1 (+25 coins)</div>
                    <div>Two pairs: 7:1 (+35 coins)</div>
                    <div>Four of a kind: 50:1 (+250 coins)</div>
                  </div>
                </div>
              </div>
              
              {players[currentPlayerIndex]?.type === 'ai' && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px 30px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '1.1rem',
                  color: '#ffd700'
                }}>
                  🤖 AI Deciding...
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button 
                  className="action-btn primary" 
                  onClick={placeSuperMatchBet}
                  disabled={players[currentPlayerIndex]?.type === 'ai' || players[currentPlayerIndex]?.coins < 5}
                  style={{
                    background: players[currentPlayerIndex]?.type === 'ai' || players[currentPlayerIndex]?.coins < 5
                      ? 'rgba(128,128,128,0.3)' 
                      : 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    color: players[currentPlayerIndex]?.type === 'ai' || players[currentPlayerIndex]?.coins < 5 ? '#666' : '#000',
                    fontSize: '1.2rem',
                    padding: '15px 40px',
                    fontWeight: 'bold',
                    cursor: players[currentPlayerIndex]?.type === 'ai' || players[currentPlayerIndex]?.coins < 5 ? 'not-allowed' : 'pointer',
                    opacity: players[currentPlayerIndex]?.type === 'ai' || players[currentPlayerIndex]?.coins < 5 ? 0.5 : 1
                  }}
                >
                  💎 Bet 5 Coins
                </button>
                <button 
                  className="action-btn" 
                  onClick={skipSuperMatchBet}
                  disabled={players[currentPlayerIndex]?.type === 'ai'}
                  style={{
                    background: players[currentPlayerIndex]?.type === 'ai' 
                      ? 'rgba(128,128,128,0.3)' 
                      : 'rgba(255,255,255,0.2)',
                    fontSize: '1.2rem',
                    padding: '15px 40px',
                    cursor: players[currentPlayerIndex]?.type === 'ai' ? 'not-allowed' : 'pointer',
                    opacity: players[currentPlayerIndex]?.type === 'ai' ? 0.5 : 1,
                    color: players[currentPlayerIndex]?.type === 'ai' ? '#666' : '#fff'
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}
          
          {gamePhase === 'switch' && players[currentPlayerIndex]?.type === 'ai' && (
            <div className="switch-section">
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '15px 30px',
                borderRadius: '10px',
                fontSize: '1.1rem',
                color: '#ffd700',
                textAlign: 'center'
              }}>
                🤖 {players[currentPlayerIndex]?.name} is thinking...
              </div>
            </div>
          )}
          
          {gamePhase === 'dealer' && (
            <div className="status-message">Dealer playing...</div>
          )}
          
          {gamePhase === 'result' && (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button 
                className="action-btn primary" 
                onClick={nextRoundAndBet}
                style={{ flex: '1', minWidth: '250px' }}
              >
                Next Round & Place Bets ({gameMode === 'switch' ? '10' : '5'} coins)
              </button>
              <button 
                className="action-btn" 
                onClick={() => setShowReplay(true)}
                style={{ flex: '1', minWidth: '200px', background: '#6366f1' }}
              >
                📋 Replay Game Log
              </button>
              <button 
                className="action-btn" 
                onClick={() => {
                  resetGameState();
                  setGamePhase('setup');
                }}
                style={{ flex: '1', minWidth: '200px', background: '#ef4444' }}
              >
                ⚙️ Back to Game Setup
              </button>
            </div>
          )}
        </div>
        
        <div className="stats-info">
          <p>💡 Win percentages are statistical estimates based on current cards and basic strategy.</p>
          <p>📊 Actual results may vary as we cannot predict the next card.</p>
        </div>
      </div>
      
      <footer className="footer">
        <a href="https://www.m2ealabs.com/" className="footer-link">© 2025 m2ea Labs. All rights reserved.</a>
        <button onClick={showTerms} className="terms-link">Terms of Use</button>
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
        
        .ai-thinking {
          background: rgba(251, 191, 36, 0.2);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
          border: 2px solid rgba(251, 191, 36, 0.5);
        }
        
        .ai-label {
          color: #fbbf24;
          font-weight: bold;
          font-size: 1rem;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .ai-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .stat-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 8px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .stat-label {
          color: white;
          font-size: 0.85rem;
          font-weight: bold;
        }
        
        .stat-value {
          color: #10b981;
          font-size: 0.9rem;
          font-weight: bold;
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
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes shuffleCards {
          0%, 100% {
            transform: rotate(-10deg) scale(1);
          }
          25% {
            transform: rotate(10deg) scale(1.1);
          }
          50% {
            transform: rotate(-10deg) scale(1);
          }
          75% {
            transform: rotate(10deg) scale(1.1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
      `}</style>
    </div>
    </>
  );
};

export default BlackjackStats;
