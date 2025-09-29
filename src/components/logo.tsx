import { cn } from '@/lib/utils';
import { Gem } from 'lucide-react';

type LogoProps = {
  className?: string;
  showIcon?: boolean;
};

export default function Logo({ className, showIcon = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      {showIcon && <Gem className="text-primary" />}
      <h1 className={cn('font-headline font-bold tracking-tight', className)}>
        Blatna<span className="text-accent">я</span> Family
      </h1>
    </div>
  );
}
