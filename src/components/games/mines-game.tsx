"use client";
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bomb, Gem, Play, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBalance } from '@/contexts/BalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

type Tile = {
  isMine: boolean;
  isRevealed: boolean;
};

type GameState = 'betting' | 'playing' | 'busted';

const GRID_SIZE = 25;

const createInitialGrid = (): Tile[] => {
    return Array(GRID_SIZE).fill(null).map(() => ({ isMine: false, isRevealed: false }));
}

export default function MinesGame() {
  const { language } = useLanguage();
  const t = translations[language];

  const [gameState, setGameState] = useState<GameState>('betting');
  const [grid, setGrid] = useState<Tile[]>(createInitialGrid());
  const [betAmount, setBetAmount] = useState(1.00);
  const [mineCount, setMineCount] = useState(3);
  const [revealedGems, setRevealedGems] = useState(0);

  const { balance, setBalance } = useBalance();
  const { toast } = useToast();

  const calculateMultiplier = (gemsFound: number, mines: number): number => {
    if (gemsFound === 0) return 1.0;
    const totalTiles = GRID_SIZE;
    const safeTiles = totalTiles - mines;
    if (gemsFound > safeTiles) return 0;

    let combinationsTotal = 1;
    let combinationsSafe = 1;

    for (let i = 0; i < gemsFound; i++) {
        combinationsTotal = (combinationsTotal * (totalTiles - i)) / (i + 1);
        combinationsSafe = (combinationsSafe * (safeTiles - i)) / (i + 1);
    }
    
    const probability = combinationsSafe / combinationsTotal;
    if (probability === 0) return 0;
    
    return (1 / probability) * 0.95; // 5% house edge
  };

  const multipliers = useMemo(() => {
    const safeTiles = GRID_SIZE - mineCount;
    return Array.from({ length: safeTiles }, (_, i) => calculateMultiplier(i + 1, mineCount));
  }, [mineCount]);

  const currentMultiplier = useMemo(() => {
    if (revealedGems === 0) return 1;
    return multipliers[revealedGems - 1] || 1;
  }, [revealedGems, multipliers]);
  
  const currentWinnings = betAmount * currentMultiplier;


  const startGame = () => {
    if (betAmount <= 0) {
      toast({ title: "Сумма ставки должна быть положительной", variant: 'destructive' });
      return;
    }
    if (balance < betAmount) {
      toast({ title: t.insufficientBalance, variant: 'destructive' });
      return;
    }

    setBalance(prev => prev - betAmount);
    setGameState('playing');
    setRevealedGems(0);
    
    const newGrid: Tile[] = Array(GRID_SIZE).fill(null).map(() => ({ isMine: false, isRevealed: false }));
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const randomIndex = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[randomIndex].isMine) {
        newGrid[randomIndex].isMine = true;
        minesPlaced++;
      }
    }
    setGrid(newGrid);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing' || grid[index].isRevealed) return;

    const newGrid = [...grid];
    newGrid[index].isRevealed = true;

    if (newGrid[index].isMine) {
      setGameState('busted');
      toast({
        title: t.boom,
        variant: 'destructive',
      });
      const finalGrid = newGrid.map(tile => ({...tile, isRevealed: true }));
      setGrid(finalGrid);
    } else {
      setRevealedGems(prev => prev + 1);
      setGrid(newGrid);
    }
  };
  
  const handleCashout = () => {
    if (gameState !== 'playing' || revealedGems === 0) return;

    setBalance(prev => prev + currentWinnings);
    toast({
        title: t.cashedOut,
        description: `${t.youWonAmount} ${currentWinnings.toFixed(2)} ${t.credits}.`,
    });
    setGameState('busted');
    const finalGrid = grid.map(tile => ({...tile, isRevealed: true}));
    setGrid(finalGrid);
  }

  const quickBet = (action: 'half' | 'double') => {
    if (action === 'half') {
        setBetAmount(prev => Math.max(0.01, parseFloat((prev / 2).toFixed(2))));
    } else if (action === 'double') {
        setBetAmount(prev => parseFloat((prev * 2).toFixed(2)));
    }
  }

  const renderGrid = () => {
    return grid.map((tile, index) => (
      <button
        key={index}
        onClick={() => handleTileClick(index)}
        disabled={gameState !== 'playing' || tile.isRevealed}
        className={cn(
          'aspect-square rounded-lg flex items-center justify-center transition-all duration-300 transform',
          {
            'bg-primary/20 hover:bg-primary/30': !tile.isRevealed && gameState === 'playing',
            'bg-secondary': !tile.isRevealed && gameState !== 'playing',
            'bg-green-500/20 border-2 border-green-500': tile.isRevealed && !tile.isMine,
            'bg-red-500/20 border-2 border-red-500 animate-pulse': tile.isRevealed && tile.isMine,
            'cursor-not-allowed': gameState !== 'playing' || tile.isRevealed,
            'hover:scale-105': gameState === 'playing' && !tile.isRevealed
          }
        )}
      >
        {tile.isRevealed && (
          tile.isMine ? <Bomb className="h-8 w-8 text-red-400" /> : <Gem className="h-8 w-8 text-cyan-400" />
        )}
      </button>
    ));
  };
  
  const isCashingOut = gameState === 'playing' && revealedGems > 0;

  const MainButton = () => {
      if (gameState === 'playing') {
          return (
             <Button onClick={handleCashout} disabled={!isCashingOut} size="lg" className="h-16 w-full text-xl bg-green-500 hover:bg-green-600">
                <PiggyBank className="mr-2" /> 
                <span>
                    {t.cashOut}
                    {isCashingOut && <span className="ml-2 font-bold">{currentWinnings.toFixed(2)} ₽</span>}
                </span>
            </Button>
          )
      }
      return (
        <Button onClick={() => {
            setGameState('betting');
            setGrid(createInitialGrid());
            setRevealedGems(0);
            if (gameState === 'betting') {
                startGame();
            }
        }} size="lg" className="h-16 w-full text-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Play className="mr-2"/> {gameState === 'busted' ? t.playAgain : "Играть"}
        </Button>
      )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      {/* CONTROL PANEL */}
      <Card className="lg:col-span-1 bg-card/80">
        <CardContent className="p-4 grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="bet-amount" className="font-semibold">СУММА СТАВКИ</Label>
                <div className="relative">
                    <Input 
                        id="bet-amount" 
                        type="number" 
                        value={betAmount.toFixed(2)} 
                        onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} 
                        disabled={gameState === 'playing'}
                        className="pr-20 text-lg font-bold h-12"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => quickBet('double')} disabled={gameState === 'playing'} className="h-auto px-2 py-1">x2</Button>
                        <Button variant="ghost" size="sm" onClick={() => quickBet('half')} disabled={gameState === 'playing'} className="h-auto px-2 py-1">1/2</Button>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, 500, 750, 1000].map(val => (
                        <Button key={val} variant="secondary" size="sm" onClick={() => setBetAmount(val)} disabled={gameState === 'playing'}>{val}</Button>
                    ))}
                </div>
            </div>

            <div className="grid gap-2">
                <Label className="font-semibold">КОЛИЧЕСТВО БОМБ</Label>
                <div className="grid grid-cols-5 gap-2">
                    {[3, 5, 10, 24].map(count => (
                        <Button key={count} variant={mineCount === count ? 'destructive' : 'secondary'} onClick={() => setMineCount(count)} disabled={gameState === 'playing'}>
                            {count}
                        </Button>
                    ))}
                     <Button variant="secondary" disabled={gameState === 'playing'}>Изменить</Button>
                </div>
            </div>

            <MainButton />

            <Button variant="outline">Как играть?</Button>
        </CardContent>
      </Card>
      
      {/* GAME AREA */}
       <Card className="lg:col-span-2 bg-card/80">
        <CardContent className="p-6 flex flex-col justify-between items-center h-full">
            <div className="flex justify-around items-center w-full">
                <div className="flex flex-col items-center gap-2 text-cyan-400">
                    <Gem className="h-8 w-8" />
                    <span className="text-xl font-bold">{GRID_SIZE - mineCount}</span>
                </div>
                <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
                    {renderGrid()}
                </div>
                <div className="flex flex-col items-center gap-2 text-red-400">
                    <Bomb className="h-8 w-8" />
                    <span className="text-xl font-bold">{mineCount}</span>
                </div>
            </div>
            
            <Carousel opts={{
                align: "start",
                dragFree: true
             }} className="w-full max-w-xl mt-6">
                <CarouselContent className="-ml-2">
                    {multipliers.map((multiplier, index) => (
                    <CarouselItem key={index} className="pl-2 basis-1/6 md:basis-1/8">
                        <div className={cn(
                            "p-2 rounded-md text-center bg-secondary",
                            revealedGems === index + 1 && "border-2 border-primary"
                        )}>
                            <p className="font-bold text-sm text-primary">{multiplier.toFixed(2)}x</p>
                            <p className="text-xs text-muted-foreground">{index + 1} Hit</p>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </CardContent>
       </Card>
    </div>
  );
}
