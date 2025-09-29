
import PlinkoGame from '@/components/games/plinko-game';

export default function PlinkoPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full">
        <PlinkoGame />
      </div>
    </main>
  );
}
