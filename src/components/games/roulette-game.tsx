
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';

const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
const redNumbers = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3];
const blackNumbers = numbers.filter(n => n !== 0 && !redNumbers.includes(n));

const getNumberColorClass = (num: number) => {
  if (num === 0) return 'bg-green-600 text-white';
  return redNumbers.includes(num) ? 'bg-red-600 text-white' : 'bg-black text-white';
};

const numberPositions: { [key: number]: { angle: number } } = {};
numbers.forEach((num, index) => {
    numberPositions[num] = { angle: (index / numbers.length) * 360 };
});

type BetType = 'number' | 'red' | 'black' | 'even' | 'odd';
type BetValue = number | 'red' | 'black' | 'even' | 'odd';

type Bet = {
  type: BetType;
  value: BetValue;
  amount: number;
};

const betOptions: {type: BetType, value: BetValue, label: string, payout: number, className: string}[] = [
    { type: 'even', value: 'even', label: 'Even', payout: 2, className: 'bg-zinc-700' },
    { type: 'red', value: 'red', label: 'Red', payout: 2, className: 'bg-red-600' },
    { type: 'black', value: 'black', label: 'Black', payout: 2, className: 'bg-black' },
    { type: 'odd', value: 'odd', label: 'Odd', payout: 2, className: 'bg-zinc-700' },
]

export default function RouletteGame() {
  const [bets, setBets] = useState<Bet[]>([]);
  const { balance, setBalance } = useBalance();
  const [chipAmount, setChipAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const { toast } = useToast();

  const placeBet = (type: BetType, value: BetValue) => {
    if (spinning) return;
    if (balance < chipAmount) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }
    setBalance(prev => prev - chipAmount);
    setBets(prev => {
      const existingBet = prev.find(b => b.type === type && b.value === value);
      if (existingBet) {
        return prev.map(b => b.type === type && b.value === value ? { ...b, amount: b.amount + chipAmount } : b);
      }
      return [...prev, { type, value, amount: chipAmount }];
    });
  };
  
  const getBetAmount = (type: BetType, value: BetValue) => {
    return bets.find(b => b.type === type && b.value === value)?.amount;
  }

  const spinWheel = useCallback(() => {
    if (bets.length === 0) {
      toast({ title: 'No bets placed', description: 'Please place a bet before spinning.' });
      return;
    }
    setSpinning(true);
    setWinningNumber(null);
    
    const finalNumber = numbers[Math.floor(Math.random() * numbers.length)];
    const finalAngle = numberPositions[finalNumber].angle;
    const fullSpins = 5 * 360;
    const newRotation = wheelRotation + fullSpins + (360 - (wheelRotation % 360) - finalAngle);
    
    setWheelRotation(newRotation);

    setTimeout(() => {
        setWinningNumber(finalNumber);
    }, 5000); // Corresponds to animation duration

  }, [bets.length, toast, wheelRotation]);

  useEffect(() => {
    if (winningNumber !== null) {
      let totalWinnings = 0;
      
      bets.forEach(bet => {
        let isWin = false;
        let payout = 0;

        switch (bet.type) {
            case 'number':
                if (bet.value === winningNumber) { isWin = true; payout = 36; }
                break;
            case 'red':
                if (redNumbers.includes(winningNumber)) { isWin = true; payout = 2; }
                break;
            case 'black':
                if (blackNumbers.includes(winningNumber)) { isWin = true; payout = 2; }
                break;
            case 'even':
                if (winningNumber !== 0 && winningNumber % 2 === 0) { isWin = true; payout = 2; }
                break;
            case 'odd':
                if (winningNumber % 2 !== 0) { isWin = true; payout = 2; }
                break;
        }

        if (isWin) {
            totalWinnings += bet.amount * payout;
        }
      });

      if (totalWinnings > 0) {
        setBalance(prev => prev + totalWinnings);
        toast({ title: 'You Win!', description: `Won ${totalWinnings.toFixed(2)} credits. The number was ${winningNumber}.` });
      } else {
        toast({ title: 'You Lose', description: `The winning number was ${winningNumber}.`, variant: 'destructive' });
      }
      
      setTimeout(() => {
        setBets([]);
        setSpinning(false);
      }, 3000);
    }
  }, [winningNumber, bets, toast, setBalance]);


  return (
    <div className="flex flex-col items-center gap-8 w-full">
        <div 
          className="w-80 h-80 bg-gray-800 rounded-full flex items-center justify-center transition-transform duration-5000 ease-out"
          style={{ transform: `rotate(${wheelRotation}deg)` }}
        >
            <div className="relative w-full h-full">
                {numbers.map((num, i) => (
                    <div
                        key={num}
                        className="absolute w-full h-full"
                        style={{ transform: `rotate(${(i / numbers.length) * 360}deg)` }}
                    >
                        <div
                            className={cn(
                                'absolute top-0 left-1/2 -ml-4 w-8 h-12 text-center text-white flex items-center justify-center font-bold',
                                getNumberColorClass(num)
                            )}
                        >
                            {num}
                        </div>
                    </div>
                ))}
            </div>
             <div className="absolute w-12 h-12 bg-gray-600 rounded-full border-4 border-gray-400" />
        </div>
         {winningNumber !== null && !spinning && (
            <div className="text-2xl font-bold p-4">Winning Number: <span className={cn('p-2 rounded', getNumberColorClass(winningNumber))}>{winningNumber}</span></div>
        )}

      
      <div className="p-4 rounded-lg bg-card w-full">
        <div className="grid grid-cols-12 gap-1">
          {numbers.filter(n => n !== 0).sort((a,b) => a-b).map(num => (
            <button key={num} onClick={() => placeBet('number', num)} disabled={spinning} className={cn("h-12 w-full rounded-md font-bold flex items-center justify-center relative transition-transform hover:scale-105", getNumberColorClass(num))}>
              {num}
              {getBetAmount('number', num) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/70 border-2 border-primary-foreground text-primary-foreground text-xs flex items-center justify-center">{getBetAmount('number', num)}</div>}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mt-1">
             <button onClick={() => placeBet('number', 0)} disabled={spinning} className={cn("h-12 w-full rounded-md font-bold flex items-center justify-center relative transition-transform hover:scale-105", getNumberColorClass(0))}>
                0
                {getBetAmount('number', 0) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/70 border-2 border-primary-foreground text-primary-foreground text-xs flex items-center justify-center">{getBetAmount('number', 0)}</div>}
            </button>
            <div className="col-span-2 grid grid-cols-2 gap-1">
              {betOptions.map(opt => (
                <button key={opt.label} onClick={() => placeBet(opt.type, opt.value)} disabled={spinning} className={cn("h-12 w-full rounded-md text-white font-bold flex items-center justify-center relative transition-transform hover:scale-105", opt.className)}>
                    {opt.label}
                    {getBetAmount(opt.type, opt.value) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/70 border-2 border-primary-foreground text-primary-foreground text-xs flex items-center justify-center">{getBetAmount(opt.type, opt.value)}</div>}
                </button>
              ))}
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full p-4 bg-card rounded-lg">
        <div className="text-lg">Balance: <span className="font-bold text-primary">{balance.toFixed(2)}</span></div>
        <div className="flex-grow" />
        <div className="flex items-center gap-2">
            <span className="text-lg">Chip:</span>
            {[1, 5, 10, 25, 100].map(amount => (
                <Button key={amount} variant={chipAmount === amount ? 'secondary' : 'outline'} onClick={() => setChipAmount(amount)} disabled={spinning} className={chipAmount === amount ? 'bg-primary' : ''}>
                    {amount}
                </Button>
            ))}
        </div>
        <Button onClick={spinWheel} disabled={spinning || bets.length === 0} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Play className="mr-2 h-5 w-5"/>
          Spin
        </Button>
      </div>
       <style jsx>{`
        .duration-5000 {
            transition-duration: 5000ms;
        }
      `}</style>
    </div>
  );
}
