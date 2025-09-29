
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
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

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
    const animationDelay = `${cardIndex * 150}ms`;
    
    // Animate cards fanning out
    const rotation = (cardIndex - (handSize - 1) / 2) * 5;
    const translateY = Math.abs(cardIndex - (handSize - 1) / 2) * 5;

    if (hidden) {
        return (
             <div 
                className="w-24 h-36 bg-primary/20 rounded-lg border-2 border-primary/50 absolute transition-all duration-300"
                style={{ 
                    animation: `dealCard 0.5s ease-out forwards`, 
                    animationDelay,
                    transform: `rotate(${rotation}deg) translateY(${translateY}px) translateX(0px)`,
                }}
            ></div>
        );
    }
    if (!card) {
        return <div className="w-24 h-36 bg-transparent rounded-lg absolute"></div>;
    }

    const suitSymbols = { H: '♥', D: '♦', C: '♣', S: '♠' };
    const suitColor = ['H', 'D'].includes(card.suit) ? 'text-red-500' : 'text-foreground';

    return (
        <div 
            className={cn(
                "w-24 h-36 bg-card rounded-lg p-2 flex flex-col justify-between border-2 border-border shadow-lg absolute transition-all duration-300",
                "hover:scale-110 hover:-translate-y-4 z-20"
            )}
            style={{ 
                animation: `dealCard 0.5s ease-out forwards`,
                animationDelay,
                transform: `rotate(${rotation}deg) translateY(${translateY}px) translateX(0px)`,
            }}
        >
            <div className={`text-xl font-bold ${suitColor}`}>{card.rank}</div>
            <div className={`text-3xl text-center ${suitColor}`}>{suitSymbols[card.suit]}</div>
            <div className={`text-xl font-bold self-end transform rotate-180 ${suitColor}`}>{card.rank}</div>
        </div>
    );
};

export default function BlackjackGame() {
    const { language } = useLanguage();
    const t = translations[language];
    const [deck, setDeck] = useState<CardType[]>([]);
    const [playerHand, setPlayerHand] = useState<HandType>([]);
    const [dealerHand, setDealerHand] = useState<HandType>([]);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [betAmount, setBetAmount] = useState(10);
    const [message, setMessage] = useState(t.placeYourBet);

    const { balance, setBalance } = useBalance();
    const { toast } = useToast();

    useEffect(() => {
        setMessage(t.placeYourBet);
    }, [language]);

    const deal = () => {
        if (betAmount <= 0 || betAmount > balance) {
            toast({ title: t.invalidBetAmount, variant: "destructive" });
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
            setTimeout(() => stand(playerInitialHand), 500);
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
            setTimeout(() => stand(newHand), 500);
        }
    }

    const stand = useCallback((currentHand?: HandType) => {
        if (gameState !== 'playing' && gameState !== 'dealer') return;
        const finalPlayerHand = currentHand || playerHand;
        
        setGameState('dealer');

        let tempDealerHand = [...dealerHand];
        let tempDeck = [...deck];
        
        const dealerTurn = () => {
            const score = getHandScore(tempDealerHand);
            if (score < 17) {
                const newCard = tempDeck.pop();
                if (newCard) {
                    tempDealerHand.push(newCard);
                    setDealerHand([...tempDealerHand]);
                    setTimeout(dealerTurn, 500);
                } else {
                     endGame(finalPlayerHand, tempDealerHand);
                }
            } else {
                endGame(finalPlayerHand, tempDealerHand);
            }
        };

        setTimeout(dealerTurn, 500);
        
    }, [deck, dealerHand, playerHand, gameState]);
    
    const endGame = (finalPlayerHand: HandType, finalDealerHand: HandType) => {
            const pScore = getHandScore(finalPlayerHand);
            const dScore = getHandScore(finalDealerHand);

            let resultMessage = '';
            if (pScore > 21) {
                resultMessage = `${t.youBustedWith} ${pScore}!`;
                toast({ title: t.youLose, description: resultMessage, variant: "destructive" });
            } else if (dScore > 21) {
                resultMessage = `${t.dealerBustedWith} ${dScore}! ${t.youWin}!`;
                setBalance(prev => prev + betAmount * 2);
                toast({ title: t.youWin, description: resultMessage });
            } else if (pScore === 21 && finalPlayerHand.length === 2) {
                 resultMessage = `Blackjack! ${t.youWin}!`;
                setBalance(prev => prev + betAmount * 2.5); // Blackjack payout 3:2
                toast({ title: "Blackjack!", description: resultMessage });
            } else if (pScore > dScore) {
                resultMessage = `${t.youWinWith} ${pScore} ${t.to} ${dScore}!`;
                setBalance(prev => prev + betAmount * 2);
                toast({ title: t.youWin, description: resultMessage });
            } else if (pScore < dScore) {
                resultMessage = `${t.youLoseWith} ${pScore} ${t.to} ${dScore}.`;
                toast({ title: t.youLose, description: resultMessage, variant: "destructive" });
            } else {
                resultMessage = t.pushTie;
                setBalance(prev => prev + betAmount); // Return bet
                toast({ title: t.itsATie, description: resultMessage });
            }
            setMessage(resultMessage);
            setGameState('finished');
    };

    const HandDisplay = ({ hand, title, isDealer }: { hand: HandType, title: string, isDealer?: boolean }) => {
      const score = getHandScore(hand);
      const displayedScore = isDealer && gameState === 'playing' ? getHandScore([hand[0]]) : score;
      
      return (
        <div className="flex flex-col items-center gap-4 w-full h-48">
            <h2 className="text-2xl font-bold text-foreground">{title} - {t.score}: {displayedScore}</h2>
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
    )};
    
    return (
        <div className="flex flex-col items-center gap-4 w-full">
             <style jsx>{`
                @keyframes dealCard {
                    from { transform: translateY(-100px) rotate(0deg) scale(0.8); opacity: 0; }
                    to { opacity: 1; transform: translateY(0) rotate(var(--rotation, 0)) scale(1); }
                }
            `}</style>
            <Card className="w-full bg-card/80 backdrop-blur-sm border-border shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-center text-foreground font-headline text-4xl drop-shadow-md">Blackjack</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-8 min-h-[500px] justify-around p-4 md:p-6">
                    <HandDisplay hand={dealerHand} title={t.dealersHand} isDealer />
                    
                    <div className="h-12 text-xl font-bold text-foreground bg-background/50 rounded-lg px-4 py-2 flex items-center justify-center shadow-inner">
                        {message}
                    </div>

                    <HandDisplay hand={playerHand} title={t.yourHand} />
                </CardContent>
                <CardFooter className="flex flex-col gap-4 bg-background/30 p-4">
                    {gameState === 'betting' && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                            <div className="grid gap-2 w-full">
                                <Label htmlFor="bet-amount" className="flex items-center gap-2 text-foreground"><Wallet />{t.betAmount}</Label>
                                <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} className="bg-background text-foreground"/>
                            </div>
                            <Button onClick={deal} size="lg" className="h-14 w-full text-xl"><Play className="mr-2"/>{t.deal}</Button>
                        </div>
                    )}
                    {gameState === 'playing' && (
                        <div className="flex gap-4">
                            <Button onClick={hit} size="lg" className="h-16 text-xl">{t.hit}</Button>
                            <Button onClick={() => stand()} size="lg" variant="secondary" className="h-16 text-xl">{t.stand}</Button>
                        </div>
                    )}
                    {gameState === 'finished' && (
                        <Button onClick={() => {
                            setGameState('betting');
                            setPlayerHand([]);
                            setDealerHand([]);
                            setMessage(t.placeYourBet);
                        }} size="lg" className="h-16 text-xl">
                            {t.playAgain}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
