
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
  Volume2,
  Trophy,
  LogOut,
  Wallet
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
import { useAuth } from "@/contexts/AuthContext";


const topNavItems = [
    { href: "/dashboard/tournaments", labelKey: "tournaments", icon: Trophy },
    { href: "/dashboard/ranks", labelKey: "ranks", icon: Star },
    { href: "/dashboard/reviews", labelKey: "reviews", icon: MessageSquare },
    { href: "/dashboard/help", labelKey: "help", icon: HelpCircle },
    { href: "/dashboard/bonuses", labelKey: "bonuses", icon: Gift, highlighted: true },
]


export default function Header() {
    const { language, setLanguage } = useLanguage();
    const { balance, setBalance } = useBalance();
    const t = translations[language];
    const { user, logout } = useAuth();

    return (
        <header className="flex h-20 items-center justify-between border-b border-border bg-card px-6">
            <nav className="flex items-center gap-4">
               {user && topNavItems.map(item => (
                    <Button key={item.labelKey} variant={item.highlighted ? "secondary" : "link"} asChild className={item.highlighted ? "bg-accent/20 text-accent" : "text-foreground"}>
                        <Link href={item.href}>
                             <item.icon className="mr-2 h-4 w-4" />
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

                {user ? (
                    <>
                        <div className="flex items-center gap-2 rounded-md bg-background p-2">
                            <div className="text-sm text-muted-foreground">{t.balance}</div>
                            <div className="flex items-center font-bold">
                                <BadgeRussianRuble className="h-5 w-5 mr-1" />
                                {balance.toFixed(2)}
                            </div>
                        </div>

                        <Button asChild variant="ghost" className="text-green-500 hover:text-green-500 hover:bg-green-500/10">
                            <Link href="/dashboard/wallet">
                                <PlusCircle className="mr-2" /> {t.deposit}
                            </Link>
                        </Button>
                         <Button asChild variant="ghost" className="text-red-500 hover:text-red-500 hover:bg-red-500/10">
                            <Link href="/dashboard/wallet">
                                <MinusCircle className="mr-2" /> {t.withdraw}
                            </Link>
                        </Button>

                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Avatar className="cursor-pointer">
                                  <AvatarImage src={user.photoURL || "https://picsum.photos/seed/user/100/100"} />
                                  <AvatarFallback><User /></AvatarFallback>
                               </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>{t.profile}</span>
                                    </Link>
                                </DropdownMenuItem>
                                 <DropdownMenuItem asChild>
                                    <Link href="/dashboard/wallet">
                                        <Wallet className="mr-2 h-4 w-4" />
                                        <span>{t.balance}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Выйти</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <>
                        <Button asChild>
                            <Link href="/login">Войти</Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href="/signup">Регистрация</Link>
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}

    