
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const reviews = [
  { name: "CasinoQueen", avatar: "https://picsum.photos/seed/rank2/40/40", rating: 5, text: "Отличное казино, быстрые выплаты и хорошая поддержка. Рекомендую!" },
  { name: "JackpotJoe", avatar: "https://picsum.photos/seed/rank3/40/40", rating: 4, text: "Много игр, но хотелось бы больше бонусов для постоянных игроков." },
  { name: "LuckyLucy", avatar: "https://picsum.photos/seed/rank5/40/40", rating: 5, text: "Выиграла крупную сумму в рулетке! Все честно, деньги вывели за час. Спасибо!" },
  { name: "HighRoller", avatar: "https://picsum.photos/seed/rank8/40/40", rating: 3, text: "Интерфейс немного запутанный, но в целом играть можно." },
];

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
        ))}
    </div>
);

export default function ReviewsPage() {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.reviews}</CardTitle>
                    <CardDescription>Что говорят наши игроки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {reviews.map((review, index) => (
                        <Card key={index} className="bg-secondary p-6">
                            <div className="flex items-start gap-4">
                                <Avatar>
                                    <AvatarImage src={review.avatar} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">{review.name}</h4>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="text-muted-foreground mt-2">{review.text}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Оставить отзыв</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-4">
                        <Textarea placeholder="Напишите свой отзыв..." />
                        <div className="flex items-center justify-between">
                             <div>
                                 <span className="text-sm text-muted-foreground mr-2">Ваша оценка:</span>
                                 <StarRating rating={0} />
                             </div>
                             <Button>Отправить отзыв</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
