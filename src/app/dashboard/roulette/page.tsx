
import RouletteGame from '@/components/games/roulette-game';

export default function RoulettePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <RouletteGame />
      </div>
    </main>
  );
}
