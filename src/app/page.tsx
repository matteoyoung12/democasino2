import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/components/logo';

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === 'hero-background');

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
          Experience the thrill of our exclusive online casino. Fair play, big wins, and endless entertainment await.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="bg-primary px-8 py-6 text-lg text-primary-foreground transition-transform hover:scale-105 hover:bg-primary/90">
            <Link href="/signup">Join Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-primary bg-transparent px-8 py-6 text-lg text-primary transition-colors hover:bg-primary/10 hover:text-primary">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
