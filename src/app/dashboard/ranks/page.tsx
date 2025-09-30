
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Crown, User } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "MysticGambler", winnings: 150000.00, avatar: "https://picsum.photos/seed/rank1/40/40" },
  { rank: 2, name: "CasinoQueen", winnings: 125000.50, avatar: "https://picsum.photos/seed/rank2/40/40" },
  { rank: 3, name: "JackpotJoe", winnings: 110000.75, avatar: "https://picsum.photos/seed/rank3/40/40" },
  { rank: 4, name: "BettingKing", winnings: 98000.00, avatar: "https://picsum.photos/seed/rank4/40/40" },
  { rank: 5, name: "LuckyLucy", winnings: 85000.25, avatar: "https://picsum.photos/seed/rank5/40/40" },
  { rank: 6, name: "PokerPro", winnings: 76000.00, avatar: "https://picsum.photos/seed/rank6/40/40" },
  { rank: 7, name: "RouletteRick", winnings: 65000.50, avatar: "https://picsum.photos/seed/rank7/40/40" },
  { rank: 8, name: "HighRoller", winnings: 60000.00, avatar: "https://picsum.photos/seed/rank8/40/40" },
  { rank: 9, name: "GoldenSpins", winnings: 55000.00, avatar: "https://picsum.photos/seed/rank9/40/40" },
  { rank: 10, name: "AceHigh", winnings: 50000.00, avatar: "https://picsum.photos/seed/rank10/40/40" },
];

export default function RanksPage() {
    const { language } = useLanguage();
    const t = translations[language];

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-yellow-600';
        return 'text-muted-foreground';
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.ranks}</CardTitle>
                    <CardDescription>Таблица лидеров по выигрышам за неделю</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                       {leaderboardData.map((player, index) => (
                           <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                               <div className="flex items-center gap-4">
                                   <div className={`text-xl font-bold w-8 text-center ${getRankColor(player.rank)}`}>
                                        {player.rank}
                                   </div>
                                   <Avatar>
                                       <AvatarImage src={player.avatar} />
                                       <AvatarFallback><User /></AvatarFallback>
                                   </Avatar>
                                   <span className="font-medium">{player.name}</span>
                               </div>
                               <div className="font-bold text-lg text-accent">
                                   {player.winnings.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 })}
                               </div>
                           </div>
                       ))}
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}
