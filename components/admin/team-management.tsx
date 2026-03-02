"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { inviteMember, updateMemberRole, removeMember } from "@/lib/actions/admin-team";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { email: string; name: string };
};

interface TeamManagementProps {
  members: Member[];
  isOwner: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

export function TeamManagement({ members: initial, isOwner }: TeamManagementProps) {
  const [members, setMembers] = useState(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setSuccess(null);
    const result = await inviteMember(email, role);
    if (result.error) {
      setInviteError(result.error);
    } else {
      setSuccess(`Invitation envoyée à ${email}`);
      setEmail("");
    }
    setInviting(false);
  }

  async function handleRoleChange(memberId: string, newRole: "admin" | "member") {
    setActionError(null);
    const result = await updateMemberRole(memberId, newRole);
    if (result.error) {
      setActionError(result.error);
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    setActionError(null);
    const result = await removeMember(memberId);
    if (result.error) {
      setActionError(result.error);
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Liste des membres */}
      <div className="rounded-lg border bg-background">
        <div className="border-b px-4 py-3 font-semibold">Membres ({members.length})</div>
        <div className="divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium">{m.user.name}</p>
                <p className="text-sm text-muted-foreground">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && m.role !== "owner" ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m.id, v as "admin" | "member")}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="member">Membre</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                )}
                {isOwner && m.role !== "owner" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(m.id)}
                  >
                    Retirer
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}

      {/* Formulaire d'invitation (owner seulement) */}
      {isOwner ? (
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-4 font-semibold">Inviter un membre</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Rôle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="member">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError ? (
              <p className="text-sm text-destructive">{inviteError}</p>
            ) : null}
            {success ? (
              <p className="text-sm text-green-600">{success}</p>
            ) : null}
            <Button type="submit" disabled={inviting}>
              {inviting ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
