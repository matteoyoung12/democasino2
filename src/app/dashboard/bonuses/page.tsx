
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Gift, PlusCircle,percent } from 'lucide-react';
import Image from "next/image";

const bonuses = [
  {
    title: "Бонус на первый депозит",
    description: "+100% к вашему первому пополнению до 10 000 ₽",
    bgUrl: "https://picsum.photos/seed/b1/400/200",
    action: "Активировать"
  },
  {
    title: "Кэшбэк 10%",
    description: "Получайте 10% кэшбэка с проигрышей каждую неделю",
    bgUrl: "https://picsum.photos/seed/b2/400/200",
    action: "Подробнее"
  },
  {
    title: "Бесплатные вращения",
    description: "25 бесплатных вращений в игре 'Book of Ra' за депозит от 1 000 ₽",
    bgUrl: "https://picsum.photos/seed/b3/400/200",
    action: "Получить"
  },
   {
    title: "Промокод 'NEWYEAR2025'",
    description: "Введите промокод и получите 500 ₽ на свой счет",
    bgUrl: "https://picsum.photos/seed/b4/400/200",
    action: "Ввести код"
  },
]

export default function BonusesPage() {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.bonuses}</CardTitle>
                    <CardDescription>Активируйте бонусы и получайте больше выгоды!</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {bonuses.map((bonus, index) => (
                       <Card key={index} className="overflow-hidden relative">
                           <Image src={bonus.bgUrl} alt={bonus.title} fill className="object-cover opacity-20"/>
                           <div className="relative p-6 bg-gradient-to-r from-black/80 to-transparent h-full flex flex-col justify-between">
                               <div>
                                   <h3 className="text-xl font-bold">{bonus.title}</h3>
                                   <p className="text-muted-foreground mt-1">{bonus.description}</p>
                               </div>
                               <Button className="mt-4 w-full md:w-auto self-start">{bonus.action}</Button>
                           </div>
                       </Card>
                   ))}
                </CardContent>
            </Card>
        </div>
    );
}
