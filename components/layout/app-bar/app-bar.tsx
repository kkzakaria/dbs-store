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

const SearchOverlay = dynamic(() =>
  import("./search-overlay").then((m) => m.SearchOverlay)
);

export function AppBar() {
  const { isScrolled } = useScrollState(50);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm transition-shadow",
          isScrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto flex h-15 max-w-7xl items-center px-4 lg:px-6">
          {/* Mobile: hamburger menu */}
          <div className="lg:hidden">
            <MobileMenuTrigger />
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="mr-6 flex items-center text-xl font-bold tracking-tight"
          >
            DBS
          </Link>

          {/* Desktop navigation */}
          <div className="hidden flex-1 lg:flex">
            <DesktopNav />
          </div>

          {/* Right side icons */}
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Rechercher" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </Button>
            <CartIndicator count={0} />
            <UserMenu />
          </div>
        </div>
      </header>

      {searchOpen && (
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
