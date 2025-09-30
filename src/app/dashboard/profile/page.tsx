
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { User, Shield, Crown, TrendingUp, History, Edit, Save, MailCheck, MailWarning } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
    const { language } = useLanguage();
    const t = translations[language];
    const { user: authUser, updateUserProfile, sendVerificationEmail } = useAuth();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(authUser?.displayName || "");
    const [isSaving, setIsSaving] = useState(false);

    const user = {
        name: authUser?.displayName || "Player123",
        email: authUser?.email,
        emailVerified: authUser?.emailVerified,
        avatar: authUser?.photoURL || "https://picsum.photos/seed/user/100/100",
        level: 12,
        xp: 450,
        xpNeeded: 1000,
        rank: "Gold",
        gamesPlayed: 1234,
        totalWagered: 56789,
    };
    
    const handleSave = async () => {
        if (nickname.trim() === "") {
            toast({ title: "Никнейм не может быть пустым", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await updateUserProfile({ displayName: nickname });
            setIsEditing(false);
        } catch (error) {
            // Toast is handled in AuthContext
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendVerification = async () => {
        try {
            await sendVerificationEmail();
        } catch (error) {
            // Toast is handled in AuthContext
        }
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
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        {isEditing ? (
                            <div className="flex items-center gap-2 max-w-sm">
                                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} className="text-3xl font-bold h-12" />
                            </div>
                        ) : (
                            <h2 className="text-3xl font-bold">{user.name}</h2>
                        )}

                        <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                             <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>Уровень {user.level}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-accent" />
                                <span>Ранг: {user.rank}</span>
                            </div>
                        </div>

                         <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                            <span className="text-muted-foreground">{user.email}</span>
                            {user.emailVerified ? (
                                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <MailCheck className="mr-1 h-3 w-3"/> Подтвержден
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                     <MailWarning className="mr-1 h-3 w-3"/> Не подтвержден
                                </Badge>
                            )}
                        </div>

                        {!user.emailVerified && (
                             <Button variant="link" size="sm" onClick={handleSendVerification} className="p-0 h-auto">
                                Отправить письмо для подтверждения
                            </Button>
                        )}
                        
                    </div>
                     {isEditing ? (
                         <div className="flex gap-2">
                            <Button onClick={() => setIsEditing(false)} variant="outline">Отмена</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="mr-2 h-4 w-4"/> {isSaving ? "Сохранение..." : "Сохранить"}
                            </Button>
                         </div>
                     ) : (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4"/> Редактировать профиль
                        </Button>
                     )}
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
