export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  "OTP expired": "Code expiré. Demandez un nouveau code.",
  "Invalid OTP": "Code incorrect.",
  "OTP not found": "Code incorrect ou expiré.",
  "User not found": "Aucun compte trouvé avec cet email.",
  "User already exists": "Un compte existe déjà avec cette adresse email.",
  "User already exists. Use another email.": "Un compte existe déjà avec cette adresse email.",
  "Invalid email or password": "Email ou mot de passe incorrect.",
  "Password too short": "Le mot de passe est trop court.",
  "Email not verified": "Votre email n'est pas encore vérifié.",
};

export function translateAuthError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  return AUTH_ERROR_TRANSLATIONS[message] ?? message;
}
