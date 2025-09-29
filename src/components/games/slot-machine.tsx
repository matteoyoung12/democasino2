
"use client";

import { useState, useEffect, useRef, useMemo, type ElementType } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Apple, Gem, Star, DollarSign, Heart, Banana, Play } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';

const symbols: ElementType[] = [Apple, Gem, Star, DollarSign, Heart, Banana];
const payoutMultiplier = 10;

const Reel = ({ symbols, finalSymbolIndex, isSpinning, reelIndex }: { symbols: ElementType[], finalSymbolIndex: number, isSpinning: boolean, reelIndex: number }) => {
  const reelRef = useRef<HTMLDivElement>(null);
  const symbolHeight = 128; // h-32

  const extendedSymbols = useMemo(() => {
    const arr = [...symbols, ...symbols, ...symbols];
    // Ensure the final symbol is at the correct position for the animation
    const finalSymbol = arr[finalSymbolIndex + symbols.length];
    arr[symbols.length] = finalSymbol;
    return arr;
  }, [symbols, finalSymbolIndex]);
  
  const spinDuration = 1000 + reelIndex * 300 + Math.random() * 300; // Staggered stop

  useEffect(() => {
    const reelElement = reelRef.current;
    if (!reelElement) return;

    if (isSpinning) {
      reelElement.style.transition = `transform ${spinDuration / 1000}s cubic-bezier(0.25, 1, 0.5, 1)`;
      // Spin to a random high number to simulate spinning
      const targetPosition = -(symbols.length * symbolHeight * (2 + reelIndex) + finalSymbolIndex * symbolHeight);
      reelElement.style.transform = `translateY(${targetPosition}px)`;
    } else {
      // On load or reset, snap to the final position without animation
      reelElement.style.transition = 'none';
      const resetPosition = -(finalSymbolIndex * symbolHeight);
      reelElement.style.transform = `translateY(${resetPosition}px)`;
      
      // A trick to re-enable animation after the initial render
      setTimeout(() => {
          if(reelElement) reelElement.style.transition = `transform ${spinDuration/1000}s cubic-bezier(0.25, 1, 0.5, 1)`;
      }, 50)
    }
  }, [isSpinning, finalSymbolIndex, symbolHeight, symbols.length, spinDuration, reelIndex]);


  return (
    <div className="h-32 w-32 overflow-hidden bg-card/50 rounded-lg border-2 border-primary/50">
      <div ref={reelRef} className="flex flex-col items-center justify-center">
        {extendedSymbols.map((Symbol, index) => (
          <Symbol key={index} className="h-32 w-32 shrink-0 p-4 text-primary" />
        ))}
      </div>
    </div>
  );
};

export default function SlotMachine() {
  const [reels, setReels] = useState<number[]>([0,1,2]);
  const [spinning, setSpinning] = useState(false);
  const [winnings, setWinnings] = useState<number | null>(null);
  const { balance, setBalance } = useBalance();

  const { toast } = useToast();
  const betAmount = 5;

  const spin = () => {
    if (balance < betAmount) {
      toast({ title: "Not enough balance", variant: "destructive" });
      return;
    }
    setBalance(balance - betAmount);
    setWinnings(null);
    setSpinning(true);
    
    // Generate final reel positions
    const newReels = reels.map(() => Math.floor(Math.random() * symbols.length));

    setTimeout(() => {
      setReels(newReels);
      checkWin(newReels);
      // Let the animation run
      setTimeout(() => setSpinning(false), 2000); 
    }, 100);
  };

  const checkWin = (finalReels: number[]) => {
    const isWin = finalReels.every(symbolIndex => symbolIndex === finalReels[0]);
    if (isWin) {
      const winAmount = betAmount * payoutMultiplier;
      setWinnings(winAmount);
      setBalance(prev => prev + winAmount);
      toast({ title: `You Won!`, description: `You won ${winAmount} credits!` });
    } else {
       toast({ title: "Try Again!", description: "No win this time.", duration: 2000 });
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className={cn(
          "grid grid-cols-3 gap-4 p-6 rounded-xl bg-card border-4 border-primary shadow-2xl shadow-primary/20",
          winnings !== null && "animate-pulse"
        )}>
        {reels.map((finalSymbolIndex, reelIndex) => (
            <Reel key={reelIndex} reelIndex={reelIndex} symbols={symbols} finalSymbolIndex={finalSymbolIndex} isSpinning={spinning} />
        ))}
      </div>
      
      {winnings !== null && (
        <div className="text-3xl font-bold text-accent animate-bounce">
          + {winnings} Credits!
        </div>
      )}

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="text-xl w-full text-center p-2 bg-card rounded-md">
          Balance: <span className="font-bold text-primary">{balance.toFixed(2)} Credits</span>
        </div>
        <Button onClick={spin} disabled={spinning} size="lg" className="w-full h-16 text-xl bg-primary text-primary-foreground hover:bg-primary/90">
            {spinning ? 'Spinning...' : `Spin for ${betAmount} Credits`}
            {!spinning && <Play className="ml-2"/>}
        </Button>
      </div>
    </div>
  );
}
