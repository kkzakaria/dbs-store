"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeEmail } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EditEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function EditEmailDialog({ open, onOpenChange, currentEmail }: EditEmailDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Adresse email invalide.");
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.toLowerCase()) {
      setError("Cette adresse est déjà la vôtre.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await changeEmail({ newEmail: trimmed, callbackURL: "/compte/profil" });
    setSubmitting(false);
    if (res.error) {
      setError(translateAuthError(res.error.message, "Échec de la demande."));
      return;
    }
    setSent(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer l&apos;adresse email</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Un lien de confirmation a été envoyé à votre adresse actuelle
              ({currentEmail}). Le changement sera appliqué après confirmation.
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fermer</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profil-new-email">Nouvel email</Label>
              <Input
                id="profil-new-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
