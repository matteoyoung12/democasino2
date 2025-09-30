
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useBalance } from '@/contexts/BalanceContext';
import { translations } from '@/lib/translations';
import { Slider } from '@/components/ui/slider';
import { ArrowDown, ArrowUp, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

type BetDirection = 'under' | 'over';

const AnimatedDigit = ({ finalDigit }: { finalDigit: number }) => {
    const [digit, setDigit] = useState(0);

    useState(() => {
        let animationFrameId: number;
        const animate = () => {
            const newDigit = Math.floor(Math.random() * 10);
            setDigit(newDigit);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        const timer = setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            setDigit(finalDigit);
        }, 1000 + Math.random() * 500); // Add random delay for staggered stop

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalDigit]);

    return (
        <div className="bg-primary/20 text-primary text-3xl sm:text-5xl font-bold w-12 h-16 sm:w-16 sm:h-20 flex items-center justify-center rounded-lg">
            {digit}
        </div>
    );
};

const StaticDigit = ({ digit }: { digit: number }) => (
     <div className="bg-primary/20 text-primary text-3xl sm:text-5xl font-bold w-12 h-16 sm:w-16 sm:h-20 flex items-center justify-center rounded-lg">
        {digit}
    </div>
);


export default function DiceGame() {
    const t = translations.ru;

    const [betAmount, setBetAmount] = useState(1.00);
    const [winChance, setWinChance] = useState(50.00);
    const [multiplier, setMultiplier] = useState(1.9);
    
    const [isRolling, setIsRolling] = useState(false);
    const [rollResult, setRollResult] = useState<number | null>(null);

    const { balance, setBalance } = useBalance();
    const { toast } = useToast();

    useState(() => {
        if (winChance > 0 && winChance < 100) {
            const calculatedMultiplier = (100 / winChance) * 0.95; // 5% house edge
            setMultiplier(calculatedMultiplier);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winChance]);

    const handleRoll = (direction: BetDirection) => {
        if (balance < betAmount) {
            toast({ title: t.insufficientBalance, variant: 'destructive' });
            return;
        }
        if (betAmount <= 0) {
            toast({ title: "Сумма ставки должна быть положительной", variant: 'destructive' });
            return;
        }

        setIsRolling(true);
        setRollResult(null);
        setBalance(prev => prev - betAmount);
        
        const result = Math.floor(Math.random() * 1_000_000);

        setTimeout(() => {
            setRollResult(result);
            setIsRolling(false);
            
            const rollTarget = Math.floor(winChance * 10000);
            const winCondition = direction === 'under' ? result < rollTarget : result >= (1_000_000 - rollTarget);

            if (winCondition) {
                const winnings = betAmount * multiplier;
                setBalance(prev => prev + winnings);
                toast({
                    title: `${t.youWon}! (+${winnings.toFixed(2)})`,
                    description: `Выпало ${result}.`,
                });
            } else {
                toast({
                    title: `${t.youLose}! (-${betAmount.toFixed(2)})`,
                    description: `Выпало ${result}.`,
                    variant: 'destructive',
                });
            }
        }, 2000);
    };

    const quickBet = (action: 'half' | 'double') => {
        if (action === 'half') {
            setBetAmount(prev => Math.max(0.01, parseFloat((prev / 2).toFixed(2))));
        } else if (action === 'double') {
            setBetAmount(prev => parseFloat((prev * 2).toFixed(2)));
        }
    }
    
    const setPresetChance = (chance: number) => {
        setWinChance(chance);
    }
    
    const resultDigits = rollResult !== null ? String(rollResult).padStart(6, '0').split('').map(Number) : [0,0,0,0,0,0];
    const underTarget = Math.floor(winChance * 10000);
    const overTarget = 1_000_000 - Math.floor(winChance * 10000);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Panel */}
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
                                disabled={isRolling} 
                                className="pr-20 text-lg font-bold h-12"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => quickBet('double')} disabled={isRolling} className="h-auto px-2 py-1">x2</Button>
                                <Button variant="ghost" size="sm" onClick={() => quickBet('half')} disabled={isRolling} className="h-auto px-2 py-1">1/2</Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                             {[50, 100, 200, 500, 750, 1000].map(val => (
                                <Button key={val} variant="secondary" size="sm" onClick={() => setBetAmount(val)} disabled={isRolling}>{val}</Button>
                            ))}
                        </div>
                    </div>
                    
                     <div className="grid gap-4">
                        <Label className="font-semibold">ШАНС ВЫИГРЫША</Label>
                        <div className="flex items-center gap-4">
                             <Slider
                                value={[winChance]}
                                onValueChange={(v) => setWinChance(v[0])}
                                max={95}
                                min={1}
                                step={0.01}
                                disabled={isRolling}
                                className="flex-1"
                            />
                            <div className="text-primary font-bold w-20 text-right">{winChance.toFixed(2)}%</div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 5, 10, 20, 50, 75, 95].map(val => (
                                <Button key={val} variant="secondary" size="sm" onClick={() => setPresetChance(val)} disabled={isRolling}>{val}%</Button>
                            ))}
                        </div>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline"><HelpCircle className="mr-2"/>Как играть?</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Как играть в Кости</DialogTitle>
                                <DialogDescription className="space-y-2 pt-4 text-foreground">
                                    <p>Цель игры — угадать, будет ли выпавшее число "Больше" или "Меньше" выбранного вами.</p>
                                    <p>1. **Сделайте ставку.** Установите сумму, которую вы хотите поставить.</p>
                                    <p>2. **Выберите шанс.** С помощью слайдера установите "Шанс выигрыша". Это определит ваш коэффициент: чем ниже шанс, тем выше выплата.</p>
                                    <p>3. **Сделайте выбор.** Нажмите на кнопку "Меньше" или "Больше", чтобы сделать ставку на то, что случайное число от 0 до 999 999 выпадет в выбранном диапазоне.</p>
                                    <p>4. **Результат.** После броска вы сразу узнаете, выиграли вы или проиграли. Удачи!</p>
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Game Area */}
            <Card className="lg:col-span-2 bg-card/80">
                 <CardContent className="p-6 flex flex-col items-center justify-center gap-8 h-full">
                     <div className="flex items-center justify-around w-full max-w-md">
                         <div className="text-center">
                             <p className="text-2xl font-bold">{multiplier.toFixed(2)}x</p>
                             <p className="text-sm text-muted-foreground">Коэфф.</p>
                         </div>
                         <div className="text-center">
                             <p className="text-2xl font-bold">{(betAmount * multiplier).toFixed(2)} ₽</p>
                             <p className="text-sm text-muted-foreground">Выигрыш</p>
                         </div>
                     </div>

                    <div className="flex items-center justify-center gap-2">
                        {isRolling ? 
                            Array.from({length: 6}).map((_, i) => <AnimatedDigit key={i} finalDigit={resultDigits[i]}/>) :
                            resultDigits.map((d, i) => <StaticDigit key={i} digit={d}/>)
                        }
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        <Button 
                            onClick={() => handleRoll('under')} 
                            disabled={isRolling} 
                            className="h-16 text-lg bg-red-600 hover:bg-red-700 text-white flex-col"
                        >
                            <div className="flex items-center gap-2">
                                <ArrowDown className="h-5 w-5" />
                                <span>МЕНЬШЕ</span>
                            </div>
                            <p className="text-xs font-normal">От 0 до {underTarget - 1}</p>
                        </Button>
                        <Button 
                            onClick={() => handleRoll('over')} 
                            disabled={isRolling} 
                            className="h-16 text-lg bg-green-600 hover:bg-green-700 text-white flex-col"
                        >
                             <div className="flex items-center gap-2">
                                <ArrowUp className="h-5 w-5" />
                                <span>БОЛЬШЕ</span>
                            </div>
                            <p className="text-xs font-normal">От {overTarget} до 999999</p>
                        </Button>
                    </div>
                 </CardContent>
            </Card>

        </div>
    );
}
