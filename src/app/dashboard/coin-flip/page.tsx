import CoinFlipGame from '@/components/games/coin-flip-game';

export default function CoinFlipPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <CoinFlipGame />
      </div>
    </main>
  );
}
