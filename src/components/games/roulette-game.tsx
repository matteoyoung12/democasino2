"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Circle, Play } from 'lucide-react';

const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
const redNumbers = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3];

const getNumberColor = (num: number) => {
  if (num === 0) return 'bg-green-600';
  return redNumbers.includes(num) ? 'bg-red-600' : 'bg-black';
};

type BetType = 'number';
type Bet = {
  type: BetType;
  value: number;
  amount: number;
};

export default function RouletteGame() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);

  const { toast } = useToast();

  const placeBet = (type: BetType, value: number) => {
    if (spinning) return;
    if (balance < betAmount) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }
    setBalance(prev => prev - betAmount);
    setBets(prev => {
      const existingBet = prev.find(b => b.type === type && b.value === value);
      if (existingBet) {
        return prev.map(b => b.type === type && b.value === value ? { ...b, amount: b.amount + betAmount } : b);
      }
      return [...prev, { type, value, amount: betAmount }];
    });
  };

  const spinWheel = useCallback(() => {
    if (bets.length === 0) {
      toast({ title: 'No bets placed', description: 'Please place a bet before spinning.' });
      return;
    }
    setSpinning(true);
    setWinningNumber(null);
    setDisplayNumber(null);

    let spinCount = 0;
    const interval = setInterval(() => {
      const randomNum = numbers[Math.floor(Math.random() * numbers.length)];
      setDisplayNumber(randomNum);
      spinCount++;
      if (spinCount > 30) { // Simulate spinning for ~3 seconds
        clearInterval(interval);
        const finalNumber = numbers[Math.floor(Math.random() * numbers.length)];
        setWinningNumber(finalNumber);
        setDisplayNumber(finalNumber);
      }
    }, 100);
  }, [bets.length, toast]);

  useEffect(() => {
    if (winningNumber !== null) {
      let winnings = 0;
      let totalBetAmount = 0;
      bets.forEach(bet => {
        totalBetAmount += bet.amount;
        if (bet.type === 'number' && bet.value === winningNumber) {
          winnings += bet.amount * 35;
        }
      });

      if (winnings > 0) {
        setBalance(prev => prev + winnings + totalBetAmount);
        toast({ title: 'You Win!', description: `Won ${winnings.toFixed(2)} credits on number ${winningNumber}.` });
      } else {
        toast({ title: 'You Lose', description: `The winning number was ${winningNumber}.`, variant: 'destructive' });
      }
      
      setTimeout(() => {
        setBets([]);
        setSpinning(false);
      }, 2000);
    }
  }, [winningNumber, bets, toast]);


  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <div className="relative flex items-center justify-center w-48 h-48 rounded-full border-4 border-primary shadow-lg">
        <Circle className={cn("absolute w-full h-full text-card animate-spin", spinning ? "duration-500" : "duration-[20s]")}/>
        <div className={cn("absolute w-40 h-40 rounded-full flex items-center justify-center text-5xl font-bold text-white", displayNumber !== null ? getNumberColor(displayNumber) : 'bg-card')}>
          {displayNumber !== null ? displayNumber : '?'}
        </div>
      </div>
      
      <div className="p-4 rounded-lg bg-card w-full">
        <div className="grid grid-cols-12 gap-1">
          {numbers.slice(1).map(num => (
            <button key={num} onClick={() => placeBet('number', num)} disabled={spinning} className={cn("h-12 w-full rounded-md text-white font-bold flex items-center justify-center relative transition-transform hover:scale-105", getNumberColor(num))}>
              {num}
              {bets.find(b => b.value === num) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/70 border-2 border-primary-foreground text-primary-foreground text-xs flex items-center justify-center">{bets.find(b => b.value === num)?.amount}</div>}
            </button>
          ))}
        </div>
         <button onClick={() => placeBet('number', 0)} disabled={spinning} className={cn("mt-1 h-12 w-1/4 rounded-md text-white font-bold flex items-center justify-center relative transition-transform hover:scale-105", getNumberColor(0))}>
            0
            {bets.find(b => b.value === 0) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/70 border-2 border-primary-foreground text-primary-foreground text-xs flex items-center justify-center">{bets.find(b => b.value === 0)?.amount}</div>}
          </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full p-4 bg-card rounded-lg">
        <div className="text-lg">Balance: <span className="font-bold text-primary">{balance.toFixed(2)}</span></div>
        <div className="flex-grow" />
        <div className="flex items-center gap-2">
            <span className="text-lg">Bet:</span>
            {[1, 5, 10, 25, 100].map(amount => (
                <Button key={amount} variant={betAmount === amount ? 'secondary' : 'outline'} onClick={() => setBetAmount(amount)} disabled={spinning} className={betAmount === amount ? 'bg-primary' : ''}>
                    {amount}
                </Button>
            ))}
        </div>
        <Button onClick={spinWheel} disabled={spinning || bets.length === 0} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Play className="mr-2 h-5 w-5"/>
          Spin
        </Button>
      </div>
    </div>
  );
}
