
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { BalanceProvider } from '@/contexts/BalanceContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'UP-X Casino',
  description: 'Online Casino Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, "dark")} suppressHydrationWarning>
      <body className="font-body antialiased">
        <LanguageProvider>
          <ThemeProvider>
            <BalanceProvider>
                {children}
                <Toaster />
            </BalanceProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
