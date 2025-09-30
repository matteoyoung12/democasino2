
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Swords,
  Users,
  Star,
  MessageSquare,
  HelpCircle,
  Gift,
  Bell,
  Wallet,
  Coins,
  Rocket,
  Bomb,
  Gem,
  Spade,
  Disc,
  Trophy
} from "lucide-react";
import Logo from "@/components/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";


const RouletteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="1" />
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="m22 12-4 0" />
        <path d="m6 12-4 0" />
        <path d="m19.78 4.22-3 3" />
        <path d="m7.22 16.78-3-3" />
        <path d="m4.22 4.22 3 3" />
        <path d="m16.78 16.78 3 3" />
    </svg>
);


const topItems = [
  { href: "/dashboard", labelKey: "lobby", icon: Swords },
];

const gameItems = [
  { href: "/dashboard/plinko", labelKey: "plinko", icon: Disc },
  { href: "/dashboard/roulette", labelKey: "roulette", icon: RouletteIcon },
  { href: "/dashboard/crash", labelKey: "crash", icon: Rocket },
  { href: "/dashboard/mines", labelKey: "mines", icon: Bomb },
  { href: "/dashboard/coin-flip", labelKey: "coin_flip", icon: Coins },
  { href: "/dashboard/blackjack", labelKey: "blackjack", icon: Spade },
];

const mainNavItems = [
    { href: "/dashboard/tournaments", labelKey: "tournaments", icon: Trophy },
    { href: "/dashboard/ranks", labelKey: "ranks", icon: Star },
    { href: "/dashboard/bonuses", labelKey: "bonuses", icon: Gift },
];

const bottomItems = [
    { href: "/dashboard/support", labelKey: "support", icon: HelpCircle },
    { href: "#", labelKey: "notifications", icon: Bell, notification: true },
]


export default function Sidebar() {
    const pathname = usePathname();
    const { language } = useLanguage();
    const t = translations[language];

    const allNavItems = [...topItems, ...gameItems, ...mainNavItems];

    return (
        <aside className="w-20 bg-card flex flex-col items-center py-4 px-2">
             <Link href="/dashboard" className="mb-8">
                <Logo className="text-sm text-center" />
               </Link>
            <TooltipProvider>
                <nav className="flex flex-col items-center gap-3">
                    {allNavItems.map((item) => (
                         <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === item.href ? 'secondary' : 'ghost'} className={cn("h-12 w-12 rounded-lg", pathname === item.href && "bg-primary/20")}>
                                        <Link href={item.href}>
                                        <item.icon className="h-6 w-6 text-primary" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{t[item.labelKey as keyof typeof t]}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </nav>
                <div className="mt-auto flex flex-col items-center gap-3">
                    {bottomItems.map((item) => (
                         <Tooltip key={item.labelKey}>
                            <TooltipTrigger asChild>
                                <Button asChild variant='ghost' className="h-12 w-12 rounded-lg relative">
                                    <Link href={item.href}>
                                        <item.icon className="h-6 w-6 text-primary" />
                                        {item.notification && (
                                            <span className="absolute top-2 right-2 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-card"></span>
                                            </span>
                                        )}
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{t[item.labelKey as keyof typeof t]}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        </aside>
    )
}
