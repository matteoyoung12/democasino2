
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Slider } from '@/components/ui/slider';
import { Wallet, RollerCoaster, ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type BetDirection = 'under' | 'over';

export default function DiceGame() {
    const { language } = useLanguage();
    const t = translations[language];

    const [betAmount, setBetAmount] = useState(10);
    const [betDirection, setBetDirection] = useState<BetDirection>('under');
    const [rollTarget, setRollTarget] = useState(50.5);
    const [multiplier, setMultiplier] = useState(2.0);
    const [winChance, setWinChance] = useState(50);
    const [isRolling, setIsRolling] = useState(false);
    const [rollResult, setRollResult] = useState<number | null>(null);

    const { balance, setBalance } = useBalance();
    const { toast } = useToast();
    
    useEffect(() => {
        const chance = betDirection === 'under' ? rollTarget - 0.5 : 100 - rollTarget + 0.5;
        const newWinChance = Math.max(0.5, Math.min(99.5, chance));

        if (newWinChance === 0.5) {
            setMultiplier(190); // ~95% return for 0.5% chance
            setWinChance(0.5);
            return;
        }
        if (newWinChance === 99.5) {
            setMultiplier(1.005);
            setWinChance(99.5);
            return;
        }

        const newMultiplier = (100 / newWinChance) * 0.95; // 5% house edge
        setMultiplier(newMultiplier);
        setWinChance(newWinChance);

    }, [rollTarget, betDirection]);
    
    const handleRoll = () => {
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
        
        const result = parseFloat((Math.random() * 100).toFixed(2));

        setTimeout(() => {
            setRollResult(result);
            setIsRolling(false);
            
            const winCondition = betDirection === 'under'
                ? result < rollTarget
                : result > rollTarget;

            if (winCondition) {
                const winnings = betAmount * multiplier;
                setBalance(prev => prev + winnings);
                toast({
                    title: `${t.youWon}! (+${winnings.toFixed(2)})`,
                    description: `Выпало ${result}. Ваша цель: ${betDirection === 'under' ? '<' : '>'} ${rollTarget}`,
                });
            } else {
                toast({
                    title: `${t.youLose}! (-${betAmount.toFixed(2)})`,
                    description: `Выпало ${result}. Ваша цель: ${betDirection === 'under' ? '<' : '>'} ${rollTarget}`,
                    variant: 'destructive',
                });
            }
        }, 500);
    };

    const handleSliderChange = (value: number[]) => {
        const val = value[0];
         if (betDirection === 'under') {
            setRollTarget(Math.max(1.01, val));
        } else {
            setRollTarget(Math.min(98.99, val));
        }
    }
    
    const quickBet = (action: 'half' | 'double' | 'max') => {
        if (action === 'half') {
            setBetAmount(prev => Math.max(0.1, parseFloat((prev / 2).toFixed(2))));
        } else if (action === 'double') {
            setBetAmount(prev => parseFloat((prev * 2).toFixed(2)));
        } else if (action === 'max') {
            setBetAmount(balance);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Control Panel */}
            <Card className="md:col-span-1 bg-card/80">
                <CardContent className="p-4 grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="bet-amount" className="text-xs text-muted-foreground">Сумма ставки</Label>
                         <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary">₽</span>
                            <Input 
                                id="bet-amount" 
                                type="number" 
                                value={betAmount} 
                                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} 
                                disabled={isRolling} 
                                className="pl-8 text-lg font-bold"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => quickBet('half')} disabled={isRolling} className="h-auto px-2 py-1 text-xs">1/2</Button>
                                <Button variant="ghost" size="sm" onClick={() => quickBet('double')} disabled={isRolling} className="h-auto px-2 py-1 text-xs">x2</Button>
                                <Button variant="ghost" size="sm" onClick={() => quickBet('max')} disabled={isRolling} className="h-auto px-2 py-1 text-xs">MAX</Button>
                            </div>
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-secondary p-3">
                            <Label className="text-xs text-muted-foreground">Множитель</Label>
                            <p className="text-lg font-bold">{multiplier.toFixed(2)}x</p>
                        </Card>
                         <Card className="bg-secondary p-3">
                            <Label className="text-xs text-muted-foreground">Шанс выигрыша</Label>
                            <p className="text-lg font-bold">{winChance.toFixed(2)}%</p>
                        </Card>
                    </div>
                    
                    <Button onClick={handleRoll} disabled={isRolling} size="lg" className="h-16 w-full text-xl bg-primary text-primary-foreground hover:bg-primary/90">
                       {isRolling ? "Бросаем..." : "Бросить кости"}
                       {!isRolling && <Zap className="ml-2"/>}
                    </Button>
                </CardContent>
            </Card>

            {/* Game Area */}
            <Card className="md:col-span-2 bg-card/80">
                 <CardContent className="p-6 flex flex-col items-center justify-center gap-6 h-full">
                     <ToggleGroup 
                        type="single" 
                        value={betDirection} 
                        onValueChange={(value: BetDirection) => value && setBetDirection(value)} 
                        disabled={isRolling} 
                        className="grid grid-cols-2 w-full max-w-xs"
                    >
                        <ToggleGroupItem value="under" className="text-base py-3">Меньше</ToggleGroupItem>
                        <ToggleGroupItem value="over" className="text-base py-3">Больше</ToggleGroupItem>
                    </ToggleGroup>
                    
                    <div className="text-center">
                        <p className="text-muted-foreground">
                            {betDirection === 'under' ? 'Выпадет меньше чем' : 'Выпадет больше чем'}
                        </p>
                        <p className="text-4xl font-bold text-primary">{rollTarget.toFixed(2)}</p>
                    </div>

                    <div className="w-full max-w-xl relative h-16 flex items-center">
                         <Slider
                            value={[rollTarget]}
                            onValueChange={handleSliderChange}
                            max={99.99}
                            min={0.01}
                            step={0.01}
                            disabled={isRolling}
                        />
                        <div 
                            className="absolute h-full top-0 bg-green-500/20 rounded-full"
                            style={{
                                left: betDirection === 'under' ? '0' : `${rollTarget}%`,
                                right: betDirection === 'over' ? '0' : `${100 - rollTarget}%`,
                                pointerEvents: 'none'
                            }}
                        />

                         {rollResult !== null && (
                             <div
                                className={cn("absolute -top-6 flex flex-col items-center transition-all duration-300", 
                                    (rollResult < rollTarget && betDirection === 'under') || (rollResult > rollTarget && betDirection === 'over') ? "text-green-500" : "text-red-500"
                                )}
                                style={{ left: `calc(${rollResult}% - 14px)`}}
                            >
                                <span className="font-bold text-lg">{rollResult}</span>
                                <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-current" />
                            </div>
                        )}
                    </div>
                 </CardContent>
            </Card>

        </div>
    );

    