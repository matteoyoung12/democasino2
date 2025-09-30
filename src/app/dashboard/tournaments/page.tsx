
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import Image from "next/image";
import { Trophy, Users, Clock } from 'lucide-react';

const tournaments = [
    { title: "Blatnaя Family - Ежедневный", prize: "5 000.00 ₽", players: 126, time: "01:01:01:35", bgUrl: "https://picsum.photos/seed/t1/400/250" },
    { title: "Blatnaя Family - Недельный", prize: "25 000.00 ₽", players: 100, time: "04:00:31:35", bgUrl: "https://picsum.photos/seed/t2/400/250" },
    { title: "Blatnaя Family - Ежемесячный", prize: "100 000.00 ₽", players: 88, time: "25:01:31:35", bgUrl: "https://picsum.photos/seed/t3/400/250" },
    { title: "VIP Клуб", prize: "500 000.00 ₽", players: 25, time: "15:10:20:05", bgUrl: "https://picsum.photos/seed/t4/400/250" },
    { title: "Ночной спринт", prize: "2 000.00 ₽", players: 250, time: "00:30:15:10", bgUrl: "https://picsum.photos/seed/t5/400/250" },
    { title: "Счастливые часы", prize: "1 000.00 ₽", players: 300, time: "00:10:00:00", bgUrl: "https://picsum.photos/seed/t6/400/250" },
]

export default function TournamentsPage() {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.tournaments}</CardTitle>
                    <CardDescription>Участвуйте в турнирах и выигрывайте крупные призы!</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map((tour, index) => (
                        <Card key={index} className="bg-card border-border overflow-hidden relative text-white flex flex-col justify-between aspect-[4/3]">
                            <Image src={tour.bgUrl} alt={tour.title} fill className="object-cover opacity-20"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
                            <div className="relative z-10 p-6 flex flex-col h-full">
                                <CardHeader className="p-0">
                                    <CardTitle>{tour.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 mt-auto space-y-2">
                                    <div className="flex items-center gap-2 text-accent font-bold text-lg">
                                        <Trophy className="h-5 w-5"/>
                                        <span>{tour.prize}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4"/>
                                            <span>{tour.players}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4"/>
                                            <span>До завершения {tour.time}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-0 mt-4">
                                    <Button className="w-full bg-primary/20 text-primary hover:bg-primary/30">Участвовать</Button>
                                </CardFooter>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
