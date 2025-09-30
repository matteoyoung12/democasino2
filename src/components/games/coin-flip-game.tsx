
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, PiggyBank, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBalance } from '@/contexts/BalanceContext';
import { translations } from '@/lib/translations';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

type GameState = 'betting' | 'playing' | 'flipping' | 'busted';
type Choice = 'left' | 'right' | null;

const MAX_ROUNDS = 10;

const calculateMultiplier = (round: number): number => {
  if (round === 0) return 1.0;
  return parseFloat((1.9 * Math.pow(2, round - 1)).toFixed(1));
};

const Coin = ({ side, isFlipping }: { side: 'left' | 'right', isFlipping: boolean }) => (
    <div className={cn("relative w-32 h-32 preserve-3d", isFlipping && "animate-flip")}>
        <div className="absolute w-full h-full backface-hidden rounded-full border-4 flex items-center justify-center bg-blue-500 border-blue-500">
            <span className="text-4xl font-bold text-blue-400">Blat</span>
        </div>
        <div className="absolute w-full h-full backface-hidden rounded-full border-4 flex items-center justify-center bg-red-500 border-red-500 transform-rotate-y-180">
            <span className="text-4xl font-bold text-red-400">Fam</span>
        </div>
    </div>
);


export default function UpXGame() {
  const t = translations.ru; 

  const [gameState, setGameState] = useState<GameState>('betting');
  const [betAmount, setBetAmount] = useState(1.00);
  const [currentRound, setCurrentRound] = useState(0);
  const [winSide, setWinSide] = useState<'left' | 'right'>('left');
  
  const { balance, setBalance } = useBalance();
  const { toast } = useToast();

  const multipliers = useMemo(() => {
    return Array.from({ length: MAX_ROUNDS }, (_, i) => calculateMultiplier(i + 1));
  }, []);

  const currentMultiplier = useMemo(() => {
    if (currentRound === 0) return 1;
    return multipliers[currentRound - 1] || 1;
  }, [currentRound, multipliers]);
  
  const currentWinnings = betAmount * currentMultiplier;

  const startGame = () => {
    if (betAmount <= 0) {
      toast({ title: "Сумма ставки должна быть положительной", variant: 'destructive' });
      return;
    }
    if (balance < betAmount) {
      toast({ title: t.insufficientBalance, variant: 'destructive' });
      return;
    }

    setBalance(prev => prev - betAmount);
    setGameState('playing');
    setCurrentRound(0);
    setNewWinSide();
  };
  
  const setNewWinSide = () => {
    setWinSide(Math.random() < 0.5 ? 'left' : 'right');
  }

  const handleChoice = (choice: 'left' | 'right') => {
    if (gameState !== 'playing') return;

    setGameState('flipping');

    setTimeout(() => {
      if (choice === winSide) {
        // Win
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setNewWinSide();
        setGameState('playing');
        if (nextRound >= MAX_ROUNDS) {
            handleCashout(true);
        }
      } else {
        // Lose
        setGameState('busted');
        toast({
          title: "Проигрыш!",
          description: "В этот раз не повезло.",
          variant: 'destructive',
        });
      }
    }, 2000); // Duration of the flip animation
  };
  
  const handleCashout = useCallback((isAuto = false) => {
    if (gameState !== 'playing' || currentRound === 0) return;

    setBalance(prev => prev + currentWinnings);
    toast({
        title: "Выигрыш!",
        description: `Вы выиграли ${currentWinnings.toFixed(2)} ₽.`,
    });
    setGameState('busted');
  }, [gameState, currentRound, setBalance, currentWinnings, toast]);

  const quickBet = (action: 'half' | 'double' | number) => {
    if (typeof action === 'number') {
        setBetAmount(prev => prev + action);
    } else if (action === 'half') {
        setBetAmount(prev => Math.max(0.01, parseFloat((prev / 2).toFixed(2))));
    } else if (action === 'double') {
        setBetAmount(prev => parseFloat((prev * 2).toFixed(2)));
    }
  }

  const MainButton = () => {
      if (gameState === 'playing' || gameState === 'flipping') {
          return (
             <Button onClick={() => handleCashout()} disabled={currentRound === 0 || gameState === 'flipping'} size="lg" className="h-16 w-full text-xl bg-green-500 hover:bg-green-600">
                <PiggyBank className="mr-2" /> 
                <span>
                    Забрать
                    {currentRound > 0 && <span className="ml-2 font-bold">{currentWinnings.toFixed(2)} ₽</span>}
                </span>
            </Button>
          )
      }
      return (
        <Button onClick={() => {
            if (gameState === 'betting') {
                startGame();
            } else { // 'busted'
                setGameState('betting');
                setCurrentRound(0);
            }
        }} size="lg" className="h-14 w-full text-xl bg-primary text-primary-foreground hover:bg-primary/90">
            {gameState === 'busted' ? "Играть снова" : "Играть"}
        </Button>
      )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
         <style jsx>{`
            .preserve-3d {
                transform-style: preserve-3d;
            }
            .backface-hidden {
                backface-visibility: hidden;
            }
            .transform-rotate-y-180 {
                transform: rotateY(180deg);
            }
            @keyframes flip {
                0% {
                    transform: rotateY(0deg);
                }
                100% {
                    transform: rotateY(1800deg);
                }
            }
            .animate-flip {
                animation: flip 2s ease-out forwards;
            }
        `}</style>
      {/* CONTROL PANEL */}
      <Card className="lg:col-span-1 bg-card/80">
        <CardContent className="p-4 grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="bet-amount" className="font-semibold">СУММА СТАВКИ</Label>
                <div className="relative">
                    <Input 
                        id="bet-amount" 
                        type="number" 
                        value={betAmount.toFixed(2)} 
                        onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} 
                        disabled={gameState === 'playing' || gameState === 'flipping'}
                        className="pr-20 text-lg font-bold h-12"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => quickBet('double')} disabled={gameState === 'playing' || gameState === 'flipping'} className="h-auto px-2 py-1">x2</Button>
                        <Button variant="ghost" size="sm" onClick={() => quickBet('half')} disabled={gameState === 'playing' || gameState === 'flipping'} className="h-auto px-2 py-1">1/2</Button>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, 500, 750, 1000].map(val => (
                        <Button key={val} variant="secondary" size="sm" onClick={() => setBetAmount(val)} disabled={gameState === 'playing' || gameState === 'flipping'}>{val}</Button>
                    ))}
                </div>
            </div>

            <MainButton />

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline"><HelpCircle className="mr-2"/>Как играть?</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Как играть в UP-X</DialogTitle>
                        <DialogDescription className="space-y-2 pt-4 text-foreground">
                            <p>Цель игры — угадать правильную сторону монеты и подняться как можно выше по лестнице множителей.</p>
                            <p>1. **Сделайте ставку.** Используйте панель управления, чтобы установить сумму вашей ставки.</p>
                            <p>2. **Начните игру.** Нажмите кнопку "Играть", чтобы начать раунд.</p>
                            <p>3. **Сделайте выбор.** На каждом раунде выбирайте одну из двух сторон ('Blat' или 'Fam').</p>
                            <p>4. **Поднимайтесь или проигрывайте.** Если вы угадали, ваш множитель увеличится, и вы перейдете на следующий раунд. Вы можете забрать свой выигрыш в любой момент, нажав на кнопку "Забрать". Если вы не угадали, вы проигрываете ставку.</p>
                             <p>5. **Риск.** Чем выше вы поднимаетесь, тем больше выигрыш, но и риск потерять все тоже растет!</p>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
      
      {/* GAME AREA */}
       <Card className="lg:col-span-2 bg-card/80">
        <CardContent className="p-6 flex flex-col justify-between items-center h-full min-h-[400px]">
            <div className="flex justify-around items-center w-full">
                <div className="text-center">
                    <p className="text-4xl font-bold">{currentRound}</p>
                    <p className="text-muted-foreground">Раунд</p>
                </div>

                <div className="flex items-center gap-8 perspective-1000">
                    {gameState === 'flipping' ? (
                        <Coin isFlipping={true} side="left" />
                    ) : (
                        <>
                            <button
                                onClick={() => handleChoice('left')}
                                disabled={gameState !== 'playing'}
                                className={cn(
                                    "h-32 w-32 rounded-full border-4 transition-all duration-300 flex items-center justify-center",
                                    gameState === 'playing' ? "cursor-pointer hover:scale-110 bg-blue-500 border-blue-500" : "border-muted bg-muted/20",
                                    gameState === 'busted' && winSide === 'left' && "border-green-500 bg-green-500/20 animate-pulse",
                                    gameState === 'busted' && winSide !== 'left' && "border-red-500 bg-red-500/20"
                                )}
                            >
                                <span className="text-4xl font-bold text-white">Blat</span>
                            </button>
                        </>
                    )}
                </div>
               
                <div className="text-center">
                    <p className="text-4xl font-bold">x{currentMultiplier.toFixed(2)}</p>
                    <p className="text-muted-foreground">Коэфф.</p>
                </div>
            </div>
            
            <Carousel opts={{ align: "start", dragFree: true }} className="w-full max-w-xl mt-6">
                <CarouselContent className="-ml-2">
                    {multipliers.map((multiplier, index) => (
                    <CarouselItem key={index} className="pl-2 basis-1/5 md:basis-[12%]">
                        <div className={cn(
                            "p-2 rounded-md text-center bg-secondary",
                            currentRound === index + 1 && "border-2 border-primary"
                        )}>
                            <p className="font-bold text-sm text-muted-foreground">?</p>
                            <p className="text-xs text-primary">x{multiplier.toFixed(1)}</p>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </CardContent>
       </Card>
    </div>
  );
}

    