
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
        const newWinChance = Math.max(0, Math.min(100, chance));

        if (newWinChance <= 0.5) {
             setMultiplier(99);
             setWinChance(0.5);
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

        setIsRolling(true);
        setRollResult(null);
        setBalance(prev => prev - betAmount);
        
        const result = Math.floor(Math.random() * 100) + 1;

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
                    title: `${t.youWon}!`,
                    description: `${t.youWonAmount} ${winnings.toFixed(2)} ${t.credits}.`,
                });
            } else {
                toast({
                    title: `${t.youLose}!`,
                    description: `${t.result}: ${result}.`,
                    variant: 'destructive',
                });
            }
        }, 1000);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center">{t.diceTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                 <div className="relative w-full h-32 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="absolute w-full h-1 bg-border" />
                     {isRolling && (
                        <div className="h-full w-px bg-primary animate-dice-roll-indicator" />
                    )}
                    {rollResult !== null && (
                         <div
                            className={cn("absolute top-0 h-full flex flex-col items-center transition-all duration-300", 
                            (rollResult < rollTarget && betDirection === 'under') || (rollResult > rollTarget && betDirection === 'over') ? "text-green-500" : "text-red-500"
                            )}
                            style={{ left: `${rollResult}%`}}
                        >
                            <span className="font-bold text-lg -mt-1">{rollResult}</span>
                            <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-current" />
                        </div>
                    )}
                    <div 
                        className="absolute top-0 h-full bg-green-500/20"
                        style={{
                            left: betDirection === 'under' ? '0' : `${rollTarget}%`,
                            right: betDirection === 'over' ? '0' : `${100-rollTarget}%`,
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                             <Label htmlFor="bet-amount"><Wallet className="inline-block mr-2" />{t.betAmount}</Label>
                            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={isRolling} />
                        </div>
                         <div className="grid gap-2">
                            <Label>{t.multiplier}</Label>
                            <Input value={`${multiplier.toFixed(2)}x`} readOnly disabled />
                        </div>
                         <div className="grid gap-2">
                            <Label>{t.winChance}</Label>
                            <Input value={`${winChance.toFixed(2)}%`} readOnly disabled />
                        </div>
                    </div>
                     <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Розыгрыш</Label>
                            <ToggleGroup type="single" value={betDirection} onValueChange={(value: BetDirection) => value && setBetDirection(value)} disabled={isRolling} className="grid grid-cols-2">
                                <ToggleGroupItem value="under"><ArrowDown className="mr-2" />Меньше</ToggleGroupItem>
                                <ToggleGroupItem value="over"><ArrowUp className="mr-2" />Больше</ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <div className="grid gap-2">
                            <Label>Число: {rollTarget}</Label>
                            <Slider
                                value={[rollTarget]}
                                onValueChange={(value) => setRollTarget(value[0])}
                                max={99.5}
                                min={1.5}
                                step={1}
                                disabled={isRolling}
                            />
                        </div>

                         <Button onClick={handleRoll} disabled={isRolling} size="lg" className="w-full h-14 text-xl">
                            {isRolling ? "Бросаем..." : "Бросить кости"}
                            {!isRolling && <Zap className="ml-2"/>}
                        </Button>
                    </div>
                </div>
            </CardContent>
            <style jsx>{`
                @keyframes dice-roll-indicator {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(10000%); }
                }
                .animate-dice-roll-indicator {
                    animation: dice-roll-indicator 1s linear infinite;
                }
            `}</style>
        </Card>
    );
}
