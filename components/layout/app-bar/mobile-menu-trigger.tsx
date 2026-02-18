"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileMenuTrigger() {
  return (
    <Button variant="ghost" size="icon" aria-label="Menu">
      <Menu className="size-5" />
    </Button>
  );
}
