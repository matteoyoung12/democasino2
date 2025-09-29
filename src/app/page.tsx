
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/components/logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { LanguageProvider } from '@/contexts/LanguageContext';

function HomePageContent() {
  const heroImage = PlaceHolderImages.find((p) => p.id === 'hero-background');
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover object-center opacity-10"
        />
      )}
       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      
      <div className="relative z-10 flex flex-col items-center p-8 text-center">
        <Logo className="mb-4 text-6xl md:text-8xl" />
        <p className="mt-4 max-w-2xl text-lg text-foreground/80 md:text-xl">
          {t.heroSlogan}
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button asChild variant="default" size="lg" className="px-8 py-6 text-lg">
             <Link href="/dashboard">{t.viewGames}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


export default function Home() {
  return (
    <LanguageProvider>
      <HomePageContent />
    </LanguageProvider>
  )
}
