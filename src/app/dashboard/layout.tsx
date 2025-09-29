
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
  Spade
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
import { useAuth } from "@/contexts/AuthContext";


const menuItems = [
  { href: "/dashboard", label: "Lobby", icon: LayoutGrid },
  { href: "/dashboard/slots", label: "Slots", icon: Gem },
  { href: "/dashboard/roulette", label: "Roulette", icon: Dice5 },
  { href: "/dashboard/crash", label: "Crash", icon: Rocket },
  { href: "/dashboard/mines", label: "Mines", icon: Bomb },
  { href: "/dashboard/coin-flip", label: "Coin Flip", icon: Coins },
  { href: "/dashboard/blackjack", label: "Blackjack", icon: Spade },
];


function DepositDialog() {
    const { balance, setBalance } = useBalance();
    const [amount, setAmount] = useState(100);
    const { toast } = useToast();

    const handleDeposit = () => {
        setBalance(balance + amount);
        toast({
            title: "Deposit Successful",
            description: `You have added $${amount.toFixed(2)} to your balance.`,
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
                    <DialogTitle>Make a Deposit</DialogTitle>
                    <DialogDescription>
                        Enter the amount you would like to deposit into your account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Amount
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
                <Button onClick={handleDeposit} type="submit">Deposit</Button>
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

function TopNav() {
    const pathname = usePathname();
    const { balance } = useBalance();
    const { user, logout } = useAuth();

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
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </nav>
                </TooltipProvider>
            </div>
            <div className="flex items-center gap-4">
                { user &&
                    <>
                        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-md font-medium">
                            <Wallet className="h-5 w-5 text-primary" />
                            <span>${balance.toFixed(2)}</span>
                        </div>
                        <DepositDialog />
                    </>
                }
                <ThemeSelector />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto rounded-full p-0">
                             <Avatar className="h-11 w-11 border-2 border-primary/50">
                                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} />
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'G'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        { user ? <>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </> : <>
                             <DropdownMenuLabel>Guest</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/login">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Login</span>
                                </Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <Link href="/signup">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Sign Up</span>
                                </Link>
                            </DropdownMenuItem>
                        </>}
                    </DropdownMenuContent>
                </DropdownMenu>
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
        <ThemeProvider>
            <BalanceProvider>
                <DashboardLayoutContent>{children}</DashboardLayoutContent>
            </BalanceProvider>
        </ThemeProvider>
    );
}
