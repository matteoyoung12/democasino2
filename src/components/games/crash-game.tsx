
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Minus, Plus } from 'lucide-react';
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type GamePhase = 'BETTING' | 'RUNNING' | 'CRASHED';

type Player = {
  id: number;
  name: string;
  avatar: string;
  bet: number;
  cashedOutAt?: number;
  winnings?: number;
};

// --- Game Logic Engine ---
// Using PRNG for deterministic randomness based on a seed
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
    const steps = Math.max(120, duration * 60);

    for (let i = 0; i <= steps; i++) {
        const t = (i / steps);
        const multiplier = 1 + (crashPoint - 1) * Math.pow(t, 2.5);
        data.push({ time: t, value: multiplier });
    }
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
    { id: 7, name: "PokerPro", avatar: "https://picsum.photos/seed/rank6/40/40", bet: 760 },
    { id: 8, name: "RouletteRick", avatar: "https://picsum.photos/seed/rank7/40/40", bet: 650 },
];


export default function CrashGame() {
  const { language } = useLanguage();
  const t = translations[language];
  const { balance, setBalance } = useBalance();
  const { toast } = useToast();
  
  // --- State Management ---
  const [phase, setPhase] = useState<GamePhase>('BETTING');
  const [countdown, setCountdown] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<number[]>([1.23, 4.56, 2.01, 10.89, 1.01, 3.14, 5.00, 1.74, 1.35, 18.40, 6.70, 2.69]);
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>([{ time: 0, value: 1.0 }]);
  const [players, setPlayers] = useState<Player[]>([]);
  
  // --- User Input State ---
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState(1.15);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(true);

  // --- Refs for reliable state access in game loop ---
  const playerStateRef = useRef({
      hasPlacedBet: false,
      isCashedOut: false,
      currentBetAmount: 100,
  });

  const gameLogicRef = useRef({
      animationFrameId: 0,
      crashPoint: 1,
      startTime: 0,
  });

  // --- Game Loop and State Transitions ---
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (phase === 'BETTING') {
      // Reset for new round
      playerStateRef.current.hasPlacedBet = false;
      playerStateRef.current.isCashedOut = false;
      setMultiplier(1.00);
      setChartData([{ time: 0, value: 1.0 }]);
      setPlayers(initialPlayers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 6) + 5));

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
      cancelAnimationFrame(gameLogicRef.current.animationFrameId);
      const crashPoint = gameLogicRef.current.crashPoint;

      // Handle loss
      if (playerStateRef.current.hasPlacedBet && !playerStateRef.current.isCashedOut) {
        toast({
          title: t.crashedTitle,
          description: `${t.rocketCrashedAt} ${crashPoint.toFixed(2)}x.`,
          variant: 'destructive',
        });
      }
      
      // Update history and prepare for next round
      setHistory(prev => [crashPoint, ...prev].slice(0, 20));
      interval = setTimeout(() => {
        setPhase('BETTING');
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (gameLogicRef.current.animationFrameId) {
        cancelAnimationFrame(gameLogicRef.current.animationFrameId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // --- Core Game Animation ---
  const runGame = useCallback(() => {
      const seed = Date.now() + Math.random();
      const crashPoint = generateCrashPoint(seed);
      const curve = generateCurveData(crashPoint);
      const startTime = Date.now();
      const gameDuration = Math.log(crashPoint) * 5 * 1000;

      gameLogicRef.current.crashPoint = crashPoint;
      gameLogicRef.current.startTime = startTime;

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
          const dataIndex = Math.min(Math.floor(progress * curve.length), curve.length - 1);
          setChartData(curve.slice(0, dataIndex + 1));
          
          // Auto-cashout logic
          if (
              playerStateRef.current.hasPlacedBet && 
              !playerStateRef.current.isCashedOut && 
              autoCashoutEnabled && 
              currentMultiplier >= autoCashout
          ) {
            // Using a function call to ensure the latest state is used
            handleCashout(currentMultiplier);
          }
          
          if (progress < 1) {
            gameLogicRef.current.animationFrameId = requestAnimationFrame(animate);
          } else {
            setMultiplier(crashPoint);
            setPhase('CRASHED');
          }
      };
      
      gameLogicRef.current.animationFrameId = requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCashout, autoCashoutEnabled]);
  
  // --- User Actions ---
  const placeBet = () => {
      if (playerStateRef.current.hasPlacedBet) return;
      if (betAmount <= 0) {
        toast({ title: t.invalidBet, description: t.betMustBePositive, variant: 'destructive' });
        return;
      }
       if (balance < betAmount) {
        toast({ title: t.insufficientBalance, variant: 'destructive' });
        return;
      }
      setBalance(prev => prev - betAmount);
      playerStateRef.current.hasPlacedBet = true;
      playerStateRef.current.currentBetAmount = betAmount;
      toast({title: "Ставка принята!", description: `Ваша ставка ${betAmount} ₽ будет сыграна в следующем раунде.`});
  };

  const handleCashout = (cashoutMultiplier: number) => {
    if (!playerStateRef.current.hasPlacedBet || playerStateRef.current.isCashedOut) return;

    playerStateRef.current.isCashedOut = true;
    const bet = playerStateRef.current.currentBetAmount;
    const wonAmount = bet * cashoutMultiplier;
    setBalance(prev => prev + wonAmount);

    toast({
        title: t.cashedOut,
        description: `${t.youWonAmount} ${wonAmount.toFixed(2)} ${t.creditsAt} ${cashoutMultiplier.toFixed(2)}x!`,
    });
  };
  
  // --- UI Helpers ---
  const getMultiplierColor = (val: number) => {
    if (val >= 10) return 'text-purple-400';
    if (val >= 2) return 'text-cyan-400';
    return 'text-blue-400';
  };
  
  const MainButton = () => {
    if (phase === 'RUNNING') {
        if (!playerStateRef.current.hasPlacedBet) {
             return <Button disabled size="lg" className="h-16 w-full text-xl bg-yellow-500 text-black">Ожидание следующего раунда</Button>
        }
        if (playerStateRef.current.isCashedOut) {
             return <Button disabled size="lg" className="h-16 w-full text-xl bg-yellow-500 text-black">Выигрыш забран!</Button>
        }
        return <Button onClick={() => handleCashout(multiplier)} size="lg" className="h-16 w-full text-xl bg-green-500 text-white hover:bg-green-600">Забрать {multiplier.toFixed(2)}x</Button>;
    }
    
    if (phase === 'CRASHED' || phase === 'BETTING') {
        if (playerStateRef.current.hasPlacedBet) {
            return <Button disabled size="lg" className="h-16 w-full text-xl bg-yellow-500 text-black">Ожидание нового раунда</Button>;
        }
        return <Button onClick={placeBet} size="lg" className="h-16 w-full text-xl bg-green-500 text-white hover:bg-green-600">Сделать ставку</Button>;
    }
    return null;
  }

  const adjustBet = (amount: number) => {
      setBetAmount(prev => Math.max(0, prev + amount));
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-full bg-[#1A242D] text-white p-4">
        {/* Players List (Left) */}
        <div className="col-span-3 bg-[#0F1923] p-4 rounded-lg flex flex-col">
            <Tabs defaultValue="all" className="w-full flex flex-col flex-grow">
                <TabsList className="grid w-full grid-cols-3 bg-[#2F3B44]">
                    <TabsTrigger value="all">Все ставки</TabsTrigger>
                    <TabsTrigger value="my">Мои</TabsTrigger>
                    <TabsTrigger value="top">Топ</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="flex-grow mt-4 overflow-hidden">
                     <div className="space-y-2 h-full overflow-y-auto">
                        <div className="grid grid-cols-4 text-xs text-gray-400 font-bold p-2 sticky top-0 bg-[#0F1923]">
                            <span>Время</span>
                            <span>Ставка</span>
                            <span>Коэфф.</span>
                            <span>Выигрыш</span>
                        </div>
                        {players.map(p => (
                             <div key={p.id} className="grid grid-cols-4 items-center bg-[#1A242D] p-2 rounded-lg text-sm">
                                 <div className="flex items-center gap-2 col-span-1">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={p.avatar} />
                                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                 </div>
                                  <div className="font-bold col-span-1">{p.bet} ₽</div>
                                  <div className={cn("font-bold col-span-1", getMultiplierColor(p.cashedOutAt || 1))}>{p.cashedOutAt ? `${p.cashedOutAt.toFixed(2)}x` : '-'}</div>
                                  <div className="text-green-400 font-bold col-span-1">{p.winnings ? `${p.winnings.toFixed(2)} ₽` : '-'}</div>
                             </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        {/* Main Game Area (Center) */}
        <div className="col-span-9 flex flex-col gap-4">
            <div className="flex gap-2 bg-[#0F1923] p-2 rounded-md overflow-x-auto">
                {history.map((h, i) => (
                    <div key={i} className={cn("py-1 px-3 rounded-full font-bold text-sm text-center bg-[#1A242D] flex-shrink-0", getMultiplierColor(h))}>
                        {h.toFixed(2)}x
                    </div>
                ))}
            </div>

            <div className="flex-grow bg-[#0F1923] rounded-lg relative">
                <div className="absolute inset-0 top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    {phase === 'BETTING' ? (
                        <>
                            <p className="text-xl font-semibold text-gray-400">Раунд начнется через</p>
                            <p className="font-bold text-7xl text-white drop-shadow-lg">
                                {countdown.toFixed(1)}
                            </p>
                        </>
                    ) : (
                         <p className={cn('font-bold transition-colors duration-300 drop-shadow-lg text-8xl', phase === 'CRASHED' ? 'text-red-500' : 'text-white')} >
                            {multiplier.toFixed(2)}x
                         </p>
                    )}
                     {phase === 'CRASHED' && <p className="font-bold text-4xl text-red-500 mt-4">CRASHED</p>}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorCrash" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF4F4F" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#FF4F4F" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#FF4F4F" fillOpacity={1} fill="url(#colorCrash)" strokeWidth={4} dot={false} isAnimationActive={false}/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0F1923] p-4 rounded-lg">
                    <Tabs defaultValue="bet" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-[#1A242D] mb-4">
                            <TabsTrigger value="bet">Ставка</TabsTrigger>
                            <TabsTrigger value="auto">Авто</TabsTrigger>
                        </TabsList>
                        <TabsContent value="bet">
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="relative col-span-2">
                                        <Label>Сумма ставки</Label>
                                        <div className="relative mt-1">
                                            <Input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={playerStateRef.current.hasPlacedBet} className="bg-[#2F3B44] border-none h-12 text-lg pr-16"/>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                                <Button size="icon" variant="ghost" onClick={() => adjustBet(-10)} className="h-8 w-8"><Minus/></Button>
                                                <Button size="icon" variant="ghost" onClick={() => adjustBet(10)} className="h-8 w-8"><Plus/></Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative col-span-2">
                                        <Label>Авто-вывод</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="relative flex-grow">
                                                <Input type="number" value={autoCashout} onChange={(e) => setAutoCashout(Number(e.target.value))} className="bg-[#2F3B44] border-none h-10 pl-8"/>
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">x</span>
                                            </div>
                                            <Switch checked={autoCashoutEnabled} onCheckedChange={setAutoCashoutEnabled} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <Button variant="secondary" onClick={() => setBetAmount(50)} className="bg-[#2F3B44]">50</Button>
                                    <Button variant="secondary" onClick={() => setBetAmount(100)} className="bg-[#2F3B44]">100</Button>
                                    <Button variant="secondary" onClick={() => setBetAmount(500)} className="bg-[#2F3B44]">500</Button>
                                    <Button variant="secondary" onClick={() => setBetAmount(1000)} className="bg-[#2F3B44]">1000</Button>
                                </div>
                                <MainButton/>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="bg-[#0F1923] p-4 rounded-lg hidden md:block">
                     {/* Placeholder for the second betting panel */}
                     <p className="text-center text-gray-500">Второй слот для ставок</p>
                </div>
            </div>
        </div>
    </div>
  );
}
