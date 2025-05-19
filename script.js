/**
 * Blackjack Game Logic
 * Based on The Venetian Resort Las Vegas Rules
 * Mobile-optimized version
 */

// Game state variables
let deck = [];
let playerHand = [];
let dealerHand = [];
let splitHands = [[], []];
let currentSplitHand = 0;
let isSplit = false;
let playerPoints = 0;
let dealerPoints = 0;
let splitPoints = [0, 0];
let gameActive = false;
let playerBalance = 1000;
let currentBet = 0;
let doubleDownAvailable = false;
let splitAvailable = false;
let insuranceAvailable = false;
let insuranceTaken = false;

// DOM elements
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const splitCards1El = document.getElementById('split-cards-1');
const splitCards2El = document.getElementById('split-cards-2');
const dealerPointsEl = document.getElementById('dealer-points');
const playerPointsEl = document.getElementById('player-points');
const splitPoints1El = document.getElementById('split-points-1');
const splitPoints2El = document.getElementById('split-points-2');
const messageEl = document.getElementById('message');
const resultEl = document.getElementById('result');
const balanceEl = document.getElementById('balance');
const betInputEl = document.getElementById('bet');

// Button elements
const newGameBtn = document.getElementById('new-game-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const splitBtn = document.getElementById('split-btn');
const insuranceBtn = document.getElementById('insurance-btn');
const actionButtonsEl = document.getElementById('action-buttons');
const splitHandsContainerEl = document.getElementById('split-hands-container');

// Card suits and ranks
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitSymbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};

// Event listeners
newGameBtn.addEventListener('click', startNewGame);
hitBtn.addEventListener('click', hitCard);
standBtn.addEventListener('click', stand);
doubleBtn.addEventListener('click', doubleDown);
splitBtn.addEventListener('click', splitPair);
insuranceBtn.addEventListener('click', takeInsurance);

// Mobile-specific touch feedback
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.95)';
    });
    button.addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
    });
});

// Update balance display
updateBalance();

// Set initial max bet based on balance
betInputEl.max = playerBalance;

/**
 * Creates a new shuffled deck of cards (6 standard decks combined)
 */
function createDeck() {
    const newDeck = [];
    // Create 6 decks (312 cards)
    for (let d = 0; d < 6; d++) {
        for (const suit of suits) {
            for (const rank of ranks) {
                newDeck.push({ suit, rank });
            }
        }
    }
    return shuffleDeck(newDeck);
}

/**
 * Shuffles the deck using the Fisher-Yates algorithm
 */
function shuffleDeck(deckToShuffle) {
    const shuffledDeck = [...deckToShuffle];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
}

/**
 * Starts a new game
 */
function startNewGame() {
    // Reset game state
    resetGame();
    
    // Get bet amount
    const betAmount = parseInt(betInputEl.value);
    
    // Validate bet amount
    if (isNaN(betAmount) || betAmount < 5 || betAmount > playerBalance) {
        messageEl.textContent = `Please enter a valid bet between $5 and $${playerBalance}`;
        return;
    }
    
    // Set current bet and update balance
    currentBet = betAmount;
    playerBalance -= currentBet;
    updateBalance();
    
    // Create and shuffle deck
    deck = createDeck();
    
    // Deal initial cards with shorter delays for mobile
    dealInitialCards();
    
    // Set game as active
    gameActive = true;
    
    // Show action buttons
    actionButtonsEl.classList.remove('hidden');
    
    // Check for dealer blackjack possibility (if dealer's up card is an Ace)
    if (dealerHand[0].rank === 'A') {
        insuranceAvailable = true;
        insuranceBtn.classList.remove('hidden');
        messageEl.textContent = 'Dealer shows an Ace. Insurance available.';
    } else {
        messageEl.textContent = 'Your turn. Hit or Stand?';
    }
    
    // Check if double down is available (initial hand total is 9, 10, or 11)
    doubleDownAvailable = (playerPoints >= 9 && playerPoints <= 11);
    if (doubleDownAvailable) {
        doubleBtn.classList.remove('hidden');
    } else {
        doubleBtn.classList.add('hidden');
    }
    
    // Check if split is available (two cards of the same rank)
    splitAvailable = (playerHand.length === 2 && getCardValue(playerHand[0]) === getCardValue(playerHand[1]));
    if (splitAvailable && playerBalance >= currentBet) {
        splitBtn.classList.remove('hidden');
    } else {
        splitBtn.classList.add('hidden');
    }
    
    // Check for blackjack
    if (playerPoints === 21) {
        stand(); // Player has blackjack, move to dealer's turn
    }
}

/**
 * Resets the game state
 */
function resetGame() {
    // Clear hands and points
    playerHand = [];
    dealerHand = [];
    splitHands = [[], []];
    playerPoints = 0;
    dealerPoints = 0;
    splitPoints = [0, 0];
    
    // Clear UI elements
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    splitCards1El.innerHTML = '';
    splitCards2El.innerHTML = '';
    dealerPointsEl.textContent = '0';
    playerPointsEl.textContent = '0';
    splitPoints1El.textContent = '0';
    splitPoints2El.textContent = '0';
    resultEl.textContent = '';
    
    // Reset game state flags
    gameActive = false;
    isSplit = false;
    currentSplitHand = 0;
    doubleDownAvailable = false;
    splitAvailable = false;
    insuranceAvailable = false;
    insuranceTaken = false;
    
    // Hide buttons
    actionButtonsEl.classList.add('hidden');
    insuranceBtn.classList.add('hidden');
    splitHandsContainerEl.classList.add('hidden');
}

/**
 * Deals the initial cards to the player and dealer
 */
function dealInitialCards() {
    // Use shorter animation times for mobile devices
    const isMobile = window.innerWidth < 768;
    const dealDelay = isMobile ? 200 : 300;
    
    // Deal first card to player (face up)
    dealCard(playerHand, playerCardsEl, false);
    updatePlayerPoints();
    
    // Deal first card to dealer (face up)
    setTimeout(() => {
        dealCard(dealerHand, dealerCardsEl, false);
        updateDealerPoints();
        
        // Deal second card to player (face up)
        setTimeout(() => {
            dealCard(playerHand, playerCardsEl, false);
            updatePlayerPoints();
            
            // Deal second card to dealer (face down)
            setTimeout(() => {
                dealCard(dealerHand, dealerCardsEl, true);
                // Don't update dealer points for the hidden card
            }, dealDelay);
        }, dealDelay);
    }, dealDelay);
}

/**
 * Deal a card to a hand with optimized animations
 */
function dealCard(hand, containerEl, hidden) {
    const card = deck.pop();
    hand.push(card);
    
    const cardEl = document.createElement('div');
    cardEl.className = 'card dealing';
    
    // Card inner HTML
    if (hidden) {
        cardEl.classList.add('hidden-card');
    } else {
        const cardHTML = `
            <div class="card-topright ${card.suit}">
                <div class="card-value">${card.rank}</div>
                <div class="card-suit">${suitSymbols[card.suit]}</div>
            </div>
            <div class="card-suit card-center ${card.suit}">${suitSymbols[card.suit]}</div>
            <div class="card-bottomleft ${card.suit}">
                <div class="card-value">${card.rank}</div>
                <div class="card-suit">${suitSymbols[card.suit]}</div>
            </div>
        `;
        cardEl.innerHTML = cardHTML;
    }
    
    containerEl.appendChild(cardEl);
    
    // Use requestAnimationFrame for smoother animations
    requestAnimationFrame(() => {
        setTimeout(() => {
            cardEl.classList.remove('dealing');
            cardEl.classList.add('dealt');
        }, 10);
    });
    
    return cardEl;
}

/**
 * Calculate the value of a hand
 */
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
        if (card.rank === 'A') {
            aces += 1;
            value += 11;
        } else if (['K', 'Q', 'J'].includes(card.rank)) {
            value += 10;
        } else {
            value += parseInt(card.rank);
        }
    }
    
    // Adjust for Aces
    while (value > 21 && aces > 0) {
        value -= 10; // Count an Ace as 1 instead of 11
        aces -= 1;
    }
    
    return value;
}

/**
 * Get the numeric value of a card
 */
function getCardValue(card) {
    if (card.rank === 'A') {
        return 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
        return 10;
    } else {
        return parseInt(card.rank);
    }
}

/**
 * Update player hand points
 */
function updatePlayerPoints() {
    if (isSplit) {
        splitPoints[0] = calculateHandValue(splitHands[0]);
        splitPoints[1] = calculateHandValue(splitHands[1]);
        splitPoints1El.textContent = splitPoints[0];
        splitPoints2El.textContent = splitPoints[1];
    } else {
        playerPoints = calculateHandValue(playerHand);
        playerPointsEl.textContent = playerPoints;
    }
}

/**
 * Update dealer hand points
 */
function updateDealerPoints() {
    // Only count visible cards for dealer points
    const visibleCards = dealerHand.filter((_, index) => index === 0 || !gameActive);
    dealerPoints = calculateHandValue(visibleCards);
    dealerPointsEl.textContent = dealerPoints;
}

/**
 * Player action: Hit (get another card)
 */
function hitCard() {
    if (!gameActive) return;
    
    // Hide double down and split buttons after first hit
    doubleBtn.classList.add('hidden');
    splitBtn.classList.add('hidden');
    
    // Handle split hands case
    if (isSplit) {
        const currentHand = splitHands[currentSplitHand];
        const currentEl = currentSplitHand === 0 ? splitCards1El : splitCards2El;
        
        dealCard(currentHand, currentEl, false);
        updatePlayerPoints();
        
        // Check for bust on split hand
        if (splitPoints[currentSplitHand] > 21) {
            messageEl.textContent = `Hand ${currentSplitHand + 1} busts!`;
            
            // Move to the next hand or dealer's turn
            if (currentSplitHand === 0) {
                currentSplitHand = 1;
                messageEl.textContent += ' Moving to Hand 2.';
                
                // Highlight the active hand
                document.querySelectorAll('.split-hand')[0].style.opacity = '0.7';
                document.querySelectorAll('.split-hand')[1].style.opacity = '1';
            } else {
                // Both hands played, move to dealer's turn
                setTimeout(() => {
                    dealerTurn();
                }, 1000);
            }
        }
    } else {
        // Regular (non-split) hand
        dealCard(playerHand, playerCardsEl, false);
        updatePlayerPoints();
        
        // Check if player busts
        if (playerPoints > 21) {
            messageEl.textContent = 'Bust! You lose.';
            endGame('dealer');
        }
    }
}

/**
 * Player action: Stand (end turn)
 */
function stand() {
    if (!gameActive) return;
    
    // Handle split hands case
    if (isSplit) {
        // If on first split hand, move to second hand
        if (currentSplitHand === 0) {
            currentSplitHand = 1;
            messageEl.textContent = 'Moving to Hand 2.';
            
            // Highlight the active hand
            document.querySelectorAll('.split-hand')[0].style.opacity = '0.7';
            document.querySelectorAll('.split-hand')[1].style.opacity = '1';
            return;
        }
    }
    
    // Move to dealer's turn
    dealerTurn();
}

/**
 * Player action: Double Down
 */
function doubleDown() {
    if (!gameActive || !doubleDownAvailable || playerBalance < currentBet) return;
    
    // Double the bet
    playerBalance -= currentBet;
    currentBet *= 2;
    updateBalance();
    
    messageEl.textContent = `Doubled down for a total bet of $${currentBet}`;
    
    // Deal exactly one more card to player
    dealCard(playerHand, playerCardsEl, false);
    updatePlayerPoints();
    
    // Check for bust, otherwise move to dealer's turn
    if (playerPoints > 21) {
        messageEl.textContent = 'Bust! You lose.';
        endGame('dealer');
    } else {
        setTimeout(() => {
            dealerTurn();
        }, 1000);
    }
}

/**
 * Player action: Split Pair
 */
function splitPair() {
    if (!gameActive || !splitAvailable || playerBalance < currentBet) return;
    
    // Charge extra bet for split
    playerBalance -= currentBet;
    updateBalance();
    
    // Set up split status
    isSplit = true;
    splitHandsContainerEl.classList.remove('hidden');
    playerCardsEl.innerHTML = '';
    
    // Move cards to split hands
    splitHands[0].push(playerHand[0]);
    splitHands[1].push(playerHand[1]);
    
    // Clear original hand
    playerHand = [];
    
    // Display first card in each hand
    const card1 = createCardElement(splitHands[0][0]);
    const card2 = createCardElement(splitHands[1][0]);
    splitCards1El.appendChild(card1);
    splitCards2El.appendChild(card2);
    
    // Deal a second card to first hand
    setTimeout(() => {
        dealCard(splitHands[0], splitCards1El, false);
        updatePlayerPoints();
        
        // Set focus to the first hand
        document.querySelectorAll('.split-hand')[0].style.opacity = '1';
        document.querySelectorAll('.split-hand')[1].style.opacity = '0.7';
        
        // Check for blackjack
        if (splitPoints[0] === 21) {
            messageEl.textContent = 'Blackjack on Hand 1! Moving to Hand 2.';
            currentSplitHand = 1;
            document.querySelectorAll('.split-hand')[0].style.opacity = '0.7';
            document.querySelectorAll('.split-hand')[1].style.opacity = '1';
            
            // Deal a second card to second hand
            setTimeout(() => {
                dealCard(splitHands[1], splitCards2El, false);
                updatePlayerPoints();
                
                // Check for blackjack on second hand
                if (splitPoints[1] === 21) {
                    messageEl.textContent = 'Blackjack on both hands!';
                    setTimeout(() => {
                        dealerTurn();
                    }, 1000);
                }
            }, 500);
        } else {
            // Deal a second card to second hand
            setTimeout(() => {
                dealCard(splitHands[1], splitCards2El, false);
                updatePlayerPoints();
            }, 500);
        }
    }, 500);
    
    messageEl.textContent = 'Pair split into two hands. Now playing Hand 1.';
}

/**
 * Player action: Take Insurance
 */
function takeInsurance() {
    if (!insuranceAvailable || insuranceTaken || playerBalance < currentBet / 2) return;
    
    // Charge half the original bet for insurance
    const insuranceAmount = currentBet / 2;
    playerBalance -= insuranceAmount;
    updateBalance();
    
    insuranceTaken = true;
    insuranceBtn.classList.add('hidden');
    
    messageEl.textContent = `Insurance taken for $${insuranceAmount}.`;
    
    // Check for dealer blackjack
    if (dealerHand[1].rank === 'A' || ['10', 'J', 'Q', 'K'].includes(dealerHand[1].rank)) {
        // Reveal dealer's hole card
        revealDealerCard();
        
        messageEl.textContent = 'Dealer has Blackjack! Insurance pays 2:1.';
        playerBalance += insuranceAmount * 3; // Return insurance bet plus 2:1 payout
        updateBalance();
        
        if (playerPoints === 21 && playerHand.length === 2) {
            messageEl.textContent += ' Your Blackjack pushes.';
            playerBalance += currentBet; // Return original bet (push)
            updateBalance();
        }
        
        endGame('dealer blackjack');
    }
}

/**
 * Dealer's turn with optimized timing for mobile
 */
function dealerTurn() {
    gameActive = false;
    
    // Hide action buttons
    actionButtonsEl.classList.add('hidden');
    insuranceBtn.classList.add('hidden');
    
    // Reveal dealer's hole card
    revealDealerCard();
    
    // Use shorter delays on mobile
    const isMobile = window.innerWidth < 768;
    const decisionDelay = isMobile ? 600 : 800;
    const initialDelay = isMobile ? 700 : 1000;
    
    // Dealer draws cards until reaching 17 or busting
    const dealerDecision = () => {
        if (dealerPoints < 17) {
            // Dealer hits
            setTimeout(() => {
                dealCard(dealerHand, dealerCardsEl, false);
                updateDealerPoints();
                dealerDecision(); // Recursive call for next decision
            }, decisionDelay);
        } else {
            // Dealer stands
            determineWinner();
        }
    };
    
    // Start dealer decision process
    setTimeout(() => {
        dealerDecision();
    }, initialDelay);
}

/**
 * Reveal the dealer's face-down card
 */
function revealDealerCard() {
    const hiddenCardEl = dealerCardsEl.querySelector('.hidden-card');
    if (hiddenCardEl) {
        hiddenCardEl.classList.add('flipping');
        
        setTimeout(() => {
            hiddenCardEl.classList.remove('hidden-card', 'flipping');
            const card = dealerHand[1];
            const cardHTML = `
                <div class="card-topright ${card.suit}">
                    <div class="card-value">${card.rank}</div>
                    <div class="card-suit">${suitSymbols[card.suit]}</div>
                </div>
                <div class="card-suit card-center ${card.suit}">${suitSymbols[card.suit]}</div>
                <div class="card-bottomleft ${card.suit}">
                    <div class="card-value">${card.rank}</div>
                    <div class="card-suit">${suitSymbols[card.suit]}</div>
                </div>
            `;
            hiddenCardEl.innerHTML = cardHTML;
            updateDealerPoints();
        }, 300);
    }
}

/**
 * Determine the winner of the game
 */
function determineWinner() {
    if (isSplit) {
        // Handle split hands
        determineWinnerForSplitHand(0);
        determineWinnerForSplitHand(1);
    } else {
        // Regular hand
        if (playerPoints > 21) {
            // Player busts, dealer wins
            messageEl.textContent = 'You busted! Dealer wins.';
            endGame('dealer');
        } else if (dealerPoints > 21) {
            // Dealer busts, player wins
            messageEl.textContent = 'Dealer busts! You win.';
            awardWinnings(2); // Pay 1:1
            endGame('player');
        } else if (playerPoints === 21 && playerHand.length === 2 && 
                  (dealerPoints !== 21 || dealerHand.length > 2)) {
            // Player has blackjack, dealer doesn't
            messageEl.textContent = 'Blackjack! You win.';
            awardWinnings(2.5); // Pay 3:2
            endGame('player blackjack');
        } else if (dealerPoints === 21 && dealerHand.length === 2 && 
                  (playerPoints !== 21 || playerHand.length > 2)) {
            // Dealer has blackjack, player doesn't
            messageEl.textContent = 'Dealer has Blackjack! You lose.';
            endGame('dealer blackjack');
        } else if (playerPoints > dealerPoints) {
            // Player has higher score
            messageEl.textContent = 'You win!';
            awardWinnings(2); // Pay 1:1
            endGame('player');
        } else if (playerPoints < dealerPoints) {
            // Dealer has higher score
            messageEl.textContent = 'Dealer wins!';
            endGame('dealer');
        } else {
            // Push (tie)
            messageEl.textContent = 'Push! Bet returned.';
            playerBalance += currentBet;
            updateBalance();
            endGame('push');
        }
    }
}

/**
 * Determine winner for a split hand
 */
function determineWinnerForSplitHand(handIndex) {
    const handPoints = splitPoints[handIndex];
    
    if (handPoints > 21) {
        // Hand busts
        resultEl.textContent += `Hand ${handIndex + 1}: Bust. `;
    } else if (dealerPoints > 21) {
        // Dealer busts
        resultEl.textContent += `Hand ${handIndex + 1}: Win (dealer busts). `;
        awardWinnings(2, handIndex); // Pay 1:1
    } else if (handPoints > dealerPoints) {
        // Hand wins
        resultEl.textContent += `Hand ${handIndex + 1}: Win. `;
        awardWinnings(2, handIndex); // Pay 1:1
    } else if (handPoints < dealerPoints) {
        // Hand loses
        resultEl.textContent += `Hand ${handIndex + 1}: Lose. `;
    } else {
        // Push
        resultEl.textContent += `Hand ${handIndex + 1}: Push. `;
        playerBalance += currentBet;
        updateBalance();
    }
}

/**
 * Award winnings to player
 */
function awardWinnings(multiplier, splitHandIndex = -1) {
    const winnings = currentBet * multiplier;
    playerBalance += winnings;
    updateBalance();
    
    if (splitHandIndex === -1) {
        resultEl.textContent = `You won $${winnings - currentBet}!`;
    }
}

/**
 * End the game and update the UI
 */
function endGame(result) {
    gameActive = false;
    actionButtonsEl.classList.add('hidden');
    newGameBtn.classList.remove('hidden');
    
    // Enable tracking stats or other end-game logic here
    console.log(`Game ended with result: ${result}`);
}

/**
 * Create a card element from a card object
 */
function createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    
    const cardHTML = `
        <div class="card-topright ${card.suit}">
            <div class="card-value">${card.rank}</div>
            <div class="card-suit">${suitSymbols[card.suit]}</div>
        </div>
        <div class="card-suit card-center ${card.suit}">${suitSymbols[card.suit]}</div>
        <div class="card-bottomleft ${card.suit}">
            <div class="card-value">${card.rank}</div>
            <div class="card-suit">${suitSymbols[card.suit]}</div>
        </div>
    `;
    
    cardEl.innerHTML = cardHTML;
    return cardEl;
}

/**
 * Update the balance display and bet limits
 */
function updateBalance() {
    balanceEl.textContent = playerBalance;
    betInputEl.max = playerBalance;
    
    // Adjust bet amount if current value exceeds balance
    if (parseInt(betInputEl.value) > playerBalance) {
        betInputEl.value = playerBalance;
    }
}