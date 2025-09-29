
"use client";

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
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

const games = [
  {
    id: 'slots',
    titleKey: 'slotsTitle',
    descriptionKey: 'slotsDescription',
    href: '/dashboard/slots',
    imageId: 'slots-card',
  },
  {
    id: 'roulette',
    titleKey: 'rouletteTitle',
    descriptionKey: 'rouletteDescription',
    href: '/dashboard/roulette',
    imageId: 'roulette-card',
  },
  {
    id: 'crash',
    titleKey: 'crashTitle',
    descriptionKey: 'crashDescription',
    href: '/dashboard/crash',
    imageId: 'crash-card',
  },
  {
    id: 'mines',
    titleKey: 'minesTitle',
    descriptionKey: 'minesDescription',
    href: '/dashboard/mines',
    imageId: 'mines-card',
  },
  {
    id: 'coin-flip',
    titleKey: 'coinFlipTitle',
    descriptionKey: 'coinFlipDescription',
    href: '/dashboard/coin-flip',
    imageId: 'coin-flip-card',
  },
  {
    id: 'blackjack',
    titleKey: 'blackjackTitle',
    descriptionKey: 'blackjackDescription',
    href: '/dashboard/blackjack',
    imageId: 'blackjack-card',
  }
];

export default function DashboardPage() {
  const { language } = useLanguage();
  const t = translations[language];

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
                <CardTitle className="mb-2 font-headline text-2xl">{t[game.titleKey as keyof typeof t]}</CardTitle>
                <CardDescription className="flex-grow">{t[game.descriptionKey as keyof typeof t]}</CardDescription>
              </div>
              <CardFooter>
                <Button asChild className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105">
                  <Link href={game.href}>
                    {t.playNow} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
