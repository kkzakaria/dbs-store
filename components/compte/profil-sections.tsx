"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/app/(compte)/compte/profil/logout-button";
import { EditNameDialog } from "@/components/compte/edit-name-dialog";
import { EditEmailDialog } from "@/components/compte/edit-email-dialog";
import { ChangePasswordDialog } from "@/components/compte/change-password-dialog";

interface ProfilSectionsProps {
  name: string;
  email: string;
  canChangePassword: boolean;
  canChangeEmail: boolean;
}

export function ProfilSections({ name, email, canChangePassword, canChangeEmail }: ProfilSectionsProps) {
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border">
        <div className="border-b px-6 py-4">
          <h3 className="text-sm font-semibold">Informations personnelles</h3>
        </div>
        <dl className="divide-y">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nom
              </dt>
              <dd className="mt-1 text-sm">{name || "—"}</dd>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditName(true)}>
              Modifier
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 truncate text-sm">{email}</dd>
            </div>
            {canChangeEmail ? (
              <Button variant="outline" size="sm" onClick={() => setEditEmail(true)}>
                Modifier
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Vérifiez votre email d&apos;abord</span>
            )}
          </div>
        </dl>
      </section>

      <section className="rounded-xl border">
        <div className="border-b px-6 py-4">
          <h3 className="text-sm font-semibold">Sécurité</h3>
        </div>
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {canChangePassword ? (
            <>
              <p className="text-sm text-muted-foreground">
                Modifiez votre mot de passe régulièrement pour sécuriser votre compte.
              </p>
              <Button variant="outline" size="sm" onClick={() => setEditPassword(true)}>
                Changer le mot de passe
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous vous connectez via un compte externe. La gestion du mot de passe se
              fait chez votre fournisseur.
            </p>
          )}
        </div>
        <div className="border-t px-6 py-4">
          <LogoutButton />
        </div>
      </section>

      <EditNameDialog
        key={editName ? "name-open" : "name-closed"}
        open={editName}
        onOpenChange={setEditName}
        currentName={name}
      />
      {canChangeEmail ? (
        <EditEmailDialog
          key={editEmail ? "email-open" : "email-closed"}
          open={editEmail}
          onOpenChange={setEditEmail}
          currentEmail={email}
        />
      ) : null}
      {canChangePassword ? (
        <ChangePasswordDialog
          key={editPassword ? "pwd-open" : "pwd-closed"}
          open={editPassword}
          onOpenChange={setEditPassword}
        />
      ) : null}
    </div>
  );
}
