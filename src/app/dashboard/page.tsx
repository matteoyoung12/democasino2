
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight } from 'lucide-react';

const games = [
  {
    id: 'slots',
    title: '3x3 Slots',
    description: 'Classic 3x3 slot machine fun. Spin the reels and match the symbols to win big!',
    href: '/dashboard/slots',
    imageId: 'slots-card',
  },
  {
    id: 'roulette',
    title: 'European Roulette',
    description: 'Place your bets and watch the wheel spin. Predict the right number to win!',
    href: '/dashboard/roulette',
    imageId: 'roulette-card',
  },
  {
    id: 'crash',
    title: 'Crash Game',
    description: 'Watch the multiplier grow, but cash out before it crashes! A game of nerve and timing.',
    href: '/dashboard/crash',
    imageId: 'crash-card',
  },
  {
    id: 'mines',
    title: 'Mines',
    description: 'Uncover gems and avoid the mines. The more you find, the bigger the prize!',
    href: '/dashboard/mines',
    imageId: 'mines-card',
  },
  {
    id: 'coin-flip',
    title: 'Coin Flip',
    description: 'Heads or tails? A simple game of chance with a 50/50 outcome. Bet on the flip!',
    href: '/dashboard/coin-flip',
    imageId: 'coin-flip-card',
  },
  {
    id: 'blackjack',
    title: 'Blackjack',
    description: 'Get as close to 21 as you can without going over. Beat the dealer and win!',
    href: '/dashboard/blackjack',
    imageId: 'blackjack-card',
  }
];

export default function DashboardPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game, index) => {
          const image = PlaceHolderImages.find((p) => p.id === game.imageId);
          return (
            <Card
              key={game.id}
              className="group flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-primary/30"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
            >
              <CardHeader className="p-0">
                {image && (
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      data-ai-hint={image.imageHint}
                      fill
                      className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
              </CardHeader>
              <div className="flex flex-grow flex-col p-6">
                <CardTitle className="mb-2 font-headline text-2xl">{game.title}</CardTitle>
                <CardDescription className="flex-grow">{game.description}</CardDescription>
              </div>
              <CardFooter>
                <Button asChild className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105">
                  <Link href={game.href}>
                    Play Now <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
