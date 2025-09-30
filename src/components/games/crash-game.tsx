'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Wallet, Target, Play, Zap, Users, History, Bot, Repeat, ToggleRight } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';


type GamePhase = 'BETTING' | 'RUNNING' | 'CRASHED' | 'ENDED';

type Player = {
  id: number;
  name: string;
  avatar: string;
  bet: number;
  cashedOutAt?: number;
  winnings?: number;
  isBot?: boolean;
};

const prng = (seed: number) => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const generateCrashPoint = (seed: number) => {
    const r = prng(seed);
    const crash = 1 / (1 - r);
    return Math.max(1.01, parseFloat(crash.toFixed(2)));
};

const generateCurveData = (crashPoint: number) => {
    const data = [];
    const duration = Math.log(crashPoint) * 5; 
    const steps = duration * 60; 

    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * duration;
        const multiplier = Math.pow(Math.E, t / 5);
        if (multiplier >= crashPoint) {
            data.push({ time: t, value: crashPoint });
            break;
        }
        data.push({ time: t, value: multiplier });
    }
    return data;
};


const initialPlayers: Player[] = [
    { id: 1, name: "MysticGambler", avatar: "https://picsum.photos/seed/rank1/40/40", bet: 150 },
    { id: 2, name: "CasinoQueen", avatar: "https://picsum.photos/seed/rank2/40/40", bet: 25 },
    { id: 3, name: "JackpotJoe", avatar: "https://picsum.photos/seed/rank3/40/40", bet: 500 },
    { id: 4, name: "BettingKing", avatar: "https://picsum.photos/seed/rank4/40/40", bet: 75, isBot: true },
    { id: 5, name: "LuckyLucy", avatar: "https://picsum.photos/seed/rank5/40/40", bet: 1000 },
    { id: 6, name: "HighRoller", avatar: "https://picsum.photos/seed/rank8/40/40", bet: 250, isBot: true },
];


export default function CrashGame() {
  const { language } = useLanguage();
  const t = translations[language];

  // Game state
  const [phase, setPhase] = useState<GamePhase>('BETTING');
  const [countdown, setCountdown] = useState(5);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<number[]>([1.23, 4.56, 2.01, 10.89, 1.01, 3.14, 5.00]);
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>([{ time: 0, value: 1.0 }]);

  // Player state
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);

  // Refs
  const phaseRef = useRef(phase);
  const gameLoopTimeout = useRef<NodeJS.Timeout>();
  const animationFrameId = useRef<number>();
  const gameStartTime = useRef<number>();
  const fullCurveData = useRef<{ time: number; value: number }[]>([]);
  const crashPoint = useRef<number>(1.0);

  const { balance, setBalance } = useBalance();
  const { toast } = useToast();

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);


  const startBettingPhase = useCallback(() => {
    setPhase('BETTING');
    setHasPlacedBet(false);
    setCashedOut(false);
    setMultiplier(1.00);
    setChartData([{ time: 0, value: 1.0 }]);
    // Simulate new players joining
    setPlayers(initialPlayers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 3));

    let countdownValue = 5;
    setCountdown(countdownValue);
    const countdownInterval = setInterval(() => {
        countdownValue--;
        setCountdown(countdownValue);
        if (countdownValue <= 0) {
            clearInterval(countdownInterval);
            startGame();
        }
    }, 1000);
  }, []);

  useEffect(() => {
    startBettingPhase();
    return () => {
        if(gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeBet = () => {
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

  const handleCashout = useCallback((cashoutMultiplier: number) => {
      if (!hasPlacedBet || cashedOut) return;

      const wonAmount = betAmount * cashoutMultiplier;
      setBalance(prev => prev + wonAmount);
      setCashedOut(true);

      toast({
        title: cashoutMultiplier === autoCashout && autoCashoutEnabled ? t.autoCashedOut : t.cashedOut,
        description: `${t.youWonAmount} ${wonAmount.toFixed(2)} ${t.creditsAt} ${cashoutMultiplier.toFixed(2)}x!`,
      });
  }, [betAmount, autoCashout, autoCashoutEnabled, hasPlacedBet, cashedOut, setBalance, toast, t]);

  const runAnimation = useCallback(() => {
    gameStartTime.current = performance.now();

    const animate = (time: number) => {
      if(phaseRef.current === 'BETTING') {
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
      
      setMultiplier(currentMultiplier);
      
      const dataIndex = Math.min(Math.floor((elapsedTime / finalTime) * fullCurveData.current.length), fullCurveData.current.length-1)
      setChartData(fullCurveData.current.slice(0, dataIndex + 1));
      
      if (hasPlacedBet && !cashedOut && autoCashoutEnabled && currentMultiplier >= autoCashout) {
        handleCashout(autoCashout);
      }
      
      if (currentMultiplier < crashPoint.current) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setMultiplier(crashPoint.current);
        setPhase('CRASHED');
        
        if(hasPlacedBet && !cashedOut) {
            toast({
              title: t.crashedTitle,
              description: `${t.rocketCrashedAt} ${crashPoint.current.toFixed(2)}x.`,
              variant: 'destructive',
            });
        }
        
        setHistory(prev => [crashPoint.current, ...prev].slice(0, 10));

        gameLoopTimeout.current = setTimeout(startBettingPhase, 3000);
      }
    };
    animationFrameId.current = requestAnimationFrame(animate);
  }, [autoCashout, handleCashout, toast, t, hasPlacedBet, cashedOut, autoCashoutEnabled, startBettingPhase]);


  const startGame = useCallback(async () => {
    try {
        const seed = Date.now() + Math.random();
        crashPoint.current = generateCrashPoint(seed);
        fullCurveData.current = generateCurveData(crashPoint.current);
        if (!fullCurveData.current || fullCurveData.current.length === 0) throw new Error('Invalid curve data.');

        setPhase('RUNNING');
        runAnimation();

    } catch (error) {
       toast({ title: t.error, description: t.couldNotStartGame, variant: 'destructive' });
       gameLoopTimeout.current = setTimeout(startBettingPhase, 2000);
    }
  }, [runAnimation, toast, t, startBettingPhase]);
  
  const quickBet = (action: 'half' | 'double' | 'min' | 'max') => {
    if (action === 'min') {
        setBetAmount(1);
    }
    if (action === 'max') {
        setBetAmount(balance);
    }
    if (action === 'half') {
        setBetAmount(prev => Math.max(1, parseFloat((prev / 2).toFixed(2))));
    }
    if (action === 'double') {
        setBetAmount(prev => parseFloat((prev * 2).toFixed(2)));
    }
  }

  const getMultiplierColor = () => {
    if (phase === 'BETTING') return 'text-muted-foreground';
    if (phase === 'CRASHED') return 'text-destructive';
    if (cashedOut) return 'text-green-500';
    return 'text-accent';
  };

  const MainButton = () => {
    if (phase === 'RUNNING') {
        if (!hasPlacedBet) {
             return <Button disabled size="lg" className="h-16 w-full text-xl">Ожидание следующего раунда</Button>
        }
        if (cashedOut) {
             return <Button disabled size="lg" className="h-16 w-full text-xl bg-green-500/20 text-green-400">Выигрыш забран!</Button>
        }
        return <Button onClick={() => handleCashout(multiplier)} size="lg" className="h-16 w-full text-xl bg-green-500 hover:bg-green-600"><Zap className="mr-2" />{t.cashOut} {multiplier.toFixed(2)}x</Button>;
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
                             <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={p.avatar} />
                                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{p.name}</span>
                                {p.isBot && <Bot className="h-4 w-4 text-muted-foreground"/>}
                             </div>
                              <div className="text-right">
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
                <div className="absolute inset-0 top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
                    {phase === 'BETTING' ? (
                        <>
                            <p className="text-2xl font-semibold text-muted-foreground">Раунд начнется через</p>
                            <p className="font-headline font-bold text-7xl text-foreground drop-shadow-lg">
                                {countdown.toFixed(1)}
                            </p>
                        </>
                    ) : (
                         <p className={`font-headline font-bold transition-colors duration-300 drop-shadow-lg ${getMultiplierColor()}`} style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}>
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
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" strokeWidth={3} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="bg-card/80">
                <CardContent className="p-6 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-6">
                         <div className="grid gap-2">
                            <Label htmlFor="bet-amount" className="flex items-center gap-2"><Wallet />{t.betAmount}</Label>
                            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={hasPlacedBet} className="h-12 text-lg"/>
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
                 <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><History/> История раундов</h3>
                 <div className="grid grid-cols-3 gap-2 text-center">
                    {history.map((h, i) => (
                         <div key={i} className={cn("p-2 rounded-lg font-bold", h >= 10 ? 'text-purple-400' : h >= 2 ? 'text-green-400' : 'text-red-400', 'bg-secondary')}>
                            {h.toFixed(2)}x
                         </div>
                    ))}
                 </div>
            </CardContent>
        </Card>

    </div>
  );
}
