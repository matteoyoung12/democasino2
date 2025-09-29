import MinesGame from '@/components/games/mines-game';

export default function MinesPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <MinesGame />
      </div>
    </main>
  );
}
