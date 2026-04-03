"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import type { Category } from "@/lib/db/schema";

const MobileMenu = dynamic(
  () => import("./mobile-menu").then((m) => m.MobileMenu),
  { loading: () => <div className="fixed inset-0 z-50 bg-background" /> }
);

export function MobileMenuTrigger({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/80"
      >
        <Menu className="size-5" />
      </button>
      {open && <MobileMenu categories={categories} onClose={() => setOpen(false)} />}
    </>
  );
}
