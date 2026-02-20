import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/connexion?callbackUrl=/checkout");
  if (!session.user.emailVerified) redirect("/email-non-verifie");
  return <CheckoutForm />;
}
