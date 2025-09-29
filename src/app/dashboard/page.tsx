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
];

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 font-headline text-3xl font-bold tracking-tight text-foreground">Game Lobby</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game) => {
          const image = PlaceHolderImages.find((p) => p.id === game.imageId);
          return (
            <Card key={game.id} className="flex flex-col overflow-hidden transform transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader className="p-0">
                {image && (
                  <div className="relative aspect-video">
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      data-ai-hint={image.imageHint}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </CardHeader>
              <div className="flex flex-grow flex-col p-6">
                <CardTitle className="mb-2 font-headline text-2xl">{game.title}</CardTitle>
                <CardDescription className="flex-grow">{game.description}</CardDescription>
              </div>
              <CardFooter>
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href={game.href}>
                    Play Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
