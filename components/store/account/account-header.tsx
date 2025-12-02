import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatPhoneForDisplay } from "@/lib/validations/auth"
import { Gift } from "lucide-react"

interface AccountHeaderProps {
  user: {
    full_name: string | null
    phone: string | null
    avatar_url: string | null
    loyalty_points: number | null
  }
}

export function AccountHeader({ user }: AccountHeaderProps) {
  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16 border-2 border-primary/20">
        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "Avatar"} />
        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{user.full_name || "Utilisateur"}</h1>
        {user.phone && (
          <p className="text-sm text-muted-foreground">
            {formatPhoneForDisplay(user.phone)}
          </p>
        )}
        <Badge variant="secondary" className="w-fit gap-1">
          <Gift className="size-3" />
          {user.loyalty_points || 0} points
        </Badge>
      </div>
    </div>
  )
}
