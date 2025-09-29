

import MinesGame from '@/components/games/mines-game';

export default function MinesPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full">
        <MinesGame />
      </div>
    </main>
  );
}
