const UPPERCASE_RE = /[A-Z]/;
const DIGIT_RE = /[0-9]/;
const SPECIAL_RE = /[^A-Za-z0-9]/;

const levels = [
  { label: "Faible", color: "bg-red-500" },
  { label: "Moyen", color: "bg-orange-400" },
  { label: "Bien", color: "bg-yellow-400" },
  { label: "Fort", color: "bg-green-500" },
];

import { cn } from "@/lib/utils";

export function getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  let score = 1;
  if (password.length >= 8) score++;
  if (UPPERCASE_RE.test(password) && DIGIT_RE.test(password)) score++;
  if (SPECIAL_RE.test(password) || password.length >= 12) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const current = levels[strength - 1];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {levels.map((level, i) => (
          <div
            key={level.label}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < strength ? current.color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{current.label}</p>
    </div>
  );
}
