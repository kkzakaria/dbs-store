import { Eye, EyeOff } from "lucide-react";

interface PasswordToggleProps {
  type: "password" | "text";
  onToggle: () => void;
}

export function PasswordToggle({ type, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={type === "password" ? "Afficher le mot de passe" : "Masquer le mot de passe"}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {type === "password" ? (
        <Eye className="size-4" />
      ) : (
        <EyeOff className="size-4" />
      )}
    </button>
  );
}
