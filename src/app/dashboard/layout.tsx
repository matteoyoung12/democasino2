
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
  CircleDollarSign
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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BalanceProvider, useBalance } from "@/contexts/BalanceContext";

const menuItems = [
  { href: "/dashboard", label: "Lobby", icon: LayoutGrid },
  { href: "/dashboard/slots", label: "Slots", icon: Gem },
  { href: "/dashboard/roulette", label: "Roulette", icon: Dice5 },
  { href: "/dashboard/crash", label: "Crash", icon: Rocket },
  { href: "/dashboard/mines", label: "Mines", icon: Bomb },
  { href: "/dashboard/coin-flip", label: "Coin Flip", icon: Coins },
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


function TopNav() {
    const pathname = usePathname();
    const { balance } = useBalance();

    return (
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-4">
               <Logo className="text-2xl" showIcon={false} />
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
                <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-md font-medium">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span>${balance.toFixed(2)}</span>
                </div>
                <DepositDialog />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto rounded-full p-0">
                             <Avatar className="h-11 w-11 border-2 border-primary/50">
                                <AvatarImage src="https://picsum.photos/seed/user/100/100" />
                                <AvatarFallback>BF</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
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
                        <DropdownMenuItem asChild>
                            <Link href="/">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </Link>
                        </DropdownMenuItem>
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
    return (
        <div className="flex min-h-screen w-full flex-col">
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
        <BalanceProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </BalanceProvider>
    );
}
