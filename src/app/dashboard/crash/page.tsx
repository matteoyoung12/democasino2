import CrashGame from '@/components/games/crash-game';

export default function CrashPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <CrashGame />
      </div>
    </main>
  );
}
