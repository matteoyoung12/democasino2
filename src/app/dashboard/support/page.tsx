
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";

const faqData = [
  {
    question: "Как пополнить баланс?",
    answer: "Перейдите в раздел 'Баланс' в шапке сайта и нажмите кнопку 'Пополнить'. Выберите удобный способ оплаты и следуйте инструкциям."
  },
  {
    question: "Как вывести выигрыш?",
    answer: "В разделе 'Баланс' нажмите 'Вывести', укажите сумму и выберите платежную систему. Заявки на вывод обрабатываются в течение 24 часов."
  },
  {
    question: "Что делать, если игра зависла?",
    answer: "Попробуйте обновить страницу. Ваш игровой прогресс сохраняется на сервере. Если проблема не решилась, обратитесь в службу поддержки."
  },
  {
    question: "Как получить бонус?",
    answer: "Все доступные бонусы находятся в разделе 'Бонусы'. Ознакомьтесь с условиями и нажмите кнопку 'Активировать' или 'Получить'."
  }
];

export default function SupportPage() {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.support}</CardTitle>
                    <CardDescription>Часто задаваемые вопросы</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqData.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                <AccordionContent>
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Служба поддержки</CardTitle>
                    <CardDescription>Если вы не нашли ответ на свой вопрос</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-center">
                    <p className="flex-1 text-muted-foreground">Наша служба поддержки работает 24/7. Свяжитесь с нами в онлайн-чате для быстрой помощи.</p>
                    <Button>Написать в чат</Button>
                </CardContent>
            </Card>
        </div>
    );
}
