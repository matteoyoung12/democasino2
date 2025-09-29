"use client";

import { useState, useEffect, useRef, useMemo, type ElementType } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Apple, Gem, Star, DollarSign, Heart, Banana, Play } from 'lucide-react';

const symbols: ElementType[] = [Apple, Gem, Star, DollarSign, Heart, Banana];

const Reel = ({ symbols, finalSymbolIndex, isSpinning }: { symbols: ElementType[], finalSymbolIndex: number, isSpinning: boolean }) => {
  const reelRef = useRef<HTMLDivElement>(null);
  const symbolHeight = 128; // h-32

  useEffect(() => {
    if (isSpinning) {
      if (reelRef.current) {
        reelRef.current.style.transition = 'transform 0s';
        reelRef.current.style.transform = 'translateY(0)';
      }
    } else {
      if (reelRef.current) {
        const targetPosition = -(finalSymbolIndex * symbolHeight);
        reelRef.current.style.transition = `transform ${2 + Math.random()}s cubic-bezier(0.25, 1, 0.5, 1)`;
        reelRef.current.style.transform = `translateY(${targetPosition}px)`;
      }
    }
  }, [isSpinning, finalSymbolIndex, symbolHeight]);

  const extendedSymbols = useMemo(() => [...symbols, ...symbols, ...symbols], [symbols]);

  return (
    <div className="h-32 w-32 overflow-hidden bg-card/50 rounded-lg border-2 border-primary/50">
      <div ref={reelRef} className="flex flex-col items-center justify-center">
        {extendedSymbols.map((Symbol, index) => (
          <Symbol key={index} className="h-32 w-32 shrink-0 p-4 text-accent" />
        ))}
      </div>
    </div>
  );
};

export default function SlotMachine() {
  const [reels, setReels] = useState<number[][]>([[0,1,2],[3,4,5],[0,2,4]]);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [winnings, setWinnings] = useState<number | null>(null);

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

    setTimeout(() => {
      const newReels = reels.map(reel => reel.map(() => Math.floor(Math.random() * symbols.length)));
      setReels(newReels);
      setSpinning(false);
      checkWin(newReels[1]); // Check win on middle row
    }, 100);
  };

  const checkWin = (middleRow: number[]) => {
    const isWin = middleRow.every(symbolIndex => symbolIndex === middleRow[0]);
    if (isWin) {
      const winAmount = betAmount * 10;
      setWinnings(winAmount);
      setBalance(prev => prev + winAmount);
      toast({ title: `You Won!`, description: `You won ${winAmount} credits!` });
    } else {
      toast({ title: "Try Again!", description: "No win this time." });
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className={cn(
          "grid grid-cols-3 gap-4 p-6 rounded-xl bg-card border-4 border-accent shadow-2xl shadow-primary/20",
          winnings !== null && "animate-pulse"
        )}>
        {reels.map((reelSymbols, reelIndex) => (
          <div key={reelIndex} className="flex flex-col gap-4">
            {/* We only render the middle reel for visual effect, but logic uses 3x3 */}
            <Reel symbols={symbols} finalSymbolIndex={reelSymbols[1]} isSpinning={spinning} />
          </div>
        ))}
      </div>
      
      {winnings !== null && (
        <div className="text-3xl font-bold text-accent animate-bounce">
          + {winnings} Credits!
        </div>
      )}

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="text-xl w-full text-center p-2 bg-card rounded-md">
          Balance: <span className="font-bold text-accent">{balance} Credits</span>
        </div>
        <Button onClick={spin} disabled={spinning} size="lg" className="w-full h-16 text-xl bg-accent text-accent-foreground hover:bg-accent/90">
            {spinning ? 'Spinning...' : `Spin for ${betAmount} Credits`}
            {!spinning && <Play className="ml-2"/>}
        </Button>
      </div>
    </div>
  );
}
