"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollState } from "@/hooks/use-scroll-state";
import { DesktopNav } from "./desktop-nav";
import { MobileMenuTrigger } from "./mobile-menu-trigger";
import { CartIndicator } from "./cart-indicator";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

const SearchOverlay = dynamic(
  () => import("./search-overlay").then((m) => m.SearchOverlay),
  { loading: () => <div className="fixed inset-0 z-50 bg-background/80" /> }
);

export function AppBar() {
  const { isScrolled } = useScrollState(50);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "sticky z-50 w-full transition-[top] duration-200",
          isScrolled ? "top-3" : "top-0"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-start gap-1 px-3 lg:px-4">
          {/* Mobile menu button — outside the pill */}
          <div className="flex h-[52px] items-center lg:hidden">
            <MobileMenuTrigger />
          </div>

          {/* Pill container */}
          <div
            className={cn(
              "flex h-[60px] flex-1 items-center rounded-full bg-background px-5 transition-shadow duration-200 lg:h-[60px]",
              isScrolled && "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.08)]"
            )}
          >
            <Link
              href="/"
              className="mr-6 flex items-center text-xl font-bold tracking-tight lg:mr-8"
            >
              DBS
            </Link>

            <div className="hidden flex-1 lg:flex">
              <DesktopNav />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Rechercher" onClick={() => setSearchOpen(true)}>
                <Search className="size-5" />
              </Button>
              <CartIndicator count={0} />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {searchOpen && (
        <SearchOverlay onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
