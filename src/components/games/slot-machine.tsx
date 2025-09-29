
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Apple, Star, DollarSign, Heart, Banana, Play, Gem, Gift, Bot } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const symbols = [Apple, Banana, Heart, Star, DollarSign];
const scatterSymbol = Gem;
const allSymbols = [...symbols, scatterSymbol];

const payoutTable = {
    3: 2,
    4: 5,
    5: 15,
};

const Reel = ({ finalSymbols, isSpinning, reelIndex }: { finalSymbols: number[], isSpinning: boolean, reelIndex: number }) => {
    const symbolHeight = 64; // h-16
    const spinDuration = 1000 + reelIndex * 150;

    const getSymbol = (index: number) => allSymbols[index] || allSymbols[0];

    return (
        <div className="h-[192px] w-16 overflow-hidden bg-card/50 rounded-lg border-2 border-primary/50">
            <div
                className="flex flex-col items-center justify-start"
                style={{
                    transform: isSpinning ? `translateY(-${allSymbols.length * symbolHeight * 2}px)` : `translateY(0px)`,
                    transition: `transform ${spinDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`,
                }}
            >
                {[...Array(allSymbols.length * 3)].map((_, i) => {
                    const Symbol = getSymbol(isSpinning ? i % allSymbols.length : finalSymbols[i % finalSymbols.length]);

                    return <Symbol key={i} className="h-16 w-16 shrink-0 p-2 text-primary" />
                })}
            </div>
        </div>
    );
};


export default function SlotMachine() {
    const [grid, setGrid] = useState<number[][]>(() => Array(5).fill(Array(3).fill(0)));
    const [spinning, setSpinning] = useState(false);
    const [winnings, setWinnings] = useState<number | null>(null);
    const [freeSpins, setFreeSpins] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [betAmount, setBetAmount] = useState(5);
    const { balance, setBalance } = useBalance();

    const { toast } = useToast();
    const bonusBuyCost = betAmount * 50;

    const spin = useCallback((isFreeSpin = false) => {
        if (spinning) return;

        if (!isFreeSpin && balance < betAmount) {
            toast({ title: "Not enough balance", variant: "destructive" });
            setIsAutoPlay(false);
            return;
        }

        if (!isFreeSpin) {
            setBalance(prev => prev - betAmount);
        } else {
            setFreeSpins(prev => prev - 1);
        }

        setWinnings(null);
        setSpinning(true);

        const newGrid = Array(5).fill(0).map(() =>
            Array(3).fill(0).map(() => Math.floor(Math.random() * allSymbols.length))
        );

        setTimeout(() => {
            setGrid(newGrid);
            setSpinning(false);
            checkWin(newGrid, isFreeSpin);
        }, 1500); // Wait for spin animation to finish
    }, [balance, betAmount, spinning, setBalance, toast]);

    const buyBonus = () => {
        if (balance < bonusBuyCost) {
            toast({ title: "Not enough balance for Bonus Buy", variant: "destructive" });
            return;
        }
        setBalance(prev => prev - bonusBuyCost);
        toast({ title: "Bonus Purchased!", description: "10 Free Spins awarded." });
        setFreeSpins(10);
    }

    useEffect(() => {
        if ((isAutoPlay || freeSpins > 0) && !spinning) {
            const timer = setTimeout(() => spin(freeSpins > 0), 2000);
            return () => clearTimeout(timer);
        }
    }, [isAutoPlay, freeSpins, spinning, spin]);


    const checkWin = (finalGrid: number[][], isFreeSpin: boolean) => {
        let totalWinnings = 0;
        let winFound = false;

        const scatterCount = finalGrid.flat().filter(symbolIndex => symbolIndex === allSymbols.indexOf(scatterSymbol)).length;
        if (scatterCount >= 3) {
            const newSpins = 10;
            toast({ title: "Free Spins Triggered!", description: `You won ${newSpins} free spins.` });
            setFreeSpins(prev => prev + newSpins);
            winFound = true;
        }

        // Transpose grid to check columns as rows for win checking
        const rows = finalGrid[0].map((_, colIndex) => finalGrid.map(row => row[colIndex]));
        
        rows.forEach(row => {
            const counts: { [key: number]: number } = {};
            row.forEach(symbolIndex => {
                if (symbolIndex !== allSymbols.indexOf(scatterSymbol)) {
                    counts[symbolIndex] = (counts[symbolIndex] || 0) + 1;
                }
            });

            for (const symbolIndex in counts) {
                const count = counts[symbolIndex];
                if (count >= 3) {
                    const winMultiplier = payoutTable[count as keyof typeof payoutTable];
                    totalWinnings += betAmount * winMultiplier;
                    winFound = true;
                }
            }
        });


        if (totalWinnings > 0) {
            setWinnings(totalWinnings);
            setBalance(prev => prev + totalWinnings);
            toast({ title: `You Won!`, description: `You won ${totalWinnings.toFixed(2)} credits!` });
        } else if (!winFound && !isFreeSpin) {
            toast({ title: "Try Again!", description: "No win this time.", duration: 2000 });
        }
    };

    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(e.target.value);
        if (amount > 0) {
            setBetAmount(amount);
        }
    }
    
    const finalGridTransposed = grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
            <div className={cn(
                "grid grid-cols-5 gap-2 p-4 rounded-xl bg-card border-4 border-primary shadow-2xl shadow-primary/20",
                winnings !== null && "animate-pulse"
            )}>
                {finalGridTransposed.map((reelSymbols, reelIndex) => (
                     <div key={reelIndex} className="flex flex-col gap-2">
                        {reelSymbols.map((symbolIndex, colIndex) => {
                            const Symbol = allSymbols[symbolIndex];
                            return (
                                <div key={colIndex} className="h-16 w-16 flex items-center justify-center bg-card/50 rounded-lg border-2 border-primary/50">
                                    {Symbol && <Symbol className="h-full w-full p-2 text-primary" />}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {winnings !== null && (
                <div className="text-3xl font-bold text-accent animate-bounce">
                    + {winnings.toFixed(2)} Credits!
                </div>
            )}

            {freeSpins > 0 && (
                <div className="text-2xl font-bold text-primary">
                    Free Spins Remaining: {freeSpins}
                </div>
            )}
             
            <Card className="w-full">
                <CardContent className="p-4 flex flex-col gap-4">
                    <div className="text-xl w-full text-center p-2 bg-card rounded-md">
                        Balance: <span className="font-bold text-primary">{balance.toFixed(2)} Credits</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bet-amount">Bet Amount</Label>
                            <Input id="bet-amount" type="number" value={betAmount} onChange={handleBetChange} disabled={spinning || isAutoPlay || freeSpins > 0} />
                        </div>
                         <Button onClick={buyBonus} disabled={spinning || isAutoPlay || freeSpins > 0} variant="outline" className="self-end h-10 border-accent text-accent hover:bg-accent/20">
                            <Gift className="mr-2"/> Buy Bonus (${bonusBuyCost})
                        </Button>
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button onClick={() => spin(false)} disabled={spinning || isAutoPlay || freeSpins > 0} size="lg" className="w-full h-16 text-xl bg-primary text-primary-foreground hover:bg-primary/90">
                            {spinning ? 'Spinning...' : `Spin`}
                            {!spinning && <Play className="ml-2" />}
                        </Button>
                        <Button onClick={() => setIsAutoPlay(!isAutoPlay)} disabled={spinning || freeSpins > 0} size="lg" variant={isAutoPlay ? 'secondary' : 'outline'} className="w-full h-16 text-xl">
                            <Bot className="mr-2" /> {isAutoPlay ? 'Stop Auto' : 'Auto Play'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
