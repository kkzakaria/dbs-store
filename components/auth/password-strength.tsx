const levels = [
  { label: "Faible", color: "bg-red-500" },
  { label: "Moyen", color: "bg-orange-400" },
  { label: "Bien", color: "bg-yellow-400" },
  { label: "Fort", color: "bg-green-500" },
];

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 1;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
  return Math.min(score, 4);
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
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? current.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{current.label}</p>
    </div>
  );
}
