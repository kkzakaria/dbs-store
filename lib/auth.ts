import { betterAuth } from "better-auth";
import { organization, emailOTP } from "better-auth/plugins";
import Database from "better-sqlite3";
import { ac, owner, admin, member } from "@/lib/auth/permissions";
import { sendOtpEmail } from "@/lib/email";

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  socialProviders.facebook = {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  };
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: new Database(process.env.DATABASE_URL || "./dev.db"),

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  socialProviders,

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  plugins: [
    organization({
      ac,
      roles: { owner, admin, member },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
          console.log(`[emailOTP DEV] type=${type} email=${email} otp=${otp}`);
          return;
        }
        await sendOtpEmail(email, otp, type);
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
  ],
});

export type Auth = typeof auth;
