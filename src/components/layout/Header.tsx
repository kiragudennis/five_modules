"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, User, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStore } from "@/lib/context/StoreContext";
import { Badge } from "../ui/badge";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Categories", href: "/categories" },
  { name: "Account", href: "/accounts" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const adminNavigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Products", href: "/admin/products" },
  { name: "Orders", href: "/admin/orders" },
  { name: "Coupons", href: "/admin/coupons" },
  { name: "Tracking", href: "/admin/tracking" },
  { name: "Customers", href: "/admin/customers" },
  { name: "Marketing", href: "/admin/marketing" },
  { name: "Analytics", href: "/admin/analytics" },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useStore();
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavigation : navigation;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300 px-2">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center justify-center gap-6">
          <Link
            href="/"
            className="font-bold text-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent animate-gradient-xy"
          >
            BTE
          </Link>

          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Shopping Cart"
                className="relative"
              >
                {totalItems > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 min-w-5 rounded-full px-1 tabular-nums text-xs"
                  >
                    {totalItems}
                  </Badge>
                )}
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Link href={isAdmin ? "/" : "/admin"}>
            <Button variant="ghost" size="icon" aria-label="User Account">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Menu"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="px-2">
              <SheetHeader>
                <SheetTitle>{isAdmin ? "Admin Menu" : "Menu"}</SheetTitle>
                <SheetDescription>
                  Navigate through the site using the links below.
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href
                        ? "text-foreground"
                        : "text-foreground/60"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
