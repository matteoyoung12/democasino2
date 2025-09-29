
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
import { ArrowRight, ChevronLeft, ChevronRight, Trophy, Users, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const tournaments = [
    { title: "Счастливая карта", prize: "5 000.00 ₽", players: 126, time: "01:01:01:35" },
    { title: "Монополия и не только", prize: "10 000.00 ₽", players: 100, time: "04:00:31:35" },
    { title: "Слот-машины с бонусами", prize: "20 000.00 ₽", players: 88, time: "05:01:31:35" }
]

const games = [
  {
    id: 'crash',
    titleKey: 'crashTitle',
    href: '/dashboard/crash',
    imageUrl: 'https://picsum.photos/seed/gp1/400/200',
    bgColor: 'bg-blue-500'
  },
  {
    id: 'roulette',
    titleKey: 'rouletteTitle',
    href: '/dashboard/roulette',
    imageUrl: 'https://picsum.photos/seed/gp2/400/200',
    bgColor: 'bg-red-500'
  },
  {
    id: 'mines',
    titleKey: 'minesTitle',
    href: '/dashboard/mines',
    imageUrl: 'https://picsum.photos/seed/gp3/400/200',
    bgColor: 'bg-yellow-500'
  },
];

export default function DashboardPage() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="space-y-8">
      
      {/* Hero Carousel */}
      <Carousel className="w-full">
        <CarouselContent>
          <CarouselItem>
            <div className="relative aspect-[2.5/1] w-full rounded-lg overflow-hidden bg-card p-8 flex items-center">
              <Image src="https://picsum.photos/seed/carousel1/1200/480" alt="Crypto deposit bonus" fill className="object-cover opacity-30"/>
              <div className="relative z-10 text-white max-w-md">
                <h2 className="text-4xl font-bold text-accent">+7% К ТВОЕМУ КРИПТО-ДЕПОЗИТУ</h2>
                <p className="mt-2">Вноси от $10 и мы накинем еще! Предложение активно после первого депозита.</p>
                <Button className="mt-4 bg-primary hover:bg-primary/90">Пополнить с бонусом</Button>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem>
             <div className="relative aspect-[2.5/1] w-full rounded-lg overflow-hidden bg-card p-8 flex items-center justify-end text-right">
              <Image src="https://picsum.photos/seed/carousel2/1200/480" alt="Choose your bonus" fill className="object-cover opacity-30"/>
              <div className="relative z-10 text-white max-w-md">
                <h2 className="text-4xl font-bold">ВЫБЕРИ СВОЙ БОНУС!</h2>
                <p className="mt-2">Открывай и забирай выгоду</p>
                <Button className="mt-4 bg-primary hover:bg-primary/90">К бонусам</Button>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>

      {/* Tournaments */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Турниры</h2>
            <div className="flex gap-2">
                <Button variant="outline" size="icon"><ChevronLeft /></Button>
                <Button variant="outline" size="icon"><ChevronRight /></Button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tournaments.map((tour, index) => (
            <Card key={index} className="bg-card border-border overflow-hidden">
                <CardHeader>
                    <CardTitle>{tour.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-accent font-bold text-lg">
                        <Trophy className="h-5 w-5"/>
                        <span>{tour.prize}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                             <Users className="h-4 w-4"/>
                             <span>{tour.players}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Clock className="h-4 w-4"/>
                            <span>До завершения {tour.time}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-primary/20 text-primary hover:bg-primary/30">Участвовать</Button>
                </CardFooter>
            </Card>
          ))}
        </div>
      </div>

       {/* Play the best */}
       <div>
        <h2 className="text-2xl font-bold mb-4">Играй в лучшее</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link href={game.href} key={game.id}>
              <div className="relative aspect-video rounded-lg overflow-hidden group">
                  <Image src={game.imageUrl} alt={t[game.titleKey as keyof typeof t]} fill className="object-cover group-hover:scale-110 transition-transform duration-300"/>
                  <div className="absolute inset-0 bg-black/50 flex items-end p-4">
                      <h3 className="text-xl font-bold text-white">{t[game.titleKey as keyof typeof t]}</h3>
                  </div>
              </div>
            </Link>
          ))}
        </div>
       </div>
    </div>
  );
}
