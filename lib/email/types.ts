export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type OtpType = "sign-in" | "email-verification" | "forget-password";
