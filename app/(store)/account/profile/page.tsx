import { redirect } from "next/navigation"
import { getCurrentUser } from "@/actions/auth"
import { AvatarUpload, ProfileForm } from "@/components/store/account"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Mon profil | DBS Store",
  description: "Modifiez vos informations personnelles",
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?redirect=/account/profile")
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Mon profil</h2>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles
        </p>
      </div>

      <Separator />

      {/* Avatar section */}
      <div>
        <h3 className="mb-4 text-sm font-medium">Photo de profil</h3>
        <AvatarUpload
          currentAvatarUrl={user.avatar_url}
          fullName={user.full_name}
        />
      </div>

      <Separator />

      {/* Profile form */}
      <div>
        <h3 className="mb-4 text-sm font-medium">Informations</h3>
        <ProfileForm user={user} />
      </div>
    </div>
  )
}
