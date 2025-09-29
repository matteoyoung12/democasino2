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


type Tile = {
  isMine: boolean;
  isRevealed: boolean;
};

type GameState = 'betting' | 'playing' | 'busted';

const GRID_SIZE = 25;

export default function MinesGame() {
  const [gameState, setGameState] = useState<GameState>('betting');
  const [grid, setGrid] = useState<Tile[]>([]);
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [revealedGems, setRevealedGems] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [nextMultiplier, setNextMultiplier] = useState(1.0);

  const { toast } = useToast();

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
    setCurrentMultiplier(calculateMultiplier(revealedGems, mineCount));
    setNextMultiplier(calculateMultiplier(revealedGems + 1, mineCount));
  }, [revealedGems, mineCount]);

  const startGame = () => {
    if (betAmount <= 0) {
      toast({ title: "Invalid bet amount", variant: 'destructive' });
      return;
    }

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
        disabled={gameState !== 'playing'}
        className={cn(
          'aspect-square rounded-lg flex items-center justify-center transition-all duration-300',
          {
            'bg-card/50 hover:bg-card/80': !tile.isRevealed,
            'bg-green-500/20': tile.isRevealed && !tile.isMine,
            'bg-red-500/20 animate-pulse': tile.isRevealed && tile.isMine,
            'cursor-not-allowed': gameState !== 'playing',
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-5 gap-2 p-4 bg-card rounded-lg">
        {gameState === 'betting' 
         ? Array(GRID_SIZE).fill(0).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-card/50" />)
         : renderGrid()
        }
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {gameState === 'betting' ? (
             <Button onClick={startGame} size="lg" className="h-16 w-full text-xl bg-accent text-accent-foreground hover:bg-accent/90">
                <Play className="mr-2"/> Place Bet
            </Button>
          ) : (
             <Button onClick={handleCashout} disabled={!isCashingOut} size="lg" className="h-16 w-full text-xl bg-green-500 hover:bg-green-600">
               <PiggyBank className="mr-2" /> Cash Out { (betAmount * currentMultiplier).toFixed(2) }
            </Button>
          )}

          {gameState === 'busted' && (
             <Button onClick={() => setGameState('betting')} size="lg" className="h-16 w-full text-xl">
                <Play className="mr-2"/> Play Again
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
        {gameState === 'playing' && (
            <CardFooter className="flex-col items-start">
                <p>Gems Found: <span className="font-bold text-accent">{revealedGems}</span></p>
                <p>Current Multiplier: <span className="font-bold text-accent">{currentMultiplier.toFixed(2)}x</span></p>
                <p>Next Multiplier: <span className="font-bold text-green-500">{nextMultiplier.toFixed(2)}x</span></p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
