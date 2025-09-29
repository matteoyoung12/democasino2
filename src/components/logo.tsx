import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <h1 className={cn('font-headline font-bold tracking-tight', className)}>
      Blatna<span className="text-accent">я</span> Family
    </h1>
  );
}
