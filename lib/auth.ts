import { betterAuth } from "better-auth";
import { organization, emailOTP } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ac, owner, admin, member } from "@/lib/auth/permissions";
import { sendOtpEmail } from "@/lib/email";

export async function getAuth() {
  const { env } = await getCloudflareContext<CloudflareEnv>();

  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    socialProviders.facebook = {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    };
  }

  if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
    socialProviders.apple = {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    database: drizzle(env.DB),

    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

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
          if (!env.RESEND_API_KEY) {
            console.log(`[emailOTP DEV] type=${type} email=${email} otp=${otp}`);
            return;
          }
          await sendOtpEmail(email, otp, type);
        },
        otpLength: 6,
        expiresIn: 300,
      }),
    ],
  });
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;
