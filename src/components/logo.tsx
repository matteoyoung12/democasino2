
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

type LogoProps = {
  className?: string;
  showIcon?: boolean;
};

export default function Logo({ className, showIcon = true }: LogoProps) {
  return (
    <div className="flex items-center gap-1">
      <h1 className={cn('font-headline font-bold tracking-tight text-2xl', className)}>
        UP-X
      </h1>
      {showIcon && <ArrowUpRight className="h-8 w-8 text-primary -ml-2 -mt-4" />}
    </div>
  );
}
