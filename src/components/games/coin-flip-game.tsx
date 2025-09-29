
"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Coins, Play, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useBalance } from '@/contexts/BalanceContext';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';


export default function CoinFlipGame() {
  const { language } = useLanguage();
  const t = translations[language];

  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [betAmount, setBetAmount] = useState(10);
  const { balance, setBalance } = useBalance();
  const { toast } = useToast();

  const handleFlip = useCallback(() => {
    if (balance < betAmount) {
      toast({ title: t.insufficientBalance, variant: 'destructive' });
      return;
    }

    setIsFlipping(true);
    setResult(null);
    setBalance(prev => prev - betAmount);

    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const resultText = flipResult === 'heads' ? t.heads : t.tails;

    setTimeout(() => {
      setResult(flipResult);
      setIsFlipping(false);

      if (flipResult === choice) {
        const winnings = betAmount * 1.95; // 97.5% return
        setBalance(prev => prev + winnings);
        toast({ title: `${t.youWon}! ${t.itWas} ${resultText}.`, description: `${t.youWonAmount} ${winnings.toFixed(2)} ${t.credits}.` });
      } else {
        toast({ title: `${t.youLost}! ${t.itWas} ${resultText}.`, variant: 'destructive' });
      }
    }, 2000); // Animation duration
  }, [betAmount, balance, choice, toast, setBalance, t]);

  return (
    <div className="flex flex-col items-center gap-8 w-full">
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center">{t.coinFlipTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className="relative w-48 h-48">
                    <div className={cn("absolute w-full h-full rounded-full transition-transform duration-1000 preserve-3d", isFlipping && "animate-flip")}
                         style={{ transformStyle: 'preserve-3d' }}>
                        <div className="absolute w-full h-full rounded-full bg-primary flex items-center justify-center backface-hidden">
                            <Coins className="h-24 w-24 text-primary-foreground" />
                        </div>
                        <div className="absolute w-full h-full rounded-full bg-accent flex items-center justify-center my-rotate-y-180 backface-hidden">
                            <span className="text-4xl font-bold text-accent-foreground">?</span>
                        </div>
                    </div>
                </div>

                {result && !isFlipping && (
                    <p className="text-2xl font-bold">
                        {t.result}: <span className="capitalize text-primary">{result === 'heads' ? t.heads : t.tails}</span>
                    </p>
                )}

                <div className="grid gap-4 w-full max-w-sm">
                    <>
                        <div className="grid gap-2">
                            <Label>{t.yourChoice}</Label>
                            <ToggleGroup type="single" value={choice} onValueChange={(value: 'heads' | 'tails') => value && setChoice(value)} disabled={isFlipping}>
                                <ToggleGroupItem value="heads" aria-label="Toggle heads" className="w-full">{t.heads}</ToggleGroupItem>
                                <ToggleGroupItem value="tails" aria-label="Toggle tails" className="w-full">{t.tails}</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="bet-amount"><Wallet className="inline-block mr-2" />{t.betAmount}</Label>
                            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={isFlipping} />
                        </div>
                        <Button onClick={handleFlip} disabled={isFlipping} size="lg" className="w-full h-14 text-xl">
                            {isFlipping ? t.flipping : t.flipCoin}
                            {!isFlipping && <Play className="ml-2"/>}
                        </Button>
                    </>
                </div>
            </CardContent>
             <CardFooter className="flex-col items-center gap-2">
                <p>{t.payout}: <span className="font-bold text-primary">1.95x</span></p>
                <p>{t.balance}: <span className="font-bold text-primary">{balance.toFixed(2)} {t.credits}</span></p>
            </CardFooter>
        </Card>
        <style jsx>{`
            .preserve-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .my-rotate-y-180 { transform: rotateY(180deg); }
            @keyframes flip {
                0% { transform: rotateY(0); }
                100% { transform: rotateY(1800deg); }
            }
            .animate-flip {
                animation: flip 2s cubic-bezier(0.45, 0, 0.55, 1);
            }
        `}</style>
    </div>
  );
}
