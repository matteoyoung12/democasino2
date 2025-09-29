import MinesGame from '@/components/games/mines-game';

export default function MinesPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b p-4 sm:p-6">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">Mines</h1>
        <p className="text-muted-foreground">Click the tiles, find the gems, and avoid the mines.</p>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <MinesGame />
      </main>
    </div>
  );
}
