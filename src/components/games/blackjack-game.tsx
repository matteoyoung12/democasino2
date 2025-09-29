
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBalance } from '@/contexts/BalanceContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Hand, Play, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const getCardValue = (card: CardType, currentScore: number): number => {
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return currentScore + 11 > 21 ? 1 : 11;
    return parseInt(card.rank);
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

const CardComponent = ({ card, hidden }: { card?: CardType, hidden?: boolean }) => {
    if (hidden) {
        return <div className="w-24 h-36 bg-blue-700 rounded-lg border-2 border-blue-900"></div>;
    }
    if (!card) {
        return <div className="w-24 h-36 bg-transparent rounded-lg"></div>;
    }

    const suitSymbols = { H: '♥', D: '♦', C: '♣', S: '♠' };
    const suitColor = ['H', 'D'].includes(card.suit) ? 'text-red-500' : 'text-black';

    return (
        <div className="w-24 h-36 bg-white rounded-lg p-2 flex flex-col justify-between border-2 border-gray-300 shadow-md">
            <div className={`text-2xl font-bold ${suitColor}`}>{card.rank}</div>
            <div className={`text-4xl text-center ${suitColor}`}>{suitSymbols[card.suit]}</div>
            <div className={`text-2xl font-bold self-end transform rotate-180 ${suitColor}`}>{card.rank}</div>
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
            endGame(playerInitialHand, dealerInitialHand, newDeck);
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
            endGame(newHand, dealerHand, newDeck);
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
                hand.push(d.pop()!);
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

    const HandDisplay = ({ hand, title, score, isDealer, isTurn }: { hand: HandType, title: string, score: number, isDealer?: boolean, isTurn?: boolean }) => (
        <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold">{title} - Score: {score}</h2>
            <div className="flex gap-2 min-h-[144px]">
                {hand.map((card, index) => (
                    <CardComponent key={index} card={card} hidden={isDealer && index === 1 && gameState === 'playing'} />
                ))}
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center">Blackjack</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <HandDisplay hand={dealerHand} title="Dealer's Hand" score={dealerScore} isDealer />
                    
                    <div className="h-4 text-xl font-bold text-primary">{message}</div>

                    <HandDisplay hand={playerHand} title="Your Hand" score={playerScore} />
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                     {gameState === 'betting' && (
                        <div className="flex flex-col items-center gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="bet-amount" className="flex items-center gap-2"><Wallet />Bet Amount</Label>
                                <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} />
                            </div>
                            <Button onClick={deal} size="lg" className="h-16 w-full text-xl"><Play className="mr-2"/>Deal</Button>
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
                    {(gameState === 'dealer' || gameState === 'playing') && <div className="h-16"/>}
                </CardFooter>
            </Card>
        </div>
    )
}
