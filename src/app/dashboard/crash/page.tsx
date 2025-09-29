import CrashGame from '@/components/games/crash-game';

export default function CrashPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b p-4 sm:p-6">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">Crash</h1>
        <p className="text-muted-foreground">Test your nerve. Cash out before the crash.</p>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <CrashGame />
      </main>
    </div>
  );
}
