
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
  Spade
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


const gameItems = [
  { href: "/dashboard/slots", labelKey: "slots", icon: Gem },
  { href: "/dashboard/roulette", labelKey: "roulette", icon: "https://example.com/roulette.svg" }, // Needs custom SVG
  { href: "/dashboard/crash", labelKey: "crash", icon: Rocket },
  { href: "/dashboard/mines", labelKey: "mines", icon: Bomb },
  { href: "/dashboard/coin-flip", labelKey: "coin_flip", icon: Coins },
  { href: "/dashboard/blackjack", labelKey: "blackjack", icon: Spade },
];


const bottomItems = [
    { href: "#", labelKey: "support", icon: HelpCircle },
    { href: "#", labelKey: "notifications", icon: Bell, notification: true },
]


export default function Sidebar() {
    const pathname = usePathname();
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <aside className="w-20 bg-card flex flex-col items-center py-4 px-2">
             <Link href="/dashboard" className="mb-8">
                <Logo className="text-2xl" showIcon={true} />
               </Link>
            <TooltipProvider>
                <nav className="flex flex-col items-center gap-3">
                    {gameItems.map((item) => (
                         <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === item.href ? 'secondary' : 'ghost'} className="h-12 w-12 rounded-lg">
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
