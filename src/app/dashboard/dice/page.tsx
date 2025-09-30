
import DiceGame from '@/components/games/dice-game';

export default function DicePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <DiceGame />
      </div>
    </main>
  );
}
