"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { useAuth } from '@/contexts/AuthContext';

function HomePageContent() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <Image
          src="https://images.unsplash.com/photo-1557264322-b44d383a2906?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmt8ZW58MHx8fHwxNzU5MDY0ODI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Abstract background"
          fill
          className="object-cover object-center opacity-20"
        />
       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      
      <div className="relative z-10 flex flex-col items-center p-8 text-center">
        <Logo className="mb-4 text-4xl md:text-6xl" />
        <p className="mt-4 max-w-2xl text-lg text-foreground/80 md:text-xl">
          {t.heroSlogan}
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {user ? (
             <Button asChild variant="default" size="lg" className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
               <Link href="/dashboard">{t.viewGames}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="px-8 py-6 text-lg">
                <Link href="/signup">Зарегистрироваться</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="px-8 py-6 text-lg">
                <Link href="/login">Войти</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


export default function Home() {
  return (
      <HomePageContent />
  )
}
