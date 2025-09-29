'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, YAxis, XAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateCrashCurve } from '@/ai/flows/generate-crash-curve';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Wallet, Target, Play, Zap } from 'lucide-react';

type GameState = 'idle' | 'betting' | 'running' | 'crashed' | 'cashed_out';

export default function CrashGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>([{ time: 0, value: 1 }]);
  const [crashPoint, setCrashPoint] = useState(1.0);
  const [winnings, setWinnings] = useState(0);

  const { toast } = useToast();
  const animationFrameId = useRef<number>();
  const gameStartTime = useRef<number>();
  const fullCurveData = useRef<{ time: number; value: number }[]>([]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setMultiplier(1.0);
    setChartData([{ time: 0, value: 1 }]);
    setWinnings(0);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, []);

  const runGame = useCallback((finalMultiplier: number) => {
    gameStartTime.current = performance.now();
    setGameState('running');
    
    const animate = (time: number) => {
      const elapsedTime = (time - (gameStartTime.current ?? time)) / 1000;
      const gameDuration = fullCurveData.current.length * 0.05;
      
      const progress = Math.min(elapsedTime / gameDuration, 1);
      const currentIndex = Math.floor(progress * (fullCurveData.current.length - 1));
      const currentMultiplier = fullCurveData.current[currentIndex].value;
      
      setMultiplier(currentMultiplier);
      setChartData(fullCurveData.current.slice(0, currentIndex + 1));

      if (autoCashout > 1 && currentMultiplier >= autoCashout && gameStateRef.current === 'running') {
        handleCashout(autoCashout);
        return;
      }

      if (currentMultiplier < finalMultiplier) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setMultiplier(finalMultiplier);
        setGameState('crashed');
        toast({
          title: 'CRASHED!',
          description: `The rocket crashed at ${finalMultiplier.toFixed(2)}x.`,
          variant: 'destructive',
        });
      }
    };
    animationFrameId.current = requestAnimationFrame(animate);
  }, [autoCashout]);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const handleCashout = useCallback((cashoutMultiplier: number) => {
      if (gameStateRef.current !== 'running') return;
      
      const wonAmount = betAmount * cashoutMultiplier;
      setWinnings(wonAmount);
      setGameState('cashed_out');
      toast({
        title: cashoutMultiplier === autoCashout ? 'Auto Cashed Out!' : 'Cashed Out!',
        description: `You won ${wonAmount.toFixed(2)} credits at ${cashoutMultiplier.toFixed(2)}x!`,
      });
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
  }, [betAmount, autoCashout]);


  const startGameSequence = useCallback(async () => {
    let countdown = 3;
    const countdownInterval = setInterval(async () => {
      if (countdown > 0) {
        toast({ title: `Game starting in ${countdown}...`, duration: 1000 });
        countdown--;
      } else {
        clearInterval(countdownInterval);
        try {
          const seed = Math.random().toString(36).substring(7);
          const result = await generateCrashCurve({ seed });
          if (!result.curveData || result.curveData.length < 2) throw new Error('Invalid curve data.');
          
          const finalMultiplier = result.curveData[result.curveData.length - 1];
          setCrashPoint(finalMultiplier);
          fullCurveData.current = result.curveData.map((value, index) => ({ time: index, value }));
          toast({ title: 'GO!', description: 'The rocket is launching!' });
          runGame(finalMultiplier);

        } catch (error) {
           toast({ title: 'Error', description: 'Could not start game. Please try again.', variant: 'destructive' });
           resetGame();
        }
      }
    }, 1000);
  }, [resetGame, runGame, toast]);

  const handleBet = () => {
    if (betAmount <= 0) {
      toast({ title: 'Invalid Bet', description: 'Bet must be greater than zero.', variant: 'destructive' });
      return;
    }
    resetGame();
    setGameState('betting');
    startGameSequence();
  };

  const renderButton = () => {
    switch (gameState) {
      case 'running':
        return <Button onClick={() => handleCashout(multiplier)} size="lg" className="h-16 w-full bg-green-500 text-xl hover:bg-green-600"><Zap className="mr-2" />Cash Out</Button>;
      case 'betting':
        return <Button disabled size="lg" className="h-16 w-full text-xl">Starting...</Button>;
      default:
        return <Button onClick={handleBet} size="lg" className="h-16 w-full bg-primary text-xl text-primary-foreground hover:bg-primary/90"><Play className="mr-2" />Place Bet</Button>;
    }
  };

  const getMultiplierColor = () => {
    if (gameState === 'crashed') return 'text-destructive';
    if (gameState === 'cashed_out') return 'text-green-500';
    return 'text-primary';
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="relative aspect-video p-2 sm:p-4">
          <div className="absolute inset-0 top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className={`font-headline font-bold transition-colors duration-300 ${getMultiplierColor()}`} style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
              {multiplier.toFixed(2)}x
            </p>
            {gameState === 'crashed' && <p className="text-2xl font-semibold text-destructive">CRASHED</p>}
            {gameState === 'cashed_out' && <p className="text-2xl font-semibold text-green-500">YOU WON {winnings.toFixed(2)}</p>}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[1, 'dataMax + 1']} hide />
              <XAxis dataKey="time" hide />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rocket /> Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {renderButton()}
          <div className="grid gap-2">
            <Label htmlFor="bet-amount" className="flex items-center gap-2"><Wallet />Bet Amount</Label>
            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={gameState === 'running' || gameState === 'betting'} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auto-cashout" className="flex items-center gap-2"><Target />Auto Cash Out</Label>
            <Input id="auto-cashout" type="number" value={autoCashout} onChange={(e) => setAutoCashout(parseFloat(e.target.value) || 0)} placeholder="2.0" disabled={gameState === 'running' || gameState === 'betting'} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
