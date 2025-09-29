
"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bomb, Gem, Play, Wallet, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBalance } from '@/contexts/BalanceContext';


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
  const [gameState, setGameState] = useState<GameState>('betting');
  const [grid, setGrid] = useState<Tile[]>(createInitialGrid());
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [revealedGems, setRevealedGems] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [nextMultiplier, setNextMultiplier] = useState(1.0);
  const { balance, setBalance } = useBalance();

  const { toast } = useToast();

  const calculateMultiplier = (gemsFound: number, mines: number) => {
    if (gemsFound === 0) return 1.0;
    const totalTiles = GRID_SIZE;
    const safeTiles = totalTiles - mines;
    if (gemsFound > safeTiles) return 0; // Should not happen

    let combinationsOfSafeTiles = 1;
    let combinationsOfGemsFound = 1;

    for (let i = 0; i < gemsFound; i++) {
        combinationsOfSafeTiles = (combinationsOfSafeTiles * (totalTiles - i)) / (i + 1);
        combinationsOfGemsFound = (combinationsOfGemsFound * (safeTiles - i)) / (i + 1);
    }
    
    return (combinationsOfSafeTiles / combinationsOfGemsFound) * 0.95; // 5% house edge
  };

  useEffect(() => {
    if (gameState === 'playing') {
      setCurrentMultiplier(calculateMultiplier(revealedGems, mineCount));
      setNextMultiplier(calculateMultiplier(revealedGems + 1, mineCount));
    } else {
      setCurrentMultiplier(1.0);
      setNextMultiplier(calculateMultiplier(1, mineCount));
    }
  }, [revealedGems, mineCount, gameState]);

  const startGame = () => {
    if (betAmount <= 0) {
      toast({ title: "Invalid bet amount", variant: 'destructive' });
      return;
    }
    if (balance < betAmount) {
      toast({ title: "Insufficient balance", variant: 'destructive' });
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
        title: 'BOOM! You hit a mine.',
        variant: 'destructive',
      });
      // Reveal all mines
      const finalGrid = newGrid.map(tile => ({...tile, isRevealed: tile.isMine || tile.isRevealed }));
      setGrid(finalGrid);
    } else {
      setRevealedGems(prev => prev + 1);
      setGrid(newGrid);
    }
  };
  
  const handleCashout = () => {
    if (gameState !== 'playing' || revealedGems === 0) return;

    const winnings = betAmount * currentMultiplier;
    setBalance(prev => prev + winnings);
    toast({
        title: "Cashed Out!",
        description: `You won ${winnings.toFixed(2)} credits.`,
    });
    setGameState('betting');
    const finalGrid = grid.map(tile => ({...tile, isRevealed: true}));
    setGrid(finalGrid);
  }

  const renderGrid = () => {
    return grid.map((tile, index) => (
      <button
        key={index}
        onClick={() => handleTileClick(index)}
        disabled={gameState !== 'playing' || tile.isRevealed}
        className={cn(
          'aspect-square rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105',
          {
            'bg-primary/10 hover:bg-primary/20': !tile.isRevealed,
            'bg-green-500/20 border border-green-500': tile.isRevealed && !tile.isMine,
            'bg-red-500/20 border border-red-500 animate-pulse': tile.isRevealed && tile.isMine,
            'cursor-not-allowed': gameState !== 'playing' || tile.isRevealed,
          }
        )}
      >
        {tile.isRevealed && (
          tile.isMine ? <Bomb className="h-6 w-6 text-red-500" /> : <Gem className="h-6 w-6 text-green-500" />
        )}
      </button>
    ));
  };
  
  const isCashingOut = gameState === 'playing' && revealedGems > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
        <div className="grid grid-cols-5 gap-2 md:gap-4 p-4 bg-card rounded-lg flex-grow">
            {gameState === 'betting' && !grid.some(t => t.isRevealed)
             ? Array(GRID_SIZE).fill(0).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-primary/10" />)
             : renderGrid()
            }
        </div>

      <Card className="lg:w-80">
        <CardContent className="grid grid-cols-2 md:grid-cols-1 gap-4 p-4 items-end">
          <div className="grid gap-2 col-span-2">
            <Label htmlFor="bet-amount" className="flex items-center gap-2"><Wallet />Bet Amount</Label>
            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={gameState === 'playing'} />
          </div>
          <div className="grid gap-2 col-span-2">
            <Label htmlFor="mine-count" className="flex items-center gap-2"><Bomb />Mines</Label>
            <Select value={String(mineCount)} onValueChange={(val) => setMineCount(Number(val))} disabled={gameState === 'playing'}>
              <SelectTrigger>
                <SelectValue placeholder="Number of mines" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(24).keys()].map(i => i + 1).map(i => (
                  <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           {(gameState === 'playing' || gameState === 'busted') && (
            <div className="flex flex-col items-start gap-1 col-span-2 border-l pl-4">
                <p>Gems Found: <span className="font-bold text-primary">{revealedGems}</span></p>
                <p>Current: <span className="font-bold text-primary">{currentMultiplier.toFixed(2)}x</span></p>
                <p>Next: <span className="font-bold text-green-500">{nextMultiplier.toFixed(2)}x</span></p>
            </div>
           )}

          {gameState === 'playing' ? (
             <Button onClick={handleCashout} disabled={!isCashingOut} size="lg" className="h-16 w-full text-xl bg-green-500 hover:bg-green-600 col-span-2">
               <PiggyBank className="mr-2" /> Cash Out { (betAmount * currentMultiplier).toFixed(2) }
            </Button>
          ) : gameState === 'busted' ? (
             <Button onClick={() => {
                setGameState('betting');
                setGrid(createInitialGrid());
             }} size="lg" className="h-16 w-full text-xl col-span-2">
                <Play className="mr-2"/> Play Again
            </Button>
          ) : (
             <Button onClick={startGame} size="lg" className="h-16 w-full text-xl bg-primary text-primary-foreground hover:bg-primary/90 col-span-2">
                <Play className="mr-2"/> Place Bet
            </Button>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
