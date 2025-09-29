
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Apple, Star, DollarSign, Heart, Banana, Play, Gem, Gift, Bot } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '@/components/ui/card';

const symbols = [
    { icon: Apple, color: 'text-green-500' },
    { icon: Banana, color: 'text-yellow-500' },
    { icon: Heart, color: 'text-red-500' },
    { icon: Star, color: 'text-yellow-400' },
    { icon: DollarSign, color: 'text-green-600' }
];
const scatterSymbol = { icon: Gem, color: 'text-purple-500' };

const allSymbols = [...symbols, scatterSymbol];

const payoutTable = {
    3: 2,
    4: 5,
    5: 15,
};

// Function to generate a symbol, making scatter rare
const getRandomSymbol = () => {
    // 1 in 25 chance for a scatter symbol
    const isScatter = Math.random() < 1 / 35; 
    if (isScatter) {
        return allSymbols.indexOf(scatterSymbol);
    }
    return Math.floor(Math.random() * symbols.length);
};


const Reel = ({ symbols, spinning, finalSymbols, winningCells }: { symbols: number[], spinning: boolean, finalSymbols: number[], winningCells: boolean[] }) => {
    const reelSymbols = useMemo(() => {
        const randomSymbols = Array(20).fill(0).map(() => getRandomSymbol());
        return [...randomSymbols, ...finalSymbols];
    }, [finalSymbols]);
    
    return (
        <div className="flex flex-col h-[21rem] overflow-hidden">
             <div className={cn("flex flex-col transition-transform duration-1000 ease-in-out", spinning ? 'translate-y-[-calc(20*5.25rem)]' : 'translate-y-0')}>
                {reelSymbols.map((symbolIndex, index) => {
                     const Symbol = allSymbols[symbolIndex].icon;
                     const color = allSymbols[symbolIndex].color;
                     const isFinalSymbol = index >= 20;
                     const finalSymbolIndex = index - 20;
                     const isWinning = isFinalSymbol && winningCells[finalSymbolIndex];

                    return (
                        <div key={index} 
                             className={cn(
                                "h-20 w-20 flex items-center justify-center bg-card/50 rounded-lg border-2 border-primary/50 mb-1",
                                isWinning && "shadow-[0_0_15px_5px] shadow-yellow-400 bg-yellow-500/20 border-yellow-400"
                              )}
                        >
                            <Symbol className={cn("h-full w-full p-2", color)} />
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


export default function SlotMachine() {
    const [grid, setGrid] = useState<number[][]>(() => Array(5).fill(null).map(() => Array(5).fill(0)));
    const [spinning, setSpinning] = useState(false);
    const [winnings, setWinnings] = useState<number | null>(null);
    const [winningCells, setWinningCells] = useState<boolean[][]>(() => Array(5).fill(Array(5).fill(false)));
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
        setWinningCells(Array(5).fill(Array(5).fill(false)));
        setSpinning(true);

        const newGrid = Array(5).fill(0).map(() =>
            Array(5).fill(0).map(() => getRandomSymbol())
        );
        
        // This sets the final state of the grid before animation starts
        setGrid(newGrid);

        setTimeout(() => {
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
            const timer = setTimeout(() => spin(freeSpins > 0), winnings !== null ? 3000 : 1000);
            return () => clearTimeout(timer);
        }
    }, [isAutoPlay, freeSpins, spinning, spin, winnings]);


    const checkWin = (finalGrid: number[][], isFreeSpin: boolean) => {
        let totalWinnings = 0;
        let winFound = false;
        const newWinningCells = Array(5).fill(null).map(() => Array(5).fill(false));

        const scatterCount = finalGrid.flat().filter(symbolIndex => symbolIndex === allSymbols.indexOf(scatterSymbol)).length;
        if (scatterCount >= 3) {
            const newSpins = 10;
            toast({ title: "Free Spins Triggered!", description: `You won ${newSpins} free spins.` });
            setFreeSpins(prev => prev + newSpins);
            winFound = true;
            
            finalGrid.forEach((row, rowIndex) => {
                row.forEach((symbolIndex, colIndex) => {
                    if (symbolIndex === allSymbols.indexOf(scatterSymbol)) {
                        newWinningCells[rowIndex][colIndex] = true;
                    }
                });
            });
        }
        
        finalGrid.forEach((row, rowIndex) => {
            const counts: { [key: number]: number[] } = {};
            row.forEach((symbolIndex, colIndex) => {
                 if (symbolIndex !== allSymbols.indexOf(scatterSymbol)) {
                    if(!counts[symbolIndex]) counts[symbolIndex] = [];
                    counts[symbolIndex].push(colIndex);
                }
            });

            for (const symbolIndex in counts) {
                const count = counts[symbolIndex].length;
                if (count >= 3) {
                    const winMultiplier = payoutTable[count as keyof typeof payoutTable];
                    totalWinnings += betAmount * winMultiplier;
                    winFound = true;
                    counts[symbolIndex].forEach(colIndex => {
                        newWinningCells[rowIndex][colIndex] = true;
                    });
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
        setWinningCells(newWinningCells);
    };

    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(e.target.value);
        if (amount > 0) {
            setBetAmount(amount);
        }
    }
    
    const finalGridTransposed = grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
    const winningCellsTransposed = winningCells[0].map((_, colIndex) => winningCells.map(row => row[colIndex]));
    
    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
            <div className={cn(
                "grid grid-cols-5 gap-2 p-4 rounded-xl bg-card border-4 border-primary shadow-2xl shadow-primary/20",
                 winnings !== null && winnings > 0 && "animate-pulse"
            )}>
                {finalGridTransposed.map((reelSymbols, reelIndex) => (
                    <Reel 
                        key={reelIndex} 
                        symbols={reelSymbols} 
                        spinning={spinning}
                        finalSymbols={reelSymbols}
                        winningCells={winningCellsTransposed[reelIndex]}
                    />
                ))}
            </div>

            {winnings !== null && winnings > 0 && (
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
                         <Button onClick={buyBonus} disabled={spinning || isAutoPlay || freeSpins > 0 || balance < bonusBuyCost} variant="outline" className="self-end h-10 border-accent text-accent hover:bg-accent/20">
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
