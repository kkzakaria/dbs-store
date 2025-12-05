import { redirect } from "next/navigation"
import { getCurrentUser } from "@/actions/auth"
import { isAdminRole } from "@/lib/validations/admin"
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar"
import { AdminHeader } from "@/components/admin/layout/AdminHeader"

export const metadata = {
  title: "Administration | DBS Store",
  description: "Tableau de bord administrateur DBS Store",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Check for admin role
  if (!user || !isAdminRole(user.role)) {
    redirect("/")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
