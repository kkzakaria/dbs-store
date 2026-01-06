"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/Logo"
import { AdminNav } from "./AdminNav"

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center justify-center border-b px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <Link href="/admin" className="flex items-center gap-2">
          {collapsed ? (
            <span className="text-xl font-bold text-primary">D</span>
          ) : (
            <Logo asLink={false} variant="default" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <AdminNav collapsed={collapsed} />
      </div>

      {/* Collapse Toggle */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full justify-center", !collapsed && "justify-start")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Reduire</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
