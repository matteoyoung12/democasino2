
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBalance } from "@/contexts/BalanceContext";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, CreditCard, DollarSign, QrCode, Wallet as WalletIcon, Copy, Check } from "lucide-react";
import Image from "next/image";

const cryptoOptions = [
    { name: "Bitcoin", ticker: "BTC", icon: <Bitcoin className="h-6 w-6" /> },
    { name: "Ethereum", ticker: "ETH", icon: <DollarSign className="h-6 w-6" /> },
];

const cryptoAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

export default function WalletPage() {
    const { balance, setBalance } = useBalance();
    const { toast } = useToast();
    const [depositAmount, setDepositAmount] = useState("100");
    const [withdrawAmount, setWithdrawAmount] = useState("50");
    const [copied, setCopied] = useState(false);

    const handleDeposit = () => {
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Неверная сумма", variant: "destructive" });
            return;
        }
        setBalance(prev => prev + amount);
        toast({ title: "Пополнение успешно!", description: `Ваш баланс пополнен на ${amount.toLocaleString('ru-RU')} ₽` });
    };

    const handleWithdraw = () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Неверная сумма", variant: "destructive" });
            return;
        }
        if (amount > balance) {
            toast({ title: "Недостаточно средств", variant: "destructive" });
            return;
        }
        setBalance(prev => prev - amount);
        toast({ title: "Вывод одобрен!", description: `${amount.toLocaleString('ru-RU')} ₽ будут отправлены вам в ближайшее время.` });
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(cryptoAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><WalletIcon /> Мой кошелек</CardTitle>
                    <CardDescription>Ваш текущий баланс: <span className="font-bold text-primary">{balance.toLocaleString('ru-RU', {style: 'currency', currency: 'RUB'})}</span></CardDescription>
                </CardHeader>
            </Card>

            <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit">Пополнить</TabsTrigger>
                    <TabsTrigger value="withdraw">Вывести</TabsTrigger>
                </TabsList>
                
                {/* DEPOSIT TAB */}
                <TabsContent value="deposit">
                    <Card>
                        <CardHeader>
                            <CardTitle>Пополнение баланса</CardTitle>
                            <CardDescription>Выберите способ пополнения</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="card" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="card"><CreditCard className="mr-2"/>Карта</TabsTrigger>
                                    <TabsTrigger value="crypto"><Bitcoin className="mr-2"/>Криптовалюта</TabsTrigger>
                                </TabsList>

                                <TabsContent value="card" className="mt-6">
                                     <div className="space-y-4 max-w-md mx-auto">
                                        <div className="space-y-2">
                                            <Label htmlFor="deposit-amount-card">Сумма пополнения (₽)</Label>
                                            <Input id="deposit-amount-card" type="number" placeholder="1000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="card-number">Номер карты</Label>
                                            <Input id="card-number" placeholder="0000 0000 0000 0000" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="expiry-date">Срок</Label>
                                                <Input id="expiry-date" placeholder="ММ/ГГ" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvc">CVC</Label>
                                                <Input id="cvc" placeholder="123" />
                                            </div>
                                        </div>
                                        <Button className="w-full" onClick={handleDeposit}>Пополнить на {parseFloat(depositAmount || '0').toLocaleString('ru-RU')} ₽</Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="crypto" className="mt-6">
                                    <div className="space-y-4 max-w-md mx-auto text-center">
                                        <p className="text-muted-foreground">Отправьте криптовалюту на указанный адрес для пополнения вашего баланса.</p>
                                        <Select defaultValue="BTC">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите криптовалюту" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cryptoOptions.map(crypto => (
                                                    <SelectItem key={crypto.ticker} value={crypto.ticker}>
                                                        <div className="flex items-center gap-2">
                                                            {crypto.icon}
                                                            <span>{crypto.name} ({crypto.ticker})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="bg-background rounded-lg p-4 flex flex-col items-center gap-4">
                                             <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${cryptoAddress}`} width={150} height={150} alt="QR Code" />
                                            <div className="text-sm font-mono break-all p-2 rounded-md bg-secondary w-full">{cryptoAddress}</div>
                                            <Button variant="outline" onClick={copyToClipboard} className="w-full">
                                                {copied ? <Check className="mr-2 text-green-500"/> : <Copy className="mr-2"/>}
                                                {copied ? 'Скопировано!' : 'Копировать адрес'}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* WITHDRAW TAB */}
                <TabsContent value="withdraw">
                    <Card>
                        <CardHeader>
                            <CardTitle>Вывод средств</CardTitle>
                            <CardDescription>Выберите способ вывода</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="card" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="card"><CreditCard className="mr-2"/>Карта</TabsTrigger>
                                    <TabsTrigger value="crypto"><Bitcoin className="mr-2"/>Криптовалюта</TabsTrigger>
                                </TabsList>

                                 <TabsContent value="card" className="mt-6">
                                     <div className="space-y-4 max-w-md mx-auto">
                                        <div className="space-y-2">
                                            <Label htmlFor="withdraw-amount-card">Сумма вывода (₽)</Label>
                                            <Input id="withdraw-amount-card" type="number" placeholder="500" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="withdraw-card-number">Номер карты</Label>
                                            <Input id="withdraw-card-number" placeholder="0000 0000 0000 0000" />
                                        </div>
                                        <Button className="w-full" onClick={handleWithdraw}>Вывести {parseFloat(withdrawAmount || '0').toLocaleString('ru-RU')} ₽</Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="crypto" className="mt-6">
                                     <div className="space-y-4 max-w-md mx-auto">
                                        <div className="space-y-2">
                                            <Label htmlFor="withdraw-amount-crypto">Сумма вывода (₽)</Label>
                                            <Input id="withdraw-amount-crypto" type="number" placeholder="500" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="crypto-address">Адрес вашего кошелька</Label>
                                            <Input id="crypto-address" placeholder="bc1q..." />
                                        </div>
                                        <Button className="w-full" onClick={handleWithdraw}>Вывести {parseFloat(withdrawAmount || '0').toLocaleString('ru-RU')} ₽</Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    