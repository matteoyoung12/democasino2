import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
       <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-10 w-10 text-primary"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M12 15s3.5-1.5 3.5-3.5" />
        <path d="M12 15s-3.5-1.5-3.5-3.5" />
      </svg>
      <h1 className={cn('font-headline font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text', 'text-base')}>
        Blatnaя Family
      </h1>
    </div>
  );
}
