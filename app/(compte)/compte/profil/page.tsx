import { headers } from "next/headers";
import { getCachedSession } from "@/lib/session";
import { getAuth } from "@/lib/auth";
import { hasCredentialAccount } from "@/lib/auth-utils";
import { AvatarUpload } from "@/components/compte/avatar-upload";
import { ProfilSections } from "@/components/compte/profil-sections";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const session = await getCachedSession();
  const user = session!.user;

  const auth = await getAuth();
  const accounts = await auth.api.listUserAccounts({ headers: await headers() });
  const canChangePassword = hasCredentialAccount(
    (accounts ?? []).map((a) => ({ provider: a.providerId }))
  );

  const memberSince = user.createdAt
    ? new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "long",
      }).format(new Date(user.createdAt))
    : null;

  return (
    <div>
      <h2 className="text-lg font-semibold">Mon profil</h2>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:gap-6">
        <AvatarUpload name={user.name || user.email} image={user.image ?? null} />
        <div className="text-center sm:text-left">
          <p className="text-lg font-semibold">{user.name || "—"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
            <Badge variant={user.emailVerified ? "default" : "secondary"}>
              {user.emailVerified ? "Email vérifié" : "Email non vérifié"}
            </Badge>
            {memberSince ? (
              <span className="text-xs text-muted-foreground">
                Membre depuis {memberSince}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProfilSections
          name={user.name}
          email={user.email}
          canChangePassword={canChangePassword}
        />
      </div>
    </div>
  );
}
