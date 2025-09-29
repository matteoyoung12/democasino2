
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

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

export default function RouletteGame() {
  const { language } = useLanguage();
  const t = translations[language];

  const betOptions: {type: BetType, value: BetValue, label: string, payout: number, className: string}[] = [
    { type: 'even', value: 'even', label: t.even, payout: 2, className: 'bg-zinc-700' },
    { type: 'red', value: 'red', label: t.red, payout: 2, className: 'bg-red-600' },
    { type: 'black', value: 'black', label: t.black, payout: 2, className: 'bg-black' },
    { type: 'odd', value: 'odd', label: t.odd, payout: 2, className: 'bg-zinc-700' },
  ]

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
      toast({ title: t.insufficientBalance, variant: 'destructive' });
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
      toast({ title: t.noBetsPlaced, description: t.placeBetBeforeSpin });
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

  }, [bets.length, toast, wheelRotation, t]);

  useEffect(() => {
    if (winningNumber === null || spinning === false) return;
    
    let totalWinnings = 0;
    
    bets.forEach(bet => {
      let winThisBet = false;
      let payout = 0;

      switch (bet.type) {
          case 'number':
              if (bet.value === winningNumber) { winThisBet = true; payout = 36; }
              break;
          case 'red':
              if (redNumbers.includes(winningNumber)) { winThisBet = true; payout = 2; }
              break;
          case 'black':
              if (blackNumbers.includes(winningNumber)) { winThisBet = true; payout = 2; }
              break;
          case 'even':
              if (winningNumber !== 0 && winningNumber % 2 === 0) { winThisBet = true; payout = 2; }
              break;
          case 'odd':
              if (winningNumber % 2 !== 0) { winThisBet = true; payout = 2; }
              break;
      }

      if (winThisBet) {
          totalWinnings += bet.amount * payout;
      }
    });

    if (totalWinnings > 0) {
      setBalance(prev => prev + totalWinnings);
      toast({ title: t.youWin, description: `${t.won} ${totalWinnings.toFixed(2)} ${t.credits}. ${t.theNumberWas} ${winningNumber}.` });
    } else {
      toast({ title: t.youLose, description: `${t.theWinningNumberWas} ${winningNumber}.`, variant: 'destructive' });
    }
    
    setTimeout(() => {
      setBets([]);
      setSpinning(false);
    }, 3000);
  }, [winningNumber, spinning, bets, setBalance, toast, t]);


  return (
    <div className="flex flex-col items-center gap-8 w-full">
        <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary z-10" />
            <div 
            className="w-80 h-80 rounded-full flex items-center justify-center transition-transform duration-5000 ease-out border-8 border-yellow-800 bg-yellow-900 shadow-2xl"
            style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
                <div className="relative w-full h-full border-4 border-gray-700 rounded-full">
                    {numbers.map((num, i) => (
                        <div
                            key={num}
                            className="absolute w-full h-full"
                            style={{ transform: `rotate(${(i / numbers.length) * 360}deg)` }}
                        >
                            <div
                                className={cn(
                                    'absolute top-0 left-1/2 w-8 h-[150px] text-center text-white flex items-start justify-center font-bold origin-center transform -translate-x-1/2',
                                )}
                            >
                                <span className={cn(
                                    'block transform rotate-[6deg] mt-2 px-1 rounded-sm', 
                                    getNumberColorClass(num)
                                )}>
                                    {num}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="absolute w-20 h-20 bg-gray-600 rounded-full border-4 border-gray-400" />
            </div>
        </div>
         {winningNumber !== null && !spinning && (
            <div className="text-2xl font-bold p-4">{t.winningNumber}: <span className={cn('p-2 rounded', getNumberColorClass(winningNumber))}>{winningNumber}</span></div>
        )}

      
      <div className="p-4 rounded-lg bg-card w-full">
            <>
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
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full p-4 bg-card rounded-lg mt-4">
                    <div className="text-lg">{t.balance}: <span className="font-bold text-primary">{balance.toFixed(2)}</span></div>
                    <div className="flex-grow" />
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{t.chip}:</span>
                        {[1, 5, 10, 25, 100].map(amount => (
                            <Button key={amount} variant={chipAmount === amount ? 'secondary' : 'outline'} onClick={() => setChipAmount(amount)} disabled={spinning} className={chipAmount === amount ? 'bg-primary' : ''}>
                                {amount}
                            </Button>
                        ))}
                    </div>
                    <Button onClick={spinWheel} disabled={spinning || bets.length === 0} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Play className="mr-2 h-5 w-5"/>
                    {t.spin}
                    </Button>
                </div>
            </>
      </div>

       <style jsx>{`
        .duration-5000 {
            transition-duration: 5000ms;
        }
      `}</style>
    </div>
  );
}
