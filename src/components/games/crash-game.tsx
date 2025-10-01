
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type GamePhase = 'BETTING' | 'RUNNING' | 'CRASHED';

type Player = {
  id: number;
  name: string;
  avatar: string;
  bet: number;
  cashedOutAt?: number;
  winnings?: number;
};

type BetState = {
    betAmount: number;
    autoCashout: number;
    autoCashoutEnabled: boolean;
    hasPlacedBet: boolean;
    isCashedOut: boolean;
    winnings: number;
};

const initialBetState: BetState = {
    betAmount: 100,
    autoCashout: 1.5,
    autoCashoutEnabled: true,
    hasPlacedBet: false,
    isCashedOut: false,
    winnings: 0
};

const initialPlayers: Player[] = [
    { id: 1, name: "MysticGambler", avatar: "https://picsum.photos/seed/rank1/40/40", bet: 1000 },
    { id: 2, name: "CasinoQueen", avatar: "https://picsum.photos/seed/rank2/40/40", bet: 760 },
    { id: 3, name: "JackpotJoe", avatar: "https://picsum.photos/seed/rank3/40/40", bet: 500 },
    { id: 4, name: "BettingKing", avatar: "https://picsum.photos/seed/rank4/40/40", bet: 250 },
    { id: 5, name: "LuckyLucy", avatar: "https://picsum.photos/seed/rank5/40/40", bet: 650 },
    { id: 6, name: "HighRoller", avatar: "https://picsum.photos/seed/rank8/40/40", bet: 150 },
    { id: 7, name: "PokerPro", avatar: "https://picsum.photos/seed/rank6/40/40", bet: 25 },
    { id: 8, name: "RouletteRick", avatar: "https://picsum.photos/seed/rank7/40/40", bet: 75 },
];


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
    const duration = Math.log(crashPoint) * 4; 
    const steps = Math.max(100, duration * 60);

    for (let i = 0; i <= steps; i++) {
        const t = (i / steps);
        const multiplier = 1 + (crashPoint - 1) * Math.pow(t, 2);
        data.push({ time: t, value: multiplier });
    }
    if (data[data.length - 1].value < crashPoint) {
       data.push({ time: 1, value: crashPoint });
    }
    return data;
};


export default function CrashGame() {
    const { language } = useLanguage();
    const t = translations[language];
    const { balance, setBalance } = useBalance();
    const { toast } = useToast();

    const [phase, setPhase] = useState<GamePhase>('BETTING');
    const [countdown, setCountdown] = useState(10);
    const [multiplier, setMultiplier] = useState(1.0);
    const [history, setHistory] = useState<number[]>([1.54, 1.15, 1.23, 4.56, 2.01, 10.89, 1.01, 3.14, 5.00, 1.74, 1.35, 18.40]);
    const [chartData, setChartData] = useState<{ time: number; value: number }[]>([{ time: 0, value: 1.0 }]);
    const [players, setPlayers] = useState<Player[]>([]);
    
    const [betState1, setBetState1] = useState<BetState>(initialBetState);
    const [betState2, setBetState2] = useState<BetState>(initialBetState);

    const gameLogicRef = useRef({
      animationFrameId: 0,
      crashPoint: 1,
      startTime: 0,
      betState1: initialBetState,
      betState2: initialBetState,
    });
    
    useEffect(() => {
        gameLogicRef.current.betState1 = betState1;
        gameLogicRef.current.betState2 = betState2;
    }, [betState1, betState2]);


    const handleCashout = useCallback((panelId: 1 | 2, cashoutMultiplier: number) => {
        const betState = panelId === 1 ? gameLogicRef.current.betState1 : gameLogicRef.current.betState2;
        const setBetState = panelId === 1 ? setBetState1 : setBetState2;

        if (!betState.hasPlacedBet || betState.isCashedOut) return;

        const wonAmount = betState.betAmount * cashoutMultiplier;
        setBalance(prev => prev + wonAmount);

        setBetState(prev => ({...prev, isCashedOut: true, winnings: wonAmount}));
        
        // This is crucial to update the ref immediately for the animation loop
        if (panelId === 1) {
            gameLogicRef.current.betState1 = { ...gameLogicRef.current.betState1, isCashedOut: true };
        } else {
            gameLogicRef.current.betState2 = { ...gameLogicRef.current.betState2, isCashedOut: true };
        }

        toast({
            title: t.cashedOut,
            description: `${t.youWonAmount} ${wonAmount.toFixed(2)} ${t.creditsAt} ${cashoutMultiplier.toFixed(2)}x!`,
        });
    }, [setBalance, t, toast]);

    const runGame = useCallback(() => {
        const seed = Date.now() + Math.random();
        const crashPoint = generateCrashPoint(seed);
        const curve = generateCurveData(crashPoint);
        const startTime = Date.now();
        const gameDuration = Math.log(crashPoint) * 4 * 1000;

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
            
            // Auto-cashout check
            const checkAutoCashout = (betState: BetState, panelId: 1 | 2) => {
                if (betState.hasPlacedBet && !betState.isCashedOut && betState.autoCashoutEnabled && currentMultiplier >= betState.autoCashout) {
                    handleCashout(panelId, betState.autoCashout);
                }
            };
            checkAutoCashout(gameLogicRef.current.betState1, 1);
            checkAutoCashout(gameLogicRef.current.betState2, 2);
            
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
        let interval: NodeJS.Timeout | null = null;

        if (phase === 'BETTING') {
            setBetState1(prev => ({...prev, hasPlacedBet: false, isCashedOut: false, winnings: 0}));
            setBetState2(prev => ({...prev, hasPlacedBet: false, isCashedOut: false, winnings: 0}));
            setMultiplier(1.00);
            setChartData([{ time: 0, value: 1.0 }]);
            setPlayers(initialPlayers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 6) + 5));

            let count = 10;
            setCountdown(count);
            interval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count <= 0) {
                    if(interval) clearInterval(interval);
                    setPhase('RUNNING');
                }
            }, 1000);
        } else if (phase === 'RUNNING') {
            runGame();
        } else if (phase === 'CRASHED') {
            cancelAnimationFrame(gameLogicRef.current.animationFrameId);
            const crashPoint = gameLogicRef.current.crashPoint;

            const b1 = gameLogicRef.current.betState1;
            const b2 = gameLogicRef.current.betState2;

            if ((b1.hasPlacedBet && !b1.isCashedOut) || (b2.hasPlacedBet && !b2.isCashedOut)) {
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
            if(interval) clearInterval(interval);
            cancelAnimationFrame(gameLogicRef.current.animationFrameId);
        };
    }, [phase, runGame, t, toast]);


    const BettingPanel = ({ panelId }: { panelId: 1 | 2}) => {
        const betState = panelId === 1 ? betState1 : betState2;
        const setBetState = panelId === 1 ? setBetState1 : setBetState2;

        const { betAmount, autoCashout, autoCashoutEnabled, hasPlacedBet, isCashedOut, winnings } = betState;

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
          setBetState(prev => ({...prev, hasPlacedBet: true}));
          toast({title: "Ставка принята!", description: `Ваша ставка ${betAmount} ₽ будет сыграна в следующем раунде.`});
        };

        const cancelBet = () => {
            if (!hasPlacedBet || phase !== 'BETTING') return;
            setBalance(prev => prev + betAmount);
            setBetState(prev => ({...prev, hasPlacedBet: false}));
            toast({title: "Ставка отменена"});
        }

        const adjustBet = (amount: number) => {
            setBetState(prev => ({...prev, betAmount: Math.max(1, prev.betAmount + amount)}));
        }

        const MainButton = () => {
            if (phase === 'RUNNING') {
                if (!hasPlacedBet) return <Button disabled size="lg" className="h-16 w-full text-xl bg-gray-500 text-white">Ожидание</Button>;
                if (isCashedOut) return <Button disabled size="lg" className="h-16 w-full text-xl bg-yellow-500 text-black">Выигрыш {winnings.toFixed(2)} ₽</Button>;
                return <Button onClick={() => handleCashout(panelId, multiplier)} size="lg" className="h-16 w-full text-xl bg-red-500 text-white hover:bg-red-600">Забрать {multiplier.toFixed(2)}x</Button>;
            }
            
            if (hasPlacedBet) {
                return <Button onClick={cancelBet} size="lg" className="h-16 w-full text-xl bg-yellow-500 text-black" disabled={phase !== 'BETTING'}>Отменить ставку</Button>;
            }

            return <Button onClick={placeBet} size="lg" className="h-16 w-full text-xl bg-green-500 text-white hover:bg-green-600" disabled={phase !== 'BETTING'}>Сделать ставку</Button>;
        }

        return (
            <div className="bg-[#0F1923] p-4 rounded-lg">
                <div className="flex flex-col gap-4">
                    <div>
                        <Label className='text-xs'>Сумма ставки</Label>
                        <div className="relative mt-1">
                            <Input 
                                type="number" 
                                value={betAmount} 
                                onChange={(e) => setBetState(prev => ({...prev, betAmount: Number(e.target.value)}))} 
                                disabled={hasPlacedBet || phase === 'RUNNING'}
                                className="bg-[#2F3B44] border-none h-12 text-lg pr-16"/>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                <Button size="icon" variant="ghost" onClick={() => adjustBet(-10)} disabled={hasPlacedBet || phase === 'RUNNING'} className="h-8 w-8"><Minus/></Button>
                                <Button size="icon" variant="ghost" onClick={() => adjustBet(10)} disabled={hasPlacedBet || phase === 'RUNNING'} className="h-8 w-8"><Plus/></Button>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <Label className='text-xs'>Авто-вывод</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="relative flex-grow">
                                <Input 
                                    type="number" 
                                    value={autoCashout} 
                                    onChange={(e) => setBetState(prev => ({...prev, autoCashout: Number(e.target.value)}))} 
                                    disabled={hasPlacedBet || phase === 'RUNNING'}
                                    className="bg-[#2F3B44] border-none h-10 pl-8"/>
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">x</span>
                            </div>
                            <Switch 
                                checked={autoCashoutEnabled} 
                                onCheckedChange={(checked) => setBetState(prev => ({...prev, autoCashoutEnabled: checked}))}
                                disabled={hasPlacedBet || phase === 'RUNNING'}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[50, 100, 500, 1000].map(val => (
                            <Button 
                                key={val}
                                variant="secondary" 
                                onClick={() => setBetState(prev => ({...prev, betAmount: val}))} 
                                className="bg-[#2F3B44]"
                                disabled={hasPlacedBet || phase === 'RUNNING'}>
                                {val}
                            </Button>
                        ))}
                    </div>
                    <MainButton/>
                </div>
            </div>
        );
    }

    const getMultiplierColor = (val: number) => {
        if (val >= 10) return 'text-purple-400';
        if (val >= 2) return 'text-cyan-400';
        return 'text-blue-400';
    };

    return (
        <div className="grid grid-cols-12 gap-4 h-full bg-[#1A242D] text-white p-4">
            <div className="col-span-12 lg:col-span-3 bg-[#0F1923] p-4 rounded-lg flex flex-col">
                <Tabs defaultValue="all" className="w-full flex flex-col flex-grow">
                    <TabsList className="grid w-full grid-cols-3 bg-[#2F3B44]">
                        <TabsTrigger value="all">Все ставки</TabsTrigger>
                        <TabsTrigger value="my">Мои</TabsTrigger>
                        <TabsTrigger value="top">Топ</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="flex-grow mt-4 overflow-hidden">
                         <div className="space-y-2 h-full overflow-y-auto">
                            <div className="grid grid-cols-4 text-xs text-gray-400 font-bold p-2 sticky top-0 bg-[#0F1923]">
                                <span>Игрок</span>
                                <span>Ставка</span>
                                <span>Коэфф.</span>
                                <span className='text-right'>Выигрыш</span>
                            </div>
                            {players.map(p => (
                                 <div key={p.id} className="grid grid-cols-4 items-center bg-[#1A242D] p-2 rounded-lg text-sm">
                                     <div className="flex items-center gap-2 col-span-1">
                                        <Avatar className="h-6 w-6"><AvatarImage src={p.avatar} /><AvatarFallback>{p.name.charAt(0)}</AvatarFallback></Avatar>
                                     </div>
                                      <div className="font-bold col-span-1">{p.bet} ₽</div>
                                      <div className={cn("font-bold col-span-1", getMultiplierColor(p.cashedOutAt || 1))}>{p.cashedOutAt ? `${p.cashedOutAt.toFixed(2)}x` : '-'}</div>
                                      <div className="text-green-400 font-bold col-span-1 text-right">{p.winnings ? `${p.winnings.toFixed(2)} ₽` : '-'}</div>
                                 </div>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="my"><p className="text-center text-gray-500 mt-4">У вас еще нет ставок</p></TabsContent>
                    <TabsContent value="top"><p className="text-center text-gray-500 mt-4">Топ ставок будет доступен позже</p></TabsContent>
                </Tabs>
            </div>

            <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
                <div className="flex gap-2 bg-[#0F1923] p-2 rounded-md overflow-x-auto">
                    {history.map((h, i) => (
                        <div key={i} className={cn("py-1 px-3 rounded-full font-bold text-sm text-center bg-[#1A242D] flex-shrink-0", getMultiplierColor(h))}>
                            {h.toFixed(2)}x
                        </div>
                    ))}
                </div>

                <div className="flex-grow bg-[#0F1923] rounded-lg relative min-h-[300px]">
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
                                <stop offset="5%" stopColor={phase === 'CRASHED' ? "#FF4F4F" : "#8884d8"} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={phase === 'CRASHED' ? "#FF4F4F" : "#8884d8"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={phase === 'CRASHED' ? "#FF4F4F" : "#8884d8"} fillOpacity={1} fill="url(#colorCrash)" strokeWidth={4} dot={false} isAnimationActive={false}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BettingPanel panelId={1} />
                    <BettingPanel panelId={2} />
                </div>
            </div>
        </div>
      );
}