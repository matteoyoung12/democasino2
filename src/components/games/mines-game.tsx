
"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  const [grid, setGrid] = useState<Tile[]>([]);
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [revealedGems, setRevealedGems] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [nextMultiplier, setNextMultiplier] = useState(1.0);
  const { balance, setBalance } = useBalance();

  const { toast } = useToast();

  useEffect(() => {
    // Initialize grid on client-side only
    setGrid(createInitialGrid());
  }, []);

  const calculateMultiplier = (gemsFound: number, mines: number) => {
    const totalTiles = GRID_SIZE;
    const safeTiles = totalTiles - mines;
    if (gemsFound === 0) return 1.0;
    
    let multiplier = 1.0;
    for(let i = 0; i < gemsFound; i++) {
        multiplier *= (totalTiles - i) / (safeTiles - i);
    }
    
    return Math.max(multiplier * 0.95, 1.0); // 0.95 house edge
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
    setGrid(newGrid);

    if (newGrid[index].isMine) {
      setGameState('busted');
      toast({
        title: 'BOOM! You hit a mine.',
        variant: 'destructive',
      });
      // Reveal all mines
      const finalGrid = newGrid.map(tile => ({...tile, isRevealed: tile.isMine ? true : tile.isRevealed}));
      setGrid(finalGrid);
    } else {
      setRevealedGems(prev => prev + 1);
    }
  };
  
  const handleCashout = () => {
    const winnings = betAmount * currentMultiplier;
    setBalance(prev => prev + winnings);
    toast({
        title: "Cashed Out!",
        description: `You won ${winnings.toFixed(2)} credits.`,
    });
    setGameState('betting');
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
            'bg-card/50 hover:bg-primary/20': !tile.isRevealed,
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5 w-full max-w-4xl">
      <div className="md:col-span-3 grid grid-cols-5 gap-2 p-4 bg-card rounded-lg">
        {gameState === 'betting' 
         ? Array(GRID_SIZE).fill(0).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-card/50" />)
         : renderGrid()
        }
      </div>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Game Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {gameState === 'playing' ? (
             <Button onClick={handleCashout} disabled={!isCashingOut} size="lg" className="h-16 w-full text-xl bg-green-500 hover:bg-green-600">
               <PiggyBank className="mr-2" /> Cash Out { (betAmount * currentMultiplier).toFixed(2) }
            </Button>
          ) : gameState === 'busted' ? (
             <Button onClick={() => {
                setGameState('betting');
                setGrid(createInitialGrid());
             }} size="lg" className="h-16 w-full text-xl">
                <Play className="mr-2"/> Play Again
            </Button>
          ) : (
             <Button onClick={startGame} size="lg" className="h-16 w-full text-xl bg-primary text-primary-foreground hover:bg-primary/90">
                <Play className="mr-2"/> Place Bet
            </Button>
          )}

          <div className="grid gap-2">
            <Label htmlFor="bet-amount"><Wallet className="inline-block mr-2" />Bet Amount</Label>
            <Input id="bet-amount" type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} disabled={gameState === 'playing'} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mine-count"><Bomb className="inline-block mr-2" />Mines</Label>
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
        </CardContent>
        {(gameState === 'playing' || gameState === 'busted') && (
            <CardFooter className="flex-col items-start gap-1">
                <p>Gems Found: <span className="font-bold text-primary">{revealedGems}</span></p>
                <p>Current Multiplier: <span className="font-bold text-primary">{currentMultiplier.toFixed(2)}x</span></p>
                <p>Next Multiplier: <span className="font-bold text-green-500">{nextMultiplier.toFixed(2)}x</span></p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
