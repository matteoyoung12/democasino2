
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// State for the UI inputs, controlled by the user at any time
type BetSettings = {
    betAmount: number;
    autoCashout: number;
    autoCashoutEnabled: boolean;
};

// State for a bet that is currently active in a round
type LiveBet = {
    betAmount: number;
    cashedOut: boolean;
    winnings: number;
};

const initialPlayers: Player[] = [
    { id: 1, name: "MysticGambler", avatar: "https://picsum.photos/seed/rank1/40/40", bet: 1000 },
    { id: 2, name: "CasinoQueen", avatar: "https://picsum.photos/seed/rank2/40/40", bet: 760 },
    { id: 3, name: "JackpotJoe", avatar: "https://picsum.photos/seed/rank3/40/40", bet: 500 },
    { id: 4, name: "BettingKing", avatar: "https://picsum.photos/seed/rank4/40/40", bet: 250 },
    { id: 5, name: "LuckyLucy", avatar: "https://picsum.photos/seed/rank5/40/40", bet: 650 },
    { id: 6, name: "HighRoller", avatar: "https://picsum.photos/seed/rank8/40/40", bet: 150 },
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

const generateCurveData = (crashPoint: number, gameDurationMultiplier: number) => {
    const data = [];
    const duration = Math.log(crashPoint) * gameDurationMultiplier;
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
    const [history, setHistory] = useState<number[]>([1.54, 1.15, 1.23, 4.56, 2.01, 10.89, 1.01, 3.14]);
    const [chartData, setChartData] = useState<{ time: number; value: number }[]>([{ time: 0, value: 1.0 }]);
    const [players, setPlayers] = useState<Player[]>([]);

    // Bet settings from the UI, can be changed anytime
    const [betSettings1, setBetSettings1] = useState<BetSettings>({ betAmount: 100, autoCashout: 1.5, autoCashoutEnabled: true });
    const [betSettings2, setBetSettings2] = useState<BetSettings>({ betAmount: 100, autoCashout: 1.5, autoCashoutEnabled: true });

    // Represents a bet placed for the NEXT round
    const [nextBet1, setNextBet1] = useState<BetSettings | null>(null);
    const [nextBet2, setNextBet2] = useState<BetSettings | null>(null);

    // Live bet state for the CURRENT running game, managed by ref for the animation loop
    const liveBetRef = useRef<{ bet1: LiveBet | null; bet2: LiveBet | null }>({ bet1: null, bet2: null });

    // This state is ONLY for the UI to react to cashouts
    const [displayWinnings1, setDisplayWinnings1] = useState(0);
    const [displayWinnings2, setDisplayWinnings2] = useState(0);

    const animationFrameId = useRef<number>(0);

    // --- Core Game Loop ---
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (phase === 'BETTING') {
            // Reset visual elements
            setMultiplier(1.0);
            setChartData([{ time: 0, value: 1.0 }]);
            setDisplayWinnings1(0);
            setDisplayWinnings2(0);
            setPlayers(initialPlayers.sort(() => 0.5 - Math.random()));

            // Activate bets placed for the next round
            liveBetRef.current.bet1 = nextBet1 ? { betAmount: nextBet1.betAmount, cashedOut: false, winnings: 0 } : null;
            liveBetRef.current.bet2 = nextBet2 ? { betAmount: nextBet2.betAmount, cashedOut: false, winnings: 0 } : null;
            setNextBet1(null);
            setNextBet2(null);

            let count = 10;
            setCountdown(count);
            interval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count <= 0) {
                    if (interval) clearInterval(interval);
                    setPhase('RUNNING');
                }
            }, 1000);
        } else if (phase === 'RUNNING') {
            const seed = Date.now() + Math.random();
            const crashPoint = generateCrashPoint(seed);
            const gameDurationMultiplier = 8;
            const startTime = Date.now();
            const gameDuration = Math.log(crashPoint) * gameDurationMultiplier * 1000;

            const handleCashout = (panelId: 1 | 2, currentMultiplier: number) => {
                const bet = panelId === 1 ? liveBetRef.current.bet1 : liveBetRef.current.bet2;
                if (!bet || bet.cashedOut) return;

                bet.cashedOut = true;
                bet.winnings = bet.betAmount * currentMultiplier;

                if (panelId === 1) setDisplayWinnings1(bet.winnings);
                else setDisplayWinnings2(bet.winnings);

                setBalance(prev => prev + bet.winnings);
                toast({
                    title: t.cashedOut,
                    description: `${t.youWonAmount} ${bet.winnings.toFixed(2)} ${t.creditsAt} ${currentMultiplier.toFixed(2)}x!`,
                });
            };

            const animate = () => {
                const elapsedTime = Date.now() - startTime;
                const progress = Math.min(elapsedTime / gameDuration, 1);
                const currentMultiplier = parseFloat((1 + (crashPoint - 1) * Math.pow(progress, 2)).toFixed(2));

                setMultiplier(currentMultiplier);
                
                // Auto cash out check
                const { bet1, bet2 } = liveBetRef.current;
                if (bet1 && !bet1.cashedOut && nextBet1?.autoCashoutEnabled && currentMultiplier >= nextBet1.autoCashout) {
                    handleCashout(1, currentMultiplier);
                }
                if (bet2 && !bet2.cashedOut && nextBet2?.autoCashoutEnabled && currentMultiplier >= nextBet2.autoCashout) {
                    handleCashout(2, currentMultiplier);
                }

                if (progress < 1) {
                    animationFrameId.current = requestAnimationFrame(animate);
                } else {
                    setMultiplier(crashPoint);
                    setPhase('CRASHED');
                }
            };
            animationFrameId.current = requestAnimationFrame(animate);
        } else if (phase === 'CRASHED') {
            cancelAnimationFrame(animationFrameId.current);
            const finalMultiplier = multiplier;

            const { bet1, bet2 } = liveBetRef.current;
            const bet1Lost = bet1 && !bet1.cashedOut;
            const bet2Lost = bet2 && !bet2.cashedOut;
            if (bet1Lost || bet2Lost) {
                toast({
                    title: t.crashedTitle,
                    description: `${t.rocketCrashedAt} ${finalMultiplier.toFixed(2)}x.`,
                    variant: 'destructive',
                });
            }

            setHistory(prev => [finalMultiplier, ...prev].slice(0, 20));
            interval = setTimeout(() => {
                setPhase('BETTING');
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [phase, setBalance, t, toast, multiplier, nextBet1, nextBet2]);

    const handlePlaceBet = (panelId: 1 | 2) => {
        const settings = panelId === 1 ? betSettings1 : betSettings2;
        const nextBet = panelId === 1 ? nextBet1 : setNextBet1;
        const setNextBet = panelId === 1 ? setNextBet1 : setNextBet2;
        const liveBet = panelId === 1 ? liveBetRef.current.bet1 : liveBetRef.current.bet2;

        if (settings.betAmount <= 0) {
            toast({ title: t.invalidBet, variant: 'destructive' });
            return;
        }
        if (balance < settings.betAmount) {
            toast({ title: t.insufficientBalance, variant: 'destructive' });
            return;
        }

        setBalance(prev => prev - settings.betAmount);
        setNextBet(settings);
        toast({ title: "Ставка на следующий раунд принята!" });
    };

    const handleCancelBet = (panelId: 1 | 2) => {
        const setNextBet = panelId === 1 ? setNextBet1 : setNextBet2;
        const betToCancel = panelId === 1 ? nextBet1 : nextBet2;

        if (betToCancel) {
            setBalance(prev => prev + betToCancel.betAmount);
            setNextBet(null);
            toast({ title: "Ставка отменена" });
        }
    };
    
    const handleCashoutClick = (panelId: 1 | 2) => {
        const bet = panelId === 1 ? liveBetRef.current.bet1 : liveBetRef.current.bet2;
        if (phase !== 'RUNNING' || !bet || bet.cashedOut) return;

        bet.cashedOut = true;
        bet.winnings = bet.betAmount * multiplier;

        if (panelId === 1) setDisplayWinnings1(bet.winnings);
        else setDisplayWinnings2(bet.winnings);
        
        setBalance(prev => prev + bet.winnings);
        toast({
            title: t.cashedOut,
            description: `${t.youWonAmount} ${bet.winnings.toFixed(2)} ${t.creditsAt} ${multiplier.toFixed(2)}x!`,
        });
    };

    const BettingPanel = ({ panelId }: { panelId: 1 | 2 }) => {
        const settings = panelId === 1 ? betSettings1 : betSettings2;
        const setSettings = panelId === 1 ? setBetSettings1 : setBetSettings2;
        const nextBet = panelId === 1 ? nextBet1 : nextBet2;
        const liveBet = panelId === 1 ? liveBetRef.current.bet1 : liveBetRef.current.bet2;
        const displayWinnings = panelId === 1 ? displayWinnings1 : displayWinnings2;

        const isBetPlacedForNextRound = !!nextBet;
        const isBetLiveInCurrentRound = !!liveBet;
        const isCashedOut = liveBet?.cashedOut || false;

        const adjustBet = (amount: number) => {
            setSettings(prev => ({ ...prev, betAmount: Math.max(1, prev.betAmount + amount) }));
        };

        const MainButton = () => {
            if (phase === 'RUNNING') {
                if (isBetLiveInCurrentRound) {
                    if (isCashedOut) {
                        return <Button disabled size="lg" className="h-16 w-full text-xl bg-yellow-500 text-black">Выигрыш {displayWinnings.toFixed(2)} ₽</Button>;
                    }
                    return <Button onClick={() => handleCashoutClick(panelId)} size="lg" className="h-16 w-full text-xl bg-red-500 text-white hover:bg-red-600">Забрать {(liveBet.betAmount * multiplier).toFixed(2)} ₽</Button>;
                }
                if (isBetPlacedForNextRound) {
                    return <Button disabled size="lg" className="h-16 w-full text-xl bg-gray-500 text-white">Ставка на след. раунд</Button>;
                }
                 return <Button onClick={() => handlePlaceBet(panelId)} size="lg" className="h-16 w-full text-xl bg-green-500 text-white hover:bg-green-600">Сделать ставку</Button>;
            }

            // Phase is BETTING or CRASHED
            if (isBetPlacedForNextRound) {
                return <Button onClick={() => handleCancelBet(panelId)} size="lg" className="h-16 w-full text-xl bg-yellow-500 text-black">Отменить ставку</Button>;
            }
            return <Button onClick={() => handlePlaceBet(panelId)} size="lg" className="h-16 w-full text-xl bg-green-500 text-white hover:bg-green-600">Сделать ставку</Button>;
        };

        return (
            <div className="bg-[#0F1923] p-4 rounded-lg">
                <div className="flex flex-col gap-4">
                    <div>
                        <Label className='text-xs'>Сумма ставки</Label>
                        <div className="relative mt-1">
                            <Input
                                type="number"
                                value={settings.betAmount}
                                onChange={(e) => setSettings(prev => ({ ...prev, betAmount: Number(e.target.value) }))}
                                className="bg-[#2F3B44] border-none h-12 text-lg pr-16" />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                <Button size="icon" variant="ghost" onClick={() => adjustBet(-10)} className="h-8 w-8"><Minus /></Button>
                                <Button size="icon" variant="ghost" onClick={() => adjustBet(10)} className="h-8 w-8"><Plus /></Button>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <Label className='text-xs'>Авто-вывод</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="relative flex-grow">
                                <Input
                                    type="number"
                                    value={settings.autoCashout}
                                    onChange={(e) => setSettings(prev => ({ ...prev, autoCashout: Number(e.target.value) }))}
                                    className="bg-[#2F3B44] border-none h-10 pl-8" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">x</span>
                            </div>
                            <Switch
                                checked={settings.autoCashoutEnabled}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoCashoutEnabled: checked }))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[50, 100, 500, 1000].map(val => (
                            <Button
                                key={val}
                                variant="secondary"
                                onClick={() => setSettings(prev => ({ ...prev, betAmount: val }))}
                                className="bg-[#2F3B44]">
                                {val}
                            </Button>
                        ))}
                    </div>
                    <MainButton />
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
                            <div className="grid grid-cols-3 text-xs text-gray-400 font-bold p-2 sticky top-0 bg-[#0F1923]">
                                <span>Игрок</span>
                                <span>Ставка</span>
                                <span className='text-right'>Коэфф.</span>
                            </div>
                            {players.map(p => (
                                <div key={p.id} className="grid grid-cols-3 items-center bg-[#1A242D] p-2 rounded-lg text-sm">
                                    <div className="flex items-center gap-2 col-span-1">
                                        <Avatar className="h-6 w-6"><AvatarImage src={p.avatar} /><AvatarFallback>{p.name.charAt(0)}</AvatarFallback></Avatar>
                                    </div>
                                    <div className="font-bold col-span-1">{p.bet} ₽</div>
                                    <div className={cn("font-bold col-span-1 text-right", getMultiplierColor(p.cashedOutAt || 1))}>{p.cashedOutAt ? `${p.cashedOutAt.toFixed(2)}x` : '-'}</div>
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
                            <Area type="monotone" dataKey="value" stroke={phase === 'CRASHED' ? "#FF4F4F" : "#8884d8"} fillOpacity={1} fill="url(#colorCrash)" strokeWidth={4} dot={false} isAnimationActive={false} />
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

    