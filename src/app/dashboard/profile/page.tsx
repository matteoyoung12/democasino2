
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { User, Shield, Crown, TrendingUp, History } from "lucide-react";

export default function ProfilePage() {
    const { language } = useLanguage();
    const t = translations[language];

    const user = {
        name: "Player123",
        avatar: "https://picsum.photos/seed/user/100/100",
        level: 12,
        xp: 450,
        xpNeeded: 1000,
        rank: "Gold",
        gamesPlayed: 1234,
        totalWagered: 56789,
    };

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>{t.profile}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-8">
                    <Avatar className="h-32 w-32">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <h2 className="text-3xl font-bold">{user.name}</h2>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>Уровень {user.level}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-accent" />
                                <span>Ранг: {user.rank}</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>Опыт</span>
                                <span>{user.xp} / {user.xpNeeded}</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(user.xp / user.xpNeeded) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                     <Button>Редактировать профиль</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Сыграно игр</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.gamesPlayed}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего поставлено</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.totalWagered.toLocaleString('ru-RU')} ₽</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">История игр</CardTitle>
                        <Button variant="outline" size="sm">Посмотреть</Button>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-muted-foreground">Просмотрите свои последние игровые сессии</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
