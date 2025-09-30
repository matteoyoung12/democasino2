
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';


const MULTIPLIERS = {
    low: [5.3, 2.2, 1.1, 0.9, 0.5, 0.9, 1.1, 2.2, 5.3],
    medium: [10, 3, 1.5, 1, 0.5, 1, 1.5, 3, 10],
    high: [25, 5, 2, 1.2, 0.4, 1.2, 2, 5, 25],
};

const getMultiplierConfig = (rows: number) => {
    const baseMultipliers = {
        low: [16, 9, 2, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 2, 9, 16],
        medium: [110, 24, 10, 5, 3, 1.5, 0.5, 1.5, 3, 5, 10, 24, 110],
        high: [1000, 130, 26, 9, 4, 2, 0.5, 2, 4, 9, 26, 130, 1000]
    };

    const count = rows + 1;
    const midIndex = Math.floor(baseMultipliers.low.length / 2);
    const halfCount = Math.floor(count / 2);

    const sliceAndMirror = (arr: number[]) => {
        const half = arr.slice(midIndex - halfCount, midIndex);
        const result = [...half, arr[midIndex], ...half.slice().reverse()];
        return result.slice(0, count);
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
  const [rows, setRows] = useState(8);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [isDropping, setIsDropping] = useState(false);
  
  const { balance, setBalance } = useBalance();
  const { toast } = useToast();
  
  const currentMultipliers = getMultiplierConfig(rows);

  const getBucketColor = (multiplier: number) => {
    if (multiplier >= 10) return 'hsl(var(--destructive))';
    if (multiplier >= 3) return 'hsl(34, 97%, 62%)'; // Orange
    if (multiplier >= 1.5) return 'hsl(var(--accent))';
    if (multiplier >= 1) return 'hsl(142, 71%, 45%)'; // Green
    return 'hsl(210, 40%, 96.1%)'; // text-foreground
  }

  const drawPlinko = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const pegRadius = width / 100;
    const topPadding = height * 0.1;
    const rowSpacing = (height - topPadding - (height * 0.15)) / (rows - 1);
    
    // Draw Pegs (Pyramid shape)
    for (let row = 0; row < rows; row++) {
      const numPegsInRow = row + 1;
      const pegSpacing = width * 0.8 / row;
      for (let col = 0; col < numPegsInRow; col++) {
        const x = (width * 0.1) + (row > 0 ? col * pegSpacing : 0) + (width * 0.8 - (numPegsInRow - 1) * pegSpacing) / 2;
        const y = topPadding + row * rowSpacing;
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(227, 24%, 30%)'; // A bit lighter than background
        ctx.shadowColor = 'hsl(var(--primary))';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [rows]);

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

  const handleDrop = () => {
    if (betAmount > balance) {
      toast({ title: t.insufficientBalance, variant: "destructive" });
      return;
    }
    if (isDropping) return;

    setIsDropping(true);
    setBalance(prev => prev - betAmount);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const ballRadius = width / 80;
    const topPadding = height * 0.1;
    const rowSpacing = (height - topPadding - (height * 0.15)) / (rows - 1);

    let x = width / 2;
    let y = ballRadius;
    let path: number[] = [0];

    for (let row = 0; row < rows; row++) {
        path.push(Math.random() < 0.5 ? -0.5 : 0.5);
    }
    
    let step = 0;
    const totalPathTime = 2000;
    const stepTime = totalPathTime / rows;
    let startTime = performance.now();

    const animate = (time: number) => {
      drawPlinko(ctx, width, height); 
      
      const elapsedTime = time - startTime;
      const currentStep = Math.min(Math.floor(elapsedTime / stepTime), rows - 1);
      const stepProgress = (elapsedTime % stepTime) / stepTime;

      const currentRow = currentStep;
      const numPegsInRow = currentRow + 1;
      const pegSpacing = width * 0.8 / currentRow;
      
      const startX = width/2 + path.slice(0, currentRow + 1).reduce((a, b) => a + b, 0) * pegSpacing;
      const endX = width/2 + path.slice(0, currentRow + 2).reduce((a, b) => a + b, 0) * pegSpacing;
      
      x = startX + (endX - startX) * stepProgress;
      y = topPadding + currentRow * rowSpacing + stepProgress * rowSpacing;

      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(var(--accent))';
      ctx.shadowColor = 'hsl(var(--accent))';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowColor = 'transparent';

      if (elapsedTime < totalPathTime) {
        requestAnimationFrame(animate);
      } else {
        const finalPathSum = path.reduce((a, b) => a + b, 0);
        const multipliers = currentMultipliers[risk];
        const midIndex = Math.floor(multipliers.length / 2);
        const finalBucketIndex = Math.round(midIndex + finalPathSum);

        const multiplier = multipliers[finalBucketIndex];
        const winnings = betAmount * multiplier;
        setBalance(prev => prev + winnings);

        toast({
            title: `${t.youWon} ${winnings.toFixed(2)} ${t.credits}!`,
            description: `${multiplier.toFixed(2)}x ${t.payout}`,
        });
        
        setIsDropping(false);
      }
    };
    requestAnimationFrame(animate);
  };
  
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
            <ToggleGroup type="single" defaultValue="manual" className="grid grid-cols-2">
                <ToggleGroupItem value="manual" aria-label="Manual">Ручной</ToggleGroupItem>
                <ToggleGroupItem value="auto" aria-label="Auto">Авто</ToggleGroupItem>
            </ToggleGroup>
            
            <div className="grid gap-2">
                <Label htmlFor="bet-amount" className="text-xs text-muted-foreground">Сумма ставки</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary">₽</span>
                    <Input id="bet-amount" type="number" value={betAmount.toFixed(2)} onChange={(e) => handleBetChange(e.target.value)} disabled={isDropping} className="pl-8 text-lg font-bold" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => quickBet('half')} disabled={isDropping} className="h-auto px-2 py-1 text-xs">1/2</Button>
                        <Button variant="ghost" size="sm" onClick={() => quickBet('double')} disabled={isDropping} className="h-auto px-2 py-1 text-xs">x2</Button>
                    </div>
                </div>
            </div>

             <div className="grid grid-cols-4 gap-1">
                {[50, 100, 500, 1000].map(val => (
                    <Button key={val} variant="secondary" size="sm" onClick={() => quickBet(val)} disabled={isDropping}>+{val}</Button>
                ))}
            </div>

            <div className="grid gap-2">
                 <Label className="text-xs text-muted-foreground">
                    {risk === 'low' ? "Низкий риск" : risk === 'medium' ? "Средний риск" : "Высокий риск"}
                 </Label>
                 <Slider
                    value={[currentRiskIndex]}
                    onValueChange={(value) => setRisk(riskLevels[value[0]] as 'low' | 'medium' | 'high')}
                    max={2}
                    step={1}
                    disabled={isDropping}
                 />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="rows" className="text-xs text-muted-foreground">Количество рядов</Label>
                <Select value={String(rows)} onValueChange={(val) => setRows(Number(val))} disabled={isDropping}>
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
            
            <Button onClick={handleDrop} disabled={isDropping} size="lg" className="h-12 w-full text-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="mr-2"/>
              {isDropping ? t.dropping : "Играть"}
            </Button>
        </CardContent>
      </Card>

      {/* GAME AREA */}
        <div className="w-full lg:col-span-3 flex flex-col items-center">
            <canvas ref={canvasRef} className="w-full max-w-2xl aspect-square"></canvas>
            <div className={cn("grid gap-1 mt-[-10%] w-full max-w-2xl px-[2%]")} style={{gridTemplateColumns: `repeat(${rows + 1}, 1fr)`}}>
                {currentMultipliers[risk].map((m, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center text-xs font-bold rounded-md"
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

    