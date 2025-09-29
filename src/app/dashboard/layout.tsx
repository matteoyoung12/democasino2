
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gem,
  LayoutGrid,
  Rocket,
  Dice5,
  User,
  Settings,
  LogOut,
  Bomb,
  Wallet,
  Coins,
  CircleDollarSign,
  Palette,
  Spade,
  UserPlus,
  Languages
} from "lucide-react";
import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BalanceProvider, useBalance } from "@/contexts/BalanceContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";


const menuItems = [
  { href: "/dashboard", labelKey: "lobby", icon: LayoutGrid },
  { href: "/dashboard/slots", labelKey: "slots", icon: Gem },
  { href: "/dashboard/roulette", labelKey: "roulette", icon: Dice5 },
  { href: "/dashboard/crash", labelKey: "crash", icon: Rocket },
  { href: "/dashboard/mines", labelKey: "mines", icon: Bomb },
  { href: "/dashboard/coin-flip", labelKey: "coin_flip", icon: Coins },
  { href: "/dashboard/blackjack", labelKey: "blackjack", icon: Spade },
];


function DepositDialog() {
    const { balance, setBalance } = useBalance();
    const [amount, setAmount] = useState(100);
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = translations[language];

    const handleDeposit = () => {
        setBalance(balance + amount);
        toast({
            title: t.depositSuccessful,
            description: `${t.youHaveAdded} $${amount.toFixed(2)} ${t.toYourBalance}.`,
        });
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-auto">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t.makeDeposit}</DialogTitle>
                    <DialogDescription>
                        {t.enterDepositAmount}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            {t.amount}
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <Button onClick={handleDeposit} type="submit">{t.deposit}</Button>
            </DialogContent>
        </Dialog>
    )
}

const themeColors = [
    { name: 'Violet', value: '262 84% 58%' },
    { name: 'Blue', value: '221 83% 53%' },
    { name: 'Green', value: '142 76% 36%' },
    { name: 'Orange', value: '25 95% 53%' },
    { name: 'Red', value: '0 84% 60%' },
];


function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <Popover>
            <PopoverTrigger asChild>
                 <Button variant="outline" className="h-auto">
                    <Palette className="h-5 w-5 text-primary" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex gap-2">
                    {themeColors.map((color) => (
                         <button
                            key={color.name}
                            onClick={() => setTheme(color.value)}
                            className={cn("h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                                theme === color.value ? "border-primary" : "border-transparent"
                            )}
                            style={{ backgroundColor: `hsl(${color.value})` }}
                            aria-label={`Set theme to ${color.name}`}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function LanguageSwitcher() {
    const { setLanguage } = useLanguage();
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-auto">
                    <Languages className="h-5 w-5 text-primary" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" onClick={() => setLanguage('en')}>English</Button>
                    <Button variant="ghost" onClick={() => setLanguage('ru')}>Русский</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function TopNav() {
    const pathname = usePathname();
    const { balance } = useBalance();
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-4">
               <Link href="/dashboard">
                <Logo className="text-2xl" showIcon={false} />
               </Link>
            </div>
            <div className="flex flex-grow justify-center">
                <TooltipProvider>
                     <nav className="flex items-center gap-2 rounded-full border bg-card p-2">
                        {menuItems.map((item) => (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                     <Button asChild variant={pathname === item.href ? 'primary' : 'ghost'} className="h-11 w-11 rounded-full">
                                         <Link href={item.href}>
                                            <item.icon className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t[item.labelKey as keyof typeof t]}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </nav>
                </TooltipProvider>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-md font-medium">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span>${balance.toFixed(2)}</span>
                </div>
                <DepositDialog />
                <ThemeSelector />
                <LanguageSwitcher />
                 <Avatar className="h-11 w-11 border-2 border-primary/50">
                    <AvatarImage src={"https://picsum.photos/seed/user/100/100"} />
                    <AvatarFallback>G</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
    const { theme } = useTheme();

    return (
        <div className="flex min-h-screen w-full flex-col" style={{ '--primary': theme } as React.CSSProperties}>
            <TopNav />
            {children}
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <BalanceProvider>
                    <DashboardLayoutContent>{children}</DashboardLayoutContent>
                </BalanceProvider>
            </ThemeProvider>
        </LanguageProvider>
    );
}
