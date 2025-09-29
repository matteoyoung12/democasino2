import SlotMachine from '@/components/games/slot-machine';

export default function SlotsPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b p-4 sm:p-6">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">3x3 Slots</h1>
        <p className="text-muted-foreground">Match the symbols to win. Good luck!</p>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <SlotMachine />
      </main>
    </div>
  );
}
