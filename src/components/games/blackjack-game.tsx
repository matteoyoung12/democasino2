
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBalance } from '@/contexts/BalanceContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Suit = 'H' | 'D' | 'C' | 'S';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type CardType = { suit: Suit; rank: Rank };
type HandType = CardType[];
type GameState = 'betting' | 'playing' | 'dealer' | 'finished';

const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suits: Suit[] = ['H', 'D', 'C', 'S'];

const createDeck = (): CardType[] => {
    return suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));
}

const shuffleDeck = (deck: CardType[]): CardType[] => {
    return deck.sort(() => Math.random() - 0.5);
}

const getHandScore = (hand: HandType): number => {
    let score = 0;
    let aces = 0;
    hand.forEach(card => {
        if (card.rank === 'A') {
            aces++;
            score += 11;
        } else if (['J', 'Q', 'K'].includes(card.rank)) {
            score += 10;
        } else {
            score += parseInt(card.rank);
        }
    });
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

const CardComponent = ({ card, hidden, cardIndex, handSize }: { card?: CardType, hidden?: boolean, cardIndex: number, handSize: number }) => {
    const animationDelay = `${cardIndex * 100}ms`;
    
    // Calculate the offset to center the hand
    const handWidth = handSize * 40 + (handSize > 0 ? (handSize - 1) * 16 : 0);
    const totalOffset = -handWidth / 2;
    const cardOffset = cardIndex * (40 + 16); // 40 is width of the card, 16 is gap
    
    const transformStyle = `translateX(calc(-50% + ${totalOffset + cardOffset}px))`;

    if (hidden) {
        return (
             <div 
                className="w-24 h-36 bg-blue-700 rounded-lg border-2 border-blue-900 absolute"
                style={{ 
                    animation: `dealCard 0.5s ease-out forwards`, 
                    animationDelay, 
                    left: '50%',
                    transform: transformStyle
                }}
            ></div>
        );
    }
    if (!card) {
        return <div className="w-24 h-36 bg-transparent rounded-lg absolute"></div>;
    }

    const suitSymbols = { H: '♥', D: '♦', C: '♣', S: '♠' };
    const suitColor = ['H', 'D'].includes(card.suit) ? 'text-red-500' : 'text-black';

    return (
        <div 
            className={cn(
                "w-24 h-36 bg-white rounded-lg p-2 flex flex-col justify-between border-2 border-gray-300 shadow-lg absolute",
                "transition-all duration-500 ease-out"
            )}
            style={{ 
                animation: `dealCard 0.5s ease-out forwards`,
                animationDelay,
                left: '50%', 
                transform: transformStyle,
            }}
        >
            <div className={`text-xl font-bold ${suitColor}`}>{card.rank}</div>
            <div className={`text-3xl text-center ${suitColor}`}>{suitSymbols[card.suit]}</div>
            <div className={`text-xl font-bold self-end transform rotate-180 ${suitColor}`}>{card.rank}</div>
        </div>
    );
};


export default function BlackjackGame() {
    const [deck, setDeck] = useState<CardType[]>([]);
    const [playerHand, setPlayerHand] = useState<HandType>([]);
    const [dealerHand, setDealerHand] = useState<HandType>([]);
    const [playerScore, setPlayerScore] = useState(0);
    const [dealerScore, setDealerScore] = useState(0);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [betAmount, setBetAmount] = useState(10);
    const [message, setMessage] = useState('Place your bet to start.');

    const { balance, setBalance } = useBalance();
    const { toast } = useToast();

    const deal = () => {
        if (betAmount <= 0 || betAmount > balance) {
            toast({ title: "Invalid bet amount", variant: "destructive" });
            return;
        }

        setBalance(prev => prev - betAmount);
        
        let newDeck = shuffleDeck(createDeck());
        const playerInitialHand = [newDeck.pop()!, newDeck.pop()!];
        const dealerInitialHand = [newDeck.pop()!, newDeck.pop()!];

        setDeck(newDeck);
        setPlayerHand(playerInitialHand);
        setDealerHand(dealerInitialHand);
        setGameState('playing');
        setMessage('');

        if (getHandScore(playerInitialHand) === 21) {
            setTimeout(() => endGame(playerInitialHand, dealerInitialHand, newDeck), 500);
        }
    }

    const hit = () => {
        if (gameState !== 'playing') return;

        const newDeck = [...deck];
        const newCard = newDeck.pop()!;
        const newHand = [...playerHand, newCard];
        setDeck(newDeck);
        setPlayerHand(newHand);

        if (getHandScore(newHand) > 21) {
            setTimeout(() => endGame(newHand, dealerHand, newDeck), 500);
        }
    }

    const stand = () => {
        if (gameState !== 'playing') return;
        endGame(playerHand, dealerHand, deck);
    }
    
    const endGame = useCallback((finalPlayerHand: HandType, finalDealerHand: HandType, currentDeck: CardType[]) => {
        setGameState('dealer');

        let tempDealerHand = [...finalDealerHand];
        let tempDeck = [...currentDeck];
        
        const dealerTurn = (currentDealerHand: HandType, deck: CardType[]): { finalHand: HandType, finalDeck: CardType[] } => {
            let hand = [...currentDealerHand];
            let d = [...deck];
            while(getHandScore(hand) < 17) {
                const newCard = d.pop();
                if(newCard) hand.push(newCard);
                else break;
            }
            return { finalHand: hand, finalDeck: d };
        };

        const { finalHand: newDealerHand, finalDeck: newDeck } = dealerTurn(tempDealerHand, tempDeck);
        
        setTimeout(() => {
            setDealerHand(newDealerHand);
            setDeck(newDeck);
            
            const pScore = getHandScore(finalPlayerHand);
            const dScore = getHandScore(newDealerHand);
            setPlayerScore(pScore);
            setDealerScore(dScore);

            let resultMessage = '';
            if (pScore > 21) {
                resultMessage = `You Busted with ${pScore}!`;
                toast({ title: "You Lose!", description: resultMessage, variant: "destructive" });
            } else if (dScore > 21) {
                resultMessage = `Dealer Busted with ${dScore}! You win!`;
                setBalance(prev => prev + betAmount * 2);
                toast({ title: "You Win!", description: resultMessage });
            } else if (pScore === 21 && finalPlayerHand.length === 2) {
                 resultMessage = `Blackjack! You win!`;
                setBalance(prev => prev + betAmount * 2.5); // Blackjack payout 3:2
                toast({ title: "Blackjack!", description: resultMessage });
            } else if (pScore > dScore) {
                resultMessage = `You Win with ${pScore} to ${dScore}!`;
                setBalance(prev => prev + betAmount * 2);
                toast({ title: "You Win!", description: resultMessage });
            } else if (pScore < dScore) {
                resultMessage = `You Lose with ${pScore} to ${dScore}.`;
                toast({ title: "You Lose!", description: resultMessage, variant: "destructive" });
            } else {
                resultMessage = "Push! It's a tie.";
                setBalance(prev => prev + betAmount); // Return bet
                toast({ title: "It's a tie!", description: resultMessage });
            }
            setMessage(resultMessage);
            setGameState('finished');
        }, 1000);
    }, [betAmount, setBalance, toast]);

    useEffect(() => {
        if(gameState === 'playing') {
            setPlayerScore(getHandScore(playerHand));
            setDealerScore(getHandScore(dealerHand.slice(0,1))); // Only show score of first card
        }
    }, [playerHand, dealerHand, gameState]);

    const HandDisplay = ({ hand, title, score, isDealer }: { hand: HandType, title: string, score: number, isDealer?: boolean }) => (
        <div className="flex flex-col items-center gap-4 w-full">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{title} - Score: {score}</h2>
            <div className="relative h-40 w-full flex justify-center items-center">
                {hand.map((card, index) => {
                    const isHidden = isDealer && index === 1 && gameState === 'playing';
                    return <CardComponent 
                                key={index} 
                                card={card} 
                                hidden={isHidden} 
                                cardIndex={index} 
                                handSize={hand.length}
                           />
                })}
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col items-center gap-4 w-full">
             <style jsx>{`
                @keyframes dealCard {
                    from { transform: translateY(-200px) translateX(-50%) rotate(0deg); opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
            <Card className="w-full bg-green-700/70 border-green-900/50 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-center text-white font-headline text-4xl drop-shadow-md">Blackjack</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-around">
                    <HandDisplay hand={dealerHand} title="Dealer's Hand" score={gameState === 'playing' ? getHandScore(dealerHand.slice(0,1)) : getHandScore(dealerHand)} isDealer />
                    
                    <div className="h-10 text-xl font-bold text-white bg-black/30 rounded-lg px-4 py-2 flex items-center justify-center">{message}</div>

                    <HandDisplay hand={playerHand} title="Your Hand" score={getHandScore(playerHand)} />
                </CardContent>
                <CardFooter className="flex flex-col gap-4 bg-black/20 p-4">
                     
                        <>
                            {gameState === 'betting' && (
                                <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                                    <div className="grid gap-2 w-full">
                                        <Label htmlFor="bet-amount" className="flex items-center gap-2 text-white"><Wallet />Bet Amount</Label>
                                        <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} className="bg-white/90 text-black"/>
                                    </div>
                                    <Button onClick={deal} size="lg" className="h-14 w-full text-xl"><Play className="mr-2"/>Deal</Button>
                                </div>
                            )}
                            {gameState === 'playing' && (
                                <div className="flex gap-4">
                                    <Button onClick={hit} size="lg" className="h-16 text-xl">Hit</Button>
                                    <Button onClick={stand} size="lg" className="h-16 text-xl">Stand</Button>
                                </div>
                            )}
                            {gameState === 'finished' && (
                                <Button onClick={() => {
                                    setGameState('betting');
                                    setPlayerHand([]);
                                    setDealerHand([]);
                                    setMessage('Place your bet to start.');
                                }} size="lg" className="h-16 text-xl">
                                    Play Again
                                </Button>
                            )}
                        </>
                    
                    {(gameState === 'dealer' || gameState === 'playing' || gameState === 'finished') && <div className="h-16"/>}
                </CardFooter>
            </Card>
        </div>
    )
}
