
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Play, Disc } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


const MULTIPLIERS = {
    low: [1.2, 1.1, 1.0, 0.9, 1.0, 1.1, 1.2],
    medium: [1.5, 1.3, 1.1, 0.8, 1.1, 1.3, 1.5],
    high: [5, 2, 1.2, 0.7, 1.2, 2, 5],
};

const PlinkoGame = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [rows, setRows] = useState(8);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDropping, setIsDropping] = useState(false);
  
  const { balance, setBalance } = useBalance();
  const { toast } = useToast();

  const drawPlinko = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw Pegs
    const pegRadius = 5;
    const verticalSpacing = height / (rows + 3);
    for (let row = 0; row < rows; row++) {
      const numPegs = row + 2;
      const horizontalSpacing = width / (numPegs + 1);
      for (let col = 0; col < numPegs; col++) {
        const x = horizontalSpacing * (col + 1);
        const y = verticalSpacing * (row + 1.5);
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(var(--muted-foreground))';
        ctx.fill();
      }
    }
    
    // Draw Multiplier Buckets
    const multipliers = MULTIPLIERS[risk].slice(0, rows+1);
    const bucketWidth = width / multipliers.length;
    for (let i = 0; i < multipliers.length; i++) {
        const x = i * bucketWidth;
        const y = height - verticalSpacing;
        ctx.fillStyle = 'hsl(var(--primary) / 0.2)';
        ctx.fillRect(x, y, bucketWidth, verticalSpacing);
        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.strokeRect(x, y, bucketWidth, verticalSpacing);
        ctx.fillStyle = 'hsl(var(--foreground))';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${multipliers[i]}x`, x + bucketWidth / 2, y + verticalSpacing / 2);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        drawPlinko(ctx, width, height);
      }
    }
  }, [rows, risk]);


  const handleDrop = () => {
    if (betAmount > balance) {
      toast({ title: t.insufficientBalance, variant: "destructive" });
      return;
    }
    setIsDropping(true);
    setBalance(prev => prev - betAmount);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const verticalSpacing = height / (rows + 3);
    const ballRadius = 7;
    let x = width / 2 + (Math.random() - 0.5) * 10;
    let y = ballRadius + 5;
    let vy = 0;
    const gravity = 0.2;
    
    let path = [Math.round((rows+1)/2)]; // Start in the middle

    const animate = () => {
      drawPlinko(ctx, width, height); // Redraw board
      
      // Draw Ball
      y += vy;
      vy += gravity;

      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fill();

      // Collision with pegs
      const currentRow = Math.floor((y - verticalSpacing/2) / verticalSpacing);
      if(currentRow >= 0 && currentRow < rows) {
          const numPegsInRow = currentRow + 2;
          const horizontalSpacing = width / (numPegsInRow + 1);
          
          for (let col = 0; col < numPegsInRow; col++) {
              const pegX = horizontalSpacing * (col + 1);
              const pegY = verticalSpacing * (currentRow + 1.5);
              const dx = x - pegX;
              const dy = y - pegY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < ballRadius + 5) { // 5 is peg radius
                  const direction = Math.random() < 0.5 ? -1 : 1;
                  x += direction * horizontalSpacing / 2.5; // Bounce
                  y += 5; // Move down past peg
                  vy = 0; // Reset vertical velocity

                  let currentBucket = path[path.length - 1];
                  path.push(currentBucket + direction * 0.5);
                  break;
              }
          }
      }


      if (y < height - verticalSpacing) {
        requestAnimationFrame(animate);
      } else {
        // Landed in a bucket
        const finalBucketIndex = Math.floor(x / (width / (rows + 1)));
        const finalBucket = Math.max(0, Math.min(finalBucketIndex, rows));
        
        const multipliers = MULTIPLIERS[risk].slice(0, rows+1);
        const multiplier = multipliers[finalBucket];
        const winnings = betAmount * multiplier;
        setBalance(prev => prev + winnings);

        toast({
            title: `${t.youWon} ${winnings.toFixed(2)} ${t.credits}!`,
            description: `${multiplier.toFixed(2)}x ${t.payout}`,
        });
        
        setIsDropping(false);
      }
    };

    animate();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="md:col-span-2">
            <canvas ref={canvasRef} className="w-full aspect-[4/3] bg-card rounded-lg"></canvas>
        </div>

      <Card className="w-full">
        <CardContent className="p-4 grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="bet-amount" className="flex items-center gap-2"><Wallet /> {t.betAmount}</Label>
                <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={isDropping} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="risk-level">{t.risk}</Label>
                 <ToggleGroup id="risk-level" type="single" value={risk} onValueChange={(value: "low" | "medium" | "high") => value && setRisk(value)} disabled={isDropping}>
                    <ToggleGroupItem value="low" aria-label="Low risk" className="w-full">{t.low}</ToggleGroupItem>
                    <ToggleGroupItem value="medium" aria-label="Medium risk" className="w-full">{t.medium}</ToggleGroupItem>
                    <ToggleGroupItem value="high" aria-label="High risk" className="w-full">{t.high}</ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="rows">{t.rows}</Label>
                <Select value={String(rows)} onValueChange={(val) => setRows(Number(val))} disabled={isDropping}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.rows} />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(9).keys()].map(i => i + 8).map(i => (
                      <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            
            <Button onClick={handleDrop} disabled={isDropping} size="lg" className="h-16 w-full text-xl">
              {isDropping ? t.dropping : t.drop}
              {!isDropping && <Play className="ml-2" />}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlinkoGame;
