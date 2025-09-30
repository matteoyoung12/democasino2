
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, YAxis, XAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Wallet, Target, Play, Zap } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

type GameState = 'idle' | 'betting' | 'running' | 'crashed' | 'cashed_out';

// A simple deterministic pseudo-random number generator
const prng = (seed: number) => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Generate a plausible crash point. This is for client-side simulation only.
// The actual crash point should be determined by the server in a real app.
const generateCrashPoint = (seed: number) => {
    const r = prng(seed);
    // Formula to make lower multipliers more common
    const crash = 1 / (1 - r);
    return Math.max(1, crash);
};

const generateCurveData = (crashPoint: number) => {
    const data = [];
    // Grow quickly at first, then slow down
    for (let i = 0; i < 1000; i++) {
        const time = i / 20; // Adjust for speed
        const multiplier = 1 + (time * time) / 50;
        if (multiplier >= crashPoint) {
            data.push({ time, value: crashPoint });
            break;
        }
        data.push({ time, value: multiplier });
    }
    return data;
};

export default function CrashGame() {
  const { language } = useLanguage();
  const t = translations[language];

  const [gameState, setGameState] = useState<GameState>('idle');
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>([{ time: 0, value: 1 }]);
  const [winnings, setWinnings] = useState(0);

  const { balance, setBalance } = useBalance();
  const { toast } = useToast();
  
  const animationFrameId = useRef<number>();
  const gameStartTime = useRef<number>();
  const fullCurveData = useRef<{ time: number; value: number }[]>([]);
  const crashPoint = useRef<number>(1.0);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);


  const resetGame = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setGameState('idle');
    setMultiplier(1.0);
    setChartData([{ time: 0, value: 1 }]);
    setWinnings(0);
  }, []);

  const handleCashout = useCallback((cashoutMultiplier: number) => {
      if (gameStateRef.current !== 'running') return;
      
      const wonAmount = betAmount * cashoutMultiplier;
      setWinnings(wonAmount);
      setBalance(prev => prev + wonAmount);
      setGameState('cashed_out');
      toast({
        title: cashoutMultiplier === autoCashout ? t.autoCashedOut : t.cashedOut,
        description: `${t.youWonAmount} ${wonAmount.toFixed(2)} ${t.creditsAt} ${cashoutMultiplier.toFixed(2)}x!`,
      });
  }, [betAmount, autoCashout, setBalance, toast, t]);

  const runGame = useCallback(() => {
    gameStartTime.current = performance.now();
    setGameState('running');
    
    const animate = (time: number) => {
      if(gameStateRef.current === 'idle') {
          if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
          return;
      }

      const elapsedTime = (time - (gameStartTime.current ?? time));
      const finalTime = fullCurveData.current[fullCurveData.current.length-1].time * 1000;

      let currentMultiplier: number;
      if(elapsedTime >= finalTime) {
        currentMultiplier = crashPoint.current;
      } else {
        const progress = elapsedTime / finalTime;
        const currentIndex = Math.floor(progress * (fullCurveData.current.length - 1));
        currentMultiplier = fullCurveData.current[currentIndex]?.value ?? 1.0;
      }
      
      if(gameStateRef.current === 'running') {
        setMultiplier(currentMultiplier);
      }
      
      const dataIndex = Math.min(Math.floor((elapsedTime / finalTime) * fullCurveData.current.length), fullCurveData.current.length-1)
      setChartData(fullCurveData.current.slice(0, dataIndex + 1));
      
      if (gameStateRef.current === 'running' && autoCashout > 1 && currentMultiplier >= autoCashout) {
        handleCashout(autoCashout);
      }
      
      if (currentMultiplier < crashPoint.current) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        if(gameStateRef.current === 'running') {
            setMultiplier(crashPoint.current);
            setGameState('crashed');
            toast({
              title: t.crashedTitle,
              description: `${t.rocketCrashedAt} ${crashPoint.current.toFixed(2)}x.`,
              variant: 'destructive',
            });
        } else if (gameStateRef.current === 'cashed_out') {
            setMultiplier(crashPoint.current); // Update to final crash point
            setGameState('crashed'); // Transition to final state
        }
      }
    };
    animationFrameId.current = requestAnimationFrame(animate);
  }, [autoCashout, handleCashout, toast, t]);


  const startGameSequence = useCallback(async () => {
    let countdown = 3;
    const countdownInterval = setInterval(async () => {
      if (countdown > 0) {
        toast({ title: `${t.gameStartingIn} ${countdown}...`, duration: 1000 });
        countdown--;
      } else {
        clearInterval(countdownInterval);
        try {
          const seed = Date.now() + Math.random();
          crashPoint.current = generateCrashPoint(seed);
          fullCurveData.current = generateCurveData(crashPoint.current);
          
          if (!fullCurveData.current || fullCurveData.current.length === 0) throw new Error('Invalid curve data.');

          toast({ title: t.go, description: t.rocketLaunching });
          runGame();

        } catch (error) {
           toast({ title: t.error, description: t.couldNotStartGame, variant: 'destructive' });
           resetGame();
        }
      }
    }, 1000);
  }, [resetGame, runGame, toast, t]);

  const handleBet = () => {
    if (betAmount <= 0) {
      toast({ title: t.invalidBet, description: t.betMustBePositive, variant: 'destructive' });
      return;
    }
     if (balance < betAmount) {
      toast({ title: t.insufficientBalance, variant: 'destructive' });
      return;
    }
    resetGame();
    setBalance(prev => prev - betAmount);
    setGameState('betting');
    startGameSequence();
  };

  const renderButton = () => {
    switch (gameState) {
      case 'running':
        return <Button onClick={() => handleCashout(multiplier)} size="lg" className="h-16 w-full bg-green-500 text-xl hover:bg-green-600"><Zap className="mr-2" />{t.cashOut}</Button>;
      case 'betting':
        return <Button disabled size="lg" className="h-16 w-full text-xl">{t.starting}</Button>;
      case 'cashed_out':
        return <Button disabled size="lg" className="h-16 w-full text-xl bg-green-500">{t.cashedOut}</Button>;
      case 'crashed':
         return <Button onClick={handleBet} size="lg" className="h-14 w-full text-xl"><Play className="mr-2" />{t.playAgain}</Button>;
      default:
        return <Button onClick={handleBet} size="lg" className="h-14 w-full text-xl"><Play className="mr-2" />{t.placeBet}</Button>;
    }
  };

  const getMultiplierColor = () => {
    if (gameState === 'crashed' && winnings === 0) return 'text-destructive';
    if (gameState === 'cashed_out' || (gameState === 'crashed' && winnings > 0)) return 'text-green-500';
    if (gameState === 'crashed') return 'text-destructive';
    return 'text-accent';
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm">
        <CardContent className="relative aspect-video p-0">
          <div className="absolute inset-0 top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className={`font-headline font-bold transition-colors duration-300 ${getMultiplierColor()}`} style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
              {multiplier.toFixed(2)}x
            </p>
            {gameState === 'crashed' && winnings === 0 && <p className="text-2xl font-semibold text-destructive">{t.crashed.toUpperCase()}</p>}
            {(gameState === 'cashed_out' || (gameState === 'crashed' && winnings > 0)) && <p className="text-2xl font-semibold text-green-500">{t.youWon.toUpperCase()} {winnings.toFixed(2)}</p>}
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
              <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} hide />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rocket />{t.controls}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="bet-amount" className="flex items-center gap-2"><Wallet />{t.betAmount}</Label>
            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={gameState === 'running' || gameState === 'betting' || gameState === 'cashed_out'} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auto-cashout" className="flex items-center gap-2"><Target />{t.autoCashOut}</Label>
            <Input id="auto-cashout" type="number" value={autoCashout} onChange={(e) => setAutoCashout(parseFloat(e.target.value) || 0)} placeholder="2.0" disabled={gameState === 'running' || gameState === 'betting' || gameState === 'cashed_out'} />
          </div>
        </CardContent>
        <CardFooter>
            {renderButton()}
        </CardFooter>
      </Card>
    </div>
  );
}
