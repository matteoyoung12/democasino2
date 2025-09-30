
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Wallet, Target, Play, Zap, Users, History } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';


type GamePhase = 'BETTING' | 'RUNNING' | 'CRASHED';

type Player = {
  id: number;
  name: string;
  avatar: string;
  bet: number;
  cashedOutAt?: number;
  winnings?: number;
};

// Simple pseudo-random number generator for deterministic results based on a seed
const prng = (seed: number) => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Generates a crash point using the seed. The distribution is skewed towards lower numbers.
const generateCrashPoint = (seed: number) => {
    const r = prng(seed);
    // This formula creates a distribution where low multipliers are more common.
    const crash = 1 / (1 - r);
    return Math.max(1.01, parseFloat(crash.toFixed(2)));
};

// Generates the data for the chart's curve based on the crash point
const generateCurveData = (crashPoint: number) => {
    const data = [];
    // The duration of the game is logarithmically related to the crash point, making high-multiplier games longer.
    const duration = Math.log(crashPoint) * 5; 
    const steps = Math.max(120, duration * 60); // At least 120 steps for a smooth curve

    for (let i = 0; i <= steps; i++) {
        const t = (i / steps);
        // Use a power curve (t^2.5) for a smooth start, making the initial growth slower.
        const multiplier = 1 + (crashPoint - 1) * Math.pow(t, 2.5);
        data.push({ time: t, value: multiplier });
    }
    // Ensure the final point is exactly the crash point
    if (data[data.length - 1].value < crashPoint) {
       data.push({ time: 1, value: crashPoint });
    }
    return data;
};


const initialPlayers: Player[] = [
    { id: 1, name: "MysticGambler", avatar: "https://picsum.photos/seed/rank1/40/40", bet: 150 },
    { id: 2, name: "CasinoQueen", avatar: "https://picsum.photos/seed/rank2/40/40", bet: 25 },
    { id: 3, name: "JackpotJoe", avatar: "https://picsum.photos/seed/rank3/40/40", bet: 500 },
    { id: 4, name: "BettingKing", avatar: "https://picsum.photos/seed/rank4/40/40", bet: 75 },
    { id: 5, name: "LuckyLucy", avatar: "https://picsum.photos/seed/rank5/40/40", bet: 1000 },
    { id: 6, name: "HighRoller", avatar: "https://picsum.photos/seed/rank8/40/40", bet: 250 },
];


export default function CrashGame() {
  const { language } = useLanguage();
  const t = translations[language];

  // Game state
  const [phase, setPhase] = useState<GamePhase>('BETTING');
  const [countdown, setCountdown] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<number[]>([1.23, 4.56, 2.01, 10.89, 1.01, 3.14, 5.00, 1.74, 1.35, 18.40, 6.70, 2.69]);
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>([{ time: 0, value: 1.0 }]);

  // Player state
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(true);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [isCashedOut, setIsCashedOut] = useState(false);
  
  const { balance, setBalance } = useBalance();
  const { toast } = useToast();

  const gameLogicRef = useRef({
      animationFrameId: 0,
      crashPoint: 1,
      curve: [] as { time: number; value: number }[],
      startTime: 0,
      gameDuration: 0,
  });

  const playerStateRef = useRef({
      hasPlacedBet,
      isCashedOut,
      betAmount,
      autoCashoutEnabled,
      autoCashout,
  });
  
  // Keep the ref updated with the latest state
  useEffect(() => {
      playerStateRef.current = {
          hasPlacedBet,
          isCashedOut,
          betAmount,
          autoCashoutEnabled,
          autoCashout,
      };
  }, [hasPlacedBet, isCashedOut, betAmount, autoCashoutEnabled, autoCashout]);
  
  const handleCashout = useCallback((cashoutMultiplier: number, isAuto: boolean) => {
    if (!playerStateRef.current.hasPlacedBet || isCashedOut) return;

    setIsCashedOut(true); // This now correctly updates the state
    const bet = playerStateRef.current.betAmount;
    const wonAmount = bet * cashoutMultiplier;
    setBalance(prev => prev + wonAmount);

    toast({
        title: isAuto ? t.autoCashedOut : t.cashedOut,
        description: `${t.youWonAmount} ${wonAmount.toFixed(2)} ${t.creditsAt} ${cashoutMultiplier.toFixed(2)}x!`,
    });
  }, [setBalance, t, toast, isCashedOut]); // Add isCashedOut to dependencies


  const runGame = useCallback(() => {
      const seed = Date.now() + Math.random();
      const crashPoint = generateCrashPoint(seed);
      const curve = generateCurveData(crashPoint);
      const startTime = Date.now();
      const gameDuration = Math.log(crashPoint) * 5 * 1000;

      gameLogicRef.current = { ...gameLogicRef.current, crashPoint, curve, startTime, gameDuration };

      const animate = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / gameDuration, 1);
          
          let currentMultiplier: number;
          if (progress >= 1) {
              currentMultiplier = crashPoint;
          } else {
              const curveIndex = Math.floor(progress * (curve.length - 1));
              currentMultiplier = curve[curveIndex]?.value || 1;
          }

          setMultiplier(currentMultiplier);
          const dataIndex = Math.min(Math.floor(progress * curve.length), curve.length-1);
          setChartData(curve.slice(0, dataIndex + 1));
          
          if (playerStateRef.current.hasPlacedBet && !playerStateRef.current.isCashedOut && playerStateRef.current.autoCashoutEnabled && currentMultiplier >= playerStateRef.current.autoCashout) {
            handleCashout(playerStateRef.current.autoCashout, true);
          }
          
          if (progress < 1) {
            gameLogicRef.current.animationFrameId = requestAnimationFrame(animate);
          } else {
            setMultiplier(crashPoint);
            setPhase('CRASHED');
          }
      };
      
      gameLogicRef.current.animationFrameId = requestAnimationFrame(animate);
  }, [handleCashout]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (phase === 'BETTING') {
      setIsCashedOut(false);
      setHasPlacedBet(false);
      setMultiplier(1.00);
      setChartData([{ time: 0, value: 1.0 }]);
      setPlayers(initialPlayers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 3));

      let count = 10;
      setCountdown(count);
      interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setPhase('RUNNING');
        }
      }, 1000);

    } else if (phase === 'RUNNING') {
      runGame();
    } else if (phase === 'CRASHED') {
      const crashPoint = gameLogicRef.current.crashPoint;
      if (playerStateRef.current.hasPlacedBet && !playerStateRef.current.isCashedOut) {
        toast({
          title: t.crashedTitle,
          description: `${t.rocketCrashedAt} ${crashPoint.toFixed(2)}x.`,
          variant: 'destructive',
        });
      }
      setHistory(prev => [crashPoint, ...prev].slice(0, 20));

      interval = setTimeout(() => {
        setPhase('BETTING');
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (gameLogicRef.current.animationFrameId) cancelAnimationFrame(gameLogicRef.current.animationFrameId);
    };
  }, [phase, runGame, t, toast]);


  const placeBet = () => {
      if (hasPlacedBet) return;
      if (betAmount <= 0) {
        toast({ title: t.invalidBet, description: t.betMustBePositive, variant: 'destructive' });
        return;
      }
       if (balance < betAmount) {
        toast({ title: t.insufficientBalance, variant: 'destructive' });
        return;
      }
      setBalance(prev => prev - betAmount);
      setHasPlacedBet(true);
      toast({title: "Ставка принята!", description: `Ваша ставка ${betAmount} ₽ будет сыграна в следующем раунде.`});
  }
  
  const quickBet = (action: 'half' | 'double' | 'min' | 'max') => {
    if (hasPlacedBet) return;
    if (action === 'min') {
        setBetAmount(1);
    } else if (action === 'max') {
        setBetAmount(balance);
    } else if (action === 'half') {
        setBetAmount(prev => Math.max(1, parseFloat((prev / 2).toFixed(2))));
    } else if (action === 'double') {
        setBetAmount(prev => parseFloat((prev * 2).toFixed(2)));
    }
  }

  const getMultiplierColor = () => {
    if (phase === 'BETTING') return 'text-muted-foreground';
    if (phase === 'CRASHED') return 'text-destructive';
    if (isCashedOut) return 'text-green-500';
    return 'text-accent';
  };

  const MainButton = () => {
    if (phase === 'RUNNING') {
        if (!hasPlacedBet) {
             return <Button disabled size="lg" className="h-16 w-full text-xl">Ожидание следующего раунда</Button>
        }
        if (isCashedOut) {
             return <Button disabled size="lg" className="h-16 w-full text-xl bg-green-500/20 text-green-400">Выигрыш забран!</Button>
        }
        return <Button onClick={() => handleCashout(multiplier, false)} size="lg" className="h-16 w-full text-xl bg-green-500 hover:bg-green-600"><Zap className="mr-2" />{t.cashOut} {multiplier.toFixed(2)}x</Button>;
    }
    
    if (hasPlacedBet) {
        return <Button disabled size="lg" className="h-16 w-full text-xl bg-green-500/20 text-green-400">Ставка сделана</Button>;
    }

    return <Button onClick={placeBet} size="lg" className="h-16 w-full text-xl"><Play className="mr-2" />{t.placeBet}</Button>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
        {/* Players List */}
        <Card className="lg:col-span-2 bg-card/80">
            <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Users/> Текущие игроки ({players.length})</h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {players.map(p => (
                         <div key={p.id} className="flex items-center justify-between bg-secondary p-2 rounded-lg text-sm">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={p.avatar} />
                                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className='truncate'>{p.name}</span>
                             </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-bold">{p.bet} ₽</div>
                                {p.cashedOutAt && <div className="text-green-400">{p.cashedOutAt.toFixed(2)}x</div>}
                              </div>
                         </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Main Game Area */}
        <div className="lg:col-span-6 flex flex-col gap-6">
            <Card className="flex-grow bg-card/80 backdrop-blur-sm">
                <CardContent className="relative aspect-video p-0 h-full">
                <div className="absolute inset-0 top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    {phase === 'BETTING' ? (
                        <>
                            <p className="text-2xl font-semibold text-muted-foreground">Раунд начнется через</p>
                            <p className="font-headline font-bold text-7xl text-foreground drop-shadow-lg">
                                {countdown.toFixed(0)}
                            </p>
                        </>
                    ) : (
                         <p className={cn('font-headline font-bold transition-colors duration-300 drop-shadow-lg', getMultiplierColor())} style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}>
                            {multiplier.toFixed(2)}x
                         </p>
                    )}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" strokeWidth={3} dot={false} isAnimationActive={false}/>
                    </AreaChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="bg-card/80">
                <CardContent className="p-6 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-6">
                         <div className="grid gap-2">
                            <Label htmlFor="bet-amount" className="flex items-center gap-2"><Wallet />{t.betAmount}</Label>
                            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} disabled={hasPlacedBet} className="h-12 text-lg"/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="auto-cashout" className="flex items-center gap-2"><Target />{t.autoCashOut}</Label>
                            <div className='flex items-center gap-2'>
                                <Input id="auto-cashout" type="number" value={autoCashout} onChange={(e) => setAutoCashout(parseFloat(e.target.value) || 0)} placeholder="2.0" disabled={hasPlacedBet} className="h-12 text-lg" />
                                <Switch checked={autoCashoutEnabled} onCheckedChange={setAutoCashoutEnabled} disabled={hasPlacedBet} />
                            </div>
                        </div>
                    </div>
                     <div className="grid grid-cols-4 gap-2">
                        <Button variant="secondary" onClick={() => quickBet('min')} disabled={hasPlacedBet}>Мин.</Button>
                        <Button variant="secondary" onClick={() => quickBet('half')} disabled={hasPlacedBet}>1/2</Button>
                        <Button variant="secondary" onClick={() => quickBet('double')} disabled={hasPlacedBet}>x2</Button>
                        <Button variant="secondary" onClick={() => quickBet('max')} disabled={hasPlacedBet}>На все</Button>
                    </div>
                    <MainButton />
                </CardContent>
            </Card>
        </div>

        {/* History */}
        <Card className="lg:col-span-2 bg-card/80">
            <CardContent className="p-4">
                 <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><History/> История раундов</h3>
                 <div className="grid gap-2" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))'}}>
                    {history.map((h, i) => (
                         <div key={i} className={cn("p-3 rounded-lg font-bold text-lg text-center", h >= 10 ? 'text-purple-400' : h >= 2 ? 'text-green-400' : 'text-red-400', 'bg-secondary')}>
                            {h.toFixed(2)}x
                         </div>
                    ))}
                 </div>
            </CardContent>
        </Card>

    </div>
  );
}

    