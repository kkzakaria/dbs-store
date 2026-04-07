// Backwards-compatible shim. New code should import from `@/lib/email/enqueue`
// and `@/lib/email/templates` directly.
import { enqueueEmail } from "./email/enqueue";
import { buildOtpEmail } from "./email/templates";
import type { OtpType } from "./email/types";

export type { OtpType };

export async function sendOtpEmail(
  to: string,
  otp: string,
  type: OtpType
): Promise<void> {
  await enqueueEmail(buildOtpEmail(to, otp, type));
}
