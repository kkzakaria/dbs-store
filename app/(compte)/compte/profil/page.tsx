import { getCachedSession } from "@/lib/session";
import { LogoutButton } from "./logout-button";

export default async function ProfilPage() {
  // getCachedSession() deduplicates the auth call already made by the layout.
  const session = await getCachedSession();
  const user = session!.user;

  return (
    <div>
      <h2 className="text-lg font-semibold">Mon profil</h2>

      <div className="mt-6 rounded-xl border p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nom
            </dt>
            <dd className="mt-1 text-sm">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </dt>
            <dd className="mt-1 text-sm">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email vérifié
            </dt>
            <dd className="mt-1 text-sm">
              {user.emailVerified ? "Oui" : "Non"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
