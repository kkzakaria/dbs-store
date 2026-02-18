"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileMenu = dynamic(() =>
  import("./mobile-menu").then((m) => m.MobileMenu)
);

export function MobileMenuTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      {open && <MobileMenu open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
