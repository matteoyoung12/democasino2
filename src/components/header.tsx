
"use client";

import Link from "next/link";
import {
  Swords,
  Users,
  Star,
  MessageSquare,
  HelpCircle,
  Gift,
  BadgeRussianRuble,
  PlusCircle,
  MinusCircle,
  User,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { useBalance } from "@/contexts/BalanceContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const topNavItems = [
    { href: "#", labelKey: "games" },
    { href: "#", labelKey: "tournaments" },
    { href: "#", labelKey: "ranks" },
    { href: "#", labelKey: "reviews" },
    { href: "#", labelKey: "help" },
    { href: "#", labelKey: "bonuses", highlighted: true },
]


export default function Header() {
    const { language, setLanguage } = useLanguage();
    const { balance, setBalance } = useBalance();
    const t = translations[language];

    const handleDeposit = () => setBalance(prev => prev + 100);
    const handleWithdraw = () => setBalance(prev => prev > 100 ? prev - 100 : 0);

    return (
        <header className="flex h-20 items-center justify-between border-b border-border bg-card px-6">
            <nav className="flex items-center gap-4">
                {topNavItems.map(item => (
                    <Button key={item.labelKey} variant={item.highlighted ? "secondary" : "link"} asChild className={item.highlighted ? "bg-accent/20 text-accent" : "text-foreground"}>
                        <Link href={item.href}>
                             {t[item.labelKey as keyof typeof t]}
                        </Link>
                    </Button>
                ))}
            </nav>

            <div className="flex items-center gap-4">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            {language.toUpperCase()}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setLanguage('en')}>EN</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage('ru')}>RU</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon">
                    <Volume2 />
                </Button>

                <div className="flex items-center gap-2 rounded-md bg-background p-2">
                    <div className="text-sm text-muted-foreground">{t.balance}</div>
                    <div className="flex items-center font-bold">
                        <BadgeRussianRuble className="h-5 w-5 mr-1" />
                        {balance.toFixed(2)}
                    </div>
                </div>

                <Button onClick={handleDeposit} variant="ghost" className="text-green-500 hover:text-green-500 hover:bg-green-500/10">
                    <PlusCircle className="mr-2" /> {t.deposit}
                </Button>
                 <Button onClick={handleWithdraw} variant="ghost" className="text-red-500 hover:text-red-500 hover:bg-red-500/10">
                    <MinusCircle className="mr-2" /> {t.withdraw}
                </Button>

                 <Avatar>
                    <AvatarImage src={"https://picsum.photos/seed/user/100/100"} />
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
