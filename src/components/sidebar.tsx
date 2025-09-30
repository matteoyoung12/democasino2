
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Swords,
  Coins,
  Rocket,
  Bomb,
  Spade,
  Disc,
  Dice5
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


const allNavItems = [
  { href: "/", labelKey: "lobby", icon: Swords },
  { href: "/dashboard/plinko", labelKey: "plinko", icon: Disc },
  { href: "/dashboard/roulette", labelKey: "roulette", icon: RouletteIcon },
  { href: "/dashboard/crash", labelKey: "crash", icon: Rocket },
  { href: "/dashboard/mines", labelKey: "mines", icon: Bomb },
  { href: "/dashboard/coin-flip", labelKey: "coin_flip", icon: Coins },
  { href: "/dashboard/blackjack", labelKey: "blackjack", icon: Spade },
  { href: "/dashboard/dice", labelKey: "dice", icon: Dice5 },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <aside className="w-20 bg-card flex flex-col items-center py-4 px-2">
             <Link href="/" className="mb-4">
                <Logo className="text-center" />
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
            </TooltipProvider>
        </aside>
    )
}
