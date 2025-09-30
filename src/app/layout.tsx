
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { BalanceProvider } from '@/contexts/BalanceContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

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
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <BalanceProvider>
                <div className="flex min-h-screen w-full">
                    <Sidebar />
                    <div className="flex flex-1 flex-col">
                        <Header />
                        <main className="flex-1 p-4 sm:p-6 overflow-auto">
                            {children}
                        </main>
                    </div>
                </div>
                <Toaster />
              </BalanceProvider>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

    