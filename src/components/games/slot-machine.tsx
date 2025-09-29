
"use client";

import { useState, useEffect, useRef, useMemo, type ElementType } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Apple, Star, DollarSign, Heart, Banana, Play, Gem, Gift } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';

const symbols: ElementType[] = [Apple, Star, DollarSign, Heart, Banana];
const scatterSymbol = Gem; 
const allSymbols = [...symbols, scatterSymbol];

const payoutMultiplier = 10;
const bonusBuyCost = 50 * 5; // 50x the bet

const Reel = ({ symbols, finalSymbolIndex, isSpinning, reelIndex }: { symbols: ElementType[], finalSymbolIndex: number, isSpinning: boolean, reelIndex: number }) => {
  const reelRef = useRef<HTMLDivElement>(null);
  const symbolHeight = 64; // h-16

  const extendedSymbols = useMemo(() => {
    const arr = [...symbols, ...symbols, ...symbols];
    // Ensure the final symbol is at the correct position for the animation
    const finalSymbol = arr[finalSymbolIndex + symbols.length];
    arr[symbols.length] = finalSymbol;
    return arr;
  }, [symbols, finalSymbolIndex]);
  
  const spinDuration = 1000 + reelIndex * 100 + Math.random() * 200;

  useEffect(() => {
    const reelElement = reelRef.current;
    if (!reelElement) return;

    if (isSpinning) {
      reelElement.style.transition = `transform ${spinDuration / 1000}s cubic-bezier(0.25, 1, 0.5, 1)`;
      const targetPosition = -(symbols.length * symbolHeight * 2 + finalSymbolIndex * symbolHeight);
      reelElement.style.transform = `translateY(${targetPosition}px)`;
    } else {
      reelElement.style.transition = 'none';
      const resetPosition = -(finalSymbolIndex * symbolHeight);
      reelElement.style.transform = `translateY(${resetPosition}px)`;
      
      setTimeout(() => {
          if(reelElement) reelElement.style.transition = `transform ${spinDuration/1000}s cubic-bezier(0.25, 1, 0.5, 1)`;
      }, 50)
    }
  }, [isSpinning, finalSymbolIndex, symbolHeight, symbols.length, spinDuration, reelIndex]);


  return (
    <div className="h-16 w-16 overflow-hidden bg-card/50 rounded-lg border-2 border-primary/50">
      <div ref={reelRef} className="flex flex-col items-center justify-center">
        {extendedSymbols.map((Symbol, index) => (
          <Symbol key={index} className="h-16 w-16 shrink-0 p-2 text-primary" />
        ))}
      </div>
    </div>
  );
};

export default function SlotMachine() {
  const [grid, setGrid] = useState<number[][]>(Array(5).fill(Array(5).fill(0)));
  const [spinning, setSpinning] = useState(false);
  const [winnings, setWinnings] = useState<number | null>(null);
  const [freeSpins, setFreeSpins] = useState(0);
  const { balance, setBalance } = useBalance();

  const { toast } = useToast();
  const betAmount = 5;

  const spin = (isFreeSpin = false) => {
    if (!isFreeSpin && balance < betAmount) {
      toast({ title: "Not enough balance", variant: "destructive" });
      return;
    }
    if (!isFreeSpin) {
      setBalance(balance - betAmount);
    } else {
      setFreeSpins(prev => prev - 1);
    }

    setWinnings(null);
    setSpinning(true);
    
    const newGrid = Array(5).fill(0).map(() => 
        Array(5).fill(0).map(() => Math.floor(Math.random() * allSymbols.length))
    );

    setTimeout(() => {
      setGrid(newGrid);
      checkWin(newGrid, isFreeSpin);
      setTimeout(() => setSpinning(false), 2000); 
    }, 100);
  };

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
    if (freeSpins > 0 && !spinning) {
      const timer = setTimeout(() => spin(true), 1000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeSpins, spinning]);

  const checkWin = (finalGrid: number[][], isFreeSpin: boolean) => {
    let totalWinnings = 0;
    let winFound = false;

    // Check for scatter symbols
    const scatterCount = finalGrid.flat().filter(symbolIndex => symbolIndex === allSymbols.indexOf(scatterSymbol)).length;
    if (scatterCount >= 3) {
        toast({ title: "Free Spins Triggered!", description: "You won 10 free spins."});
        setFreeSpins(prev => prev + 10);
        winFound = true;
    }

    // Basic win condition: 3 or more of the same symbol in a row (horizontally)
    finalGrid.forEach(row => {
        for (let i = 0; i <= row.length - 3; i++) {
            if (row[i] !== allSymbols.indexOf(scatterSymbol) && row[i] === row[i+1] && row[i] === row[i+2]) {
                const winAmount = betAmount * payoutMultiplier;
                totalWinnings += winAmount;
                winFound = true;
            }
        }
    });

    if (totalWinnings > 0) {
      setWinnings(totalWinnings);
      setBalance(prev => prev + totalWinnings);
      toast({ title: `You Won!`, description: `You won ${totalWinnings} credits!` });
    } else if (!winFound && !isFreeSpin) {
       toast({ title: "Try Again!", description: "No win this time.", duration: 2000 });
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className={cn(
          "grid grid-cols-5 gap-2 p-4 rounded-xl bg-card border-4 border-primary shadow-2xl shadow-primary/20",
           winnings !== null && "animate-pulse"
        )}>
        {grid.map((row, rowIndex) => 
            row.map((symbolIndex, colIndex) => {
                const finalSymbol = allSymbols[symbolIndex];
                 return <div key={`${rowIndex}-${colIndex}`} className="h-16 w-16 flex items-center justify-center bg-card/50 rounded-lg border-2 border-primary/50">
                    <finalSymbol className="h-full w-full p-2 text-primary" />
                </div>
            })
        )}
      </div>

       {winnings !== null && (
        <div className="text-3xl font-bold text-accent animate-bounce">
          + {winnings} Credits!
        </div>
      )}

      {freeSpins > 0 && (
          <div className="text-2xl font-bold text-primary">
              Free Spins Remaining: {freeSpins}
          </div>
      )}

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="text-xl w-full text-center p-2 bg-card rounded-md">
          Balance: <span className="font-bold text-primary">{balance.toFixed(2)} Credits</span>
        </div>
        <div className="flex gap-2 w-full">
            <Button onClick={() => spin(false)} disabled={spinning || freeSpins > 0} size="lg" className="w-full h-16 text-xl bg-primary text-primary-foreground hover:bg-primary/90">
                {spinning ? 'Spinning...' : `Spin for ${betAmount} Credits`}
                {!spinning && <Play className="ml-2"/>}
            </Button>
             <Button onClick={buyBonus} disabled={spinning || freeSpins > 0} size="lg" variant="outline" className="h-16 text-md border-accent text-accent hover:bg-accent/20">
                <Gift className="mr-2"/> Buy Bonus (${bonusBuyCost})
            </Button>
        </div>
      </div>
    </div>
  );
}
