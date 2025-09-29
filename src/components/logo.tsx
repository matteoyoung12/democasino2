import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <div className="flex items-center">
      <h1 className={cn('font-headline font-bold tracking-tight', className)}>
        Blatnaя Family
      </h1>
    </div>
  );
}
