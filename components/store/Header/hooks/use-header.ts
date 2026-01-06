"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useCart } from "@/hooks/use-cart";
import { useHasActivePromotions } from "@/hooks/use-promotions";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "next-themes";

export function useHeader() {
    const pathname = usePathname();
    const { user, authUser, signOut, isLoading } = useUser();
    const { totalItems, openCart, isHydrated } = useCart();
    const { hasPromotions } = useHasActivePromotions();
    const { openLogin } = useAuthStore();
    const { resolvedTheme } = useTheme();

    const [searchOpen, setSearchOpen] = React.useState(false);
    const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
    const [mobileUserMenuOpen, setMobileUserMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [activeCategory, setActiveCategory] = React.useState<string | null>(
        null,
    );

    const megaMenuRef = React.useRef<HTMLDivElement>(null);

    // Mount effect
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Handle scroll effect - detect when to transform to pill
    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Keyboard shortcut for search
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === "Escape") {
                setActiveCategory(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Close mega menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                megaMenuRef.current &&
                !megaMenuRef.current.contains(e.target as Node)
            ) {
                setActiveCategory(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Compute user initials
    const userInitials = user?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return {
        // Navigation
        pathname,

        // User state
        user,
        authUser,
        signOut,
        isLoading,
        userInitials,
        openLogin,

        // Cart state
        totalItems,
        openCart,
        isHydrated,

        // Promotions
        hasPromotions,

        // Theme
        resolvedTheme,

        // UI state
        searchOpen,
        setSearchOpen,
        mobileNavOpen,
        setMobileNavOpen,
        mobileUserMenuOpen,
        setMobileUserMenuOpen,
        isScrolled,
        mounted,
        activeCategory,
        setActiveCategory,

        // Refs
        megaMenuRef,
    };
}

export type UseHeaderReturn = ReturnType<typeof useHeader>;
