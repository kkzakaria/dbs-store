import { redirect } from "next/navigation"
import { getCurrentUser } from "@/actions/auth"
import { AccountNav, AccountNavMobile, AccountHeader } from "@/components/store/account"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Mon compte | DBS Store",
  description: "Gérez votre profil, vos adresses et vos commandes",
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?redirect=/account")
  }

  return (
    <div className="container py-6 md:py-10">
      {/* Header with user info */}
      <div className="mb-6">
        <AccountHeader user={user} />
      </div>

      <Separator className="mb-6" />

      {/* Mobile navigation */}
      <div className="mb-6 md:hidden">
        <AccountNavMobile />
      </div>

      {/* Desktop layout with sidebar */}
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar (desktop only) */}
        <aside className="hidden w-64 shrink-0 md:block">
          <Card className="sticky top-24 p-4">
            <AccountNav />
          </Card>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <Card className="p-6">{children}</Card>
        </main>
      </div>
    </div>
  )
}
