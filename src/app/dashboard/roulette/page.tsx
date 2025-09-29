import RouletteGame from '@/components/games/roulette-game';

export default function RoulettePage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b p-4 sm:p-6">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">European Roulette</h1>
        <p className="text-muted-foreground">Place your bets and let the wheel decide your fate.</p>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <RouletteGame />
      </main>
    </div>
  );
}
