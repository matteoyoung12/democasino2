
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, StopCircle } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

type Ball = {
    id: number;
    x: number;
    y: number;
    xSpeed: number;
    ySpeed: number;
    currentRow: number;
    path: number[]; // Sequence of peg hits (0 for left, 1 for right)
};

const getMultiplierConfig = (rows: number) => {
    const baseMultipliers = {
        low:    [16, 9, 2, 1.4, 1.1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1.1, 1.4, 2, 9, 16],
        medium: [110, 24, 10, 5, 3, 1.5, 1, 0.5, 0.5, 0.5, 1, 1.5, 3, 5, 10, 24, 110],
        high:   [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
    };
    const baseRowCount = 16; 

    const count = rows + 1;
    const midIndex = Math.floor(baseRowCount / 2);
    const halfCount = Math.floor(count / 2);

    const sliceAndMirror = (arr: number[]) => {
        let half;
        if (count % 2 === 0) {
            const start = midIndex - halfCount +1;
            const leftHalf = arr.slice(start, midIndex + 1);
            half = [...leftHalf.slice().reverse(), ...leftHalf];
        } else {
             const start = midIndex - halfCount;
            const leftHalf = arr.slice(start, midIndex);
            half = [...leftHalf.slice().reverse(), arr[midIndex], ...leftHalf];
        }
        return half.slice(0, count);
    };
    
    return {
        low: sliceAndMirror(baseMultipliers.low),
        medium: sliceAndMirror(baseMultipliers.medium),
        high: sliceAndMirror(baseMultipliers.high),
    };
}


const PlinkoGame = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [betAmount, setBetAmount] = useState(1.00);
  const [rows, setRows] = useState(16);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('high');
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [autoBets, setAutoBets] = useState(10);

  const [balls, setBalls] = useState<Ball[]>([]);
  const { balance, setBalance } = useBalance();
  const { toast } = useToast();
  const animationFrameId = useRef<number>();
  const autoPlayIntervalId = useRef<NodeJS.Timeout>();

  const [isAutoBetting, setIsAutoBetting] = useState(false);
  
  const currentMultipliers = getMultiplierConfig(rows);

  const getBucketColor = (multiplier: number) => {
    if (risk === 'high') {
        if (multiplier >= 100) return 'hsl(var(--destructive))';
        if (multiplier >= 20) return 'hsl(350, 80%, 60%)';
        if (multiplier >= 5) return 'hsl(20, 90%, 60%)';
        if (multiplier >= 2) return 'hsl(var(--accent))';
    } else {
        if (multiplier >= 10) return 'hsl(var(--destructive))';
        if (multiplier >= 3) return 'hsl(var(--accent))';
    }
    if (multiplier >= 1) return 'hsl(142, 71%, 45%)';
    return 'hsl(210, 40%, 96.1%)'; 
  }

  const drawPlinko = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const pegRadius = Math.min(width / 140, 3);
    const topPadding = height * 0.1;
    const rowSpacing = (height - topPadding - (height * 0.15)) / (rows);

    ctx.fillStyle = 'hsl(225, 20%, 25%)';

    for (let row = 0; row < rows; row++) {
      const numPegsInRow = row + 1;
      const totalWidthForRow = numPegsInRow * rowSpacing;
      
      for (let col = 0; col < numPegsInRow; col++) {
        const x = (width / 2) - (totalWidthForRow / 2) + (col * rowSpacing) + (rowSpacing / 2);
        const y = topPadding + row * rowSpacing;
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [rows]);

  const dropBall = useCallback(() => {
    if (balance < betAmount) {
        if (isAutoBetting) {
            stopAutoPlay();
            toast({ title: t.insufficientBalance, variant: "destructive", description: "Авто-игра остановлена." });
        } else {
            toast({ title: t.insufficientBalance, variant: "destructive" });
        }
        return false;
    }

    setBalance(prev => prev - betAmount);

    const newBall: Ball = {
        id: Date.now() + Math.random(),
        x: (canvasRef.current?.width || 0) / 2 + (Math.random() - 0.5) * 20,
        y: 10,
        xSpeed: (Math.random() - 0.5) * 1.5,
        ySpeed: 0,
        currentRow: 0,
        path: Array.from({ length: rows }, () => (Math.random() < 0.5 ? 0 : 1)),
    };

    setBalls(prev => [...prev, newBall]);
    return true;
  }, [balance, betAmount, rows, setBalance, toast, t, isAutoBetting]);


  const startAutoPlay = () => {
    if (isAutoBetting) return;
    setIsAutoBetting(true);
    let betsMade = 0;

    const executeBet = () => {
        if (betsMade < autoBets) {
             const success = dropBall();
             if (success) {
                betsMade++;
             } else {
                 stopAutoPlay();
             }
        } else {
            stopAutoPlay();
        }
    };
    
    executeBet();
    autoPlayIntervalId.current = setInterval(executeBet, 200); // Drop a ball every 200ms
  };

  const stopAutoPlay = () => {
    setIsAutoBetting(false);
    if(autoPlayIntervalId.current) {
        clearInterval(autoPlayIntervalId.current);
    }
  };

  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width, height } = canvas;

      drawPlinko(ctx, width, height);

      let activeBalls: Ball[] = [];

      for (const ball of balls) {
        let newBall = { ...ball };

        newBall.ySpeed += 0.15; // Gravity
        newBall.y += newBall.ySpeed;
        newBall.x += newBall.xSpeed;

        // Wall bounce
        if (newBall.x < 10 || newBall.x > width - 10) {
            newBall.xSpeed *= -0.6;
        }

        const topPadding = height * 0.1;
        const rowSpacing = (height - topPadding - (height * 0.15)) / (rows);
        const nextRowY = topPadding + newBall.currentRow * rowSpacing;

        if (newBall.y > nextRowY && newBall.currentRow < rows) {
            const direction = newBall.path[newBall.currentRow] === 0 ? -1 : 1;
            newBall.xSpeed = direction * (Math.random() * 0.5 + 0.5);
            newBall.ySpeed *= -0.3; // Bounce
            newBall.currentRow++;
        }

        if (newBall.y < height - 20) {
          activeBalls.push(newBall);
          ctx.beginPath();
          ctx.arc(newBall.x, newBall.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'hsl(var(--accent))';
          ctx.shadowColor = 'hsl(var(--accent))';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Ball has reached the bottom
          const multipliers = currentMultipliers[risk];
          const pathSum = ball.path.reduce((a, b) => a + b, 0);
          const finalBucketIndex = Math.max(0, Math.min(multipliers.length - 1, pathSum));
          
          const multiplier = multipliers[finalBucketIndex];
          const winnings = betAmount * multiplier;
          setBalance(prev => prev + winnings);

          toast({
            title: `${t.youWon} ${winnings.toFixed(2)} ${t.credits}!`,
            description: `${multiplier.toFixed(2)}x ${t.payout}`,
          });
        }
      }
      setBalls(activeBalls);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (autoPlayIntervalId.current) {
        clearInterval(autoPlayIntervalId.current);
      }
    };
  }, [balls, drawPlinko, rows, risk, betAmount, setBalance, t, currentMultipliers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resizeObserver = new ResizeObserver(() => {
        const { width, height } = canvas.getBoundingClientRect();
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawPlinko(ctx, width, height);
          }
        }
      });
      resizeObserver.observe(canvas);
      return () => resizeObserver.disconnect();
    }
  }, [drawPlinko]);
  
  const handleBetChange = (value: number | string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 0) {
        setBetAmount(numValue);
    }
  }

  const quickBet = (action: 'half' | 'double' | number) => {
    if (action === 'half') {
        setBetAmount(prev => Math.max(0.1, prev / 2));
    } else if (action === 'double') {
        setBetAmount(prev => prev * 2);
    } else {
        setBetAmount(prev => prev + action);
    }
  }

  const riskLevels = ['low', 'medium', 'high'];
  const currentRiskIndex = riskLevels.indexOf(risk);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
      {/* CONTROL PANEL */}
      <Card className="w-full lg:col-span-1 bg-card/80">
        <CardContent className="p-4 grid gap-4">
            <ToggleGroup type="single" value={mode} onValueChange={(value: 'manual' | 'auto') => value && setMode(value)} className="grid grid-cols-2">
                <ToggleGroupItem value="manual" aria-label="Manual">Ручной</ToggleGroupItem>
                <ToggleGroupItem value="auto" aria-label="Auto">Авто</ToggleGroupItem>
            </ToggleGroup>
            
            <div className="grid gap-2">
                <Label htmlFor="bet-amount" className="text-xs text-muted-foreground">Сумма ставки</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary">₽</span>
                    <Input id="bet-amount" type="number" value={betAmount.toFixed(2)} onChange={(e) => handleBetChange(e.target.value)} disabled={isAutoBetting} className="pl-8 text-lg font-bold" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => quickBet('half')} disabled={isAutoBetting} className="h-auto px-2 py-1 text-xs">1/2</Button>
                        <Button variant="ghost" size="sm" onClick={() => quickBet('double')} disabled={isAutoBetting} className="h-auto px-2 py-1 text-xs">x2</Button>
                    </div>
                </div>
            </div>

             <div className="grid grid-cols-4 gap-1">
                {[50, 100, 500, 1000].map(val => (
                    <Button key={val} variant="secondary" size="sm" onClick={() => setBetAmount(val)} disabled={isAutoBetting}>+{val}</Button>
                ))}
            </div>
             
             {mode === 'auto' && (
                <div className="grid gap-2">
                    <Label htmlFor="auto-bets" className="text-xs text-muted-foreground">Количество ставок</Label>
                    <Input id="auto-bets" type="number" value={autoBets} onChange={(e) => setAutoBets(Number(e.target.value))} disabled={isAutoBetting} />
                </div>
            )}


            <div className="grid gap-2">
                 <Label className="text-xs text-muted-foreground">
                    {risk === 'low' ? "Низкий риск" : risk === 'medium' ? "Средний риск" : "Высокий риск"}
                 </Label>
                 <Slider
                    value={[currentRiskIndex]}
                    onValueChange={(value) => setRisk(riskLevels[value[0]] as 'low' | 'medium' | 'high')}
                    max={2}
                    step={1}
                    disabled={isAutoBetting}
                 />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="rows" className="text-xs text-muted-foreground">Количество рядов</Label>
                <Select value={String(rows)} onValueChange={(val) => setRows(Number(val))} disabled={isAutoBetting}>
                  <SelectTrigger id="rows">
                    <SelectValue placeholder={t.rows} />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16].map(i => (
                      <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            
            {mode === 'manual' ? (
                <Button onClick={() => dropBall()} disabled={isAutoBetting} size="lg" className="h-12 w-full text-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Play className="mr-2"/>
                  {"Играть"}
                </Button>
            ) : (
                <Button onClick={isAutoBetting ? stopAutoPlay : startAutoPlay} size="lg" className={cn("h-12 w-full text-lg", isAutoBetting ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90")}>
                    {isAutoBetting ? <StopCircle className="mr-2" /> : <Play className="mr-2" />}
                    {isAutoBetting ? "Остановить" : "Начать авто-игру"}
                </Button>
            )}
        </CardContent>
      </Card>

      {/* GAME AREA */}
        <div className="w-full lg:col-span-3 flex flex-col items-center justify-between">
            <canvas ref={canvasRef} className="w-full max-w-2xl aspect-[4/3]"></canvas>
            <div className={cn("grid gap-1 w-full max-w-2xl px-[2%]")} style={{gridTemplateColumns: `repeat(${rows + 1}, 1fr)`}}>
                {currentMultipliers[risk].map((m, i) => (
                    <div key={i} className="aspect-video flex items-center justify-center text-xs font-bold rounded-md"
                         style={{backgroundColor: getBucketColor(m), color: m > 0.5 ? 'hsl(var(--card))' : 'hsl(var(--foreground))'}}>
                        x{m}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default PlinkoGame;

    