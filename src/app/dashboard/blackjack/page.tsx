
import BlackjackGame from '@/components/games/blackjack-game';

export default function BlackjackPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <BlackjackGame />
      </div>
    </main>
  );
}
