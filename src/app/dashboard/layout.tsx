"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gem,
  LayoutGrid,
  Rocket,
  Dice5,
  User,
  Settings,
  LogOut,
  Bomb,
  Wallet,
} from "lucide-react";
import Logo from "@/components/logo";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/dashboard", label: "Lobby", icon: LayoutGrid },
  { href: "/dashboard/slots", label: "Slots", icon: Gem },
  { href: "/dashboard/roulette", label: "Roulette", icon: Dice5 },
  { href: "/dashboard/crash", label: "Crash", icon: Rocket },
  { href: "/dashboard/mines", label: "Mines", icon: Bomb },
];

function TopNav() {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-4">
                 <SidebarTrigger className="md:hidden" />
                <h1 className="hidden font-headline text-2xl font-bold tracking-tight text-foreground md:block">
                    { menuItems.find(item => item.href === usePathname())?.label }
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>$1,000.00</span>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto rounded-full p-0">
                             <Avatar className="h-9 w-9">
                                <AvatarImage src="https://picsum.photos/seed/user/100/100" />
                                <AvatarFallback>BF</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="text-xl" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <TopNav />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
