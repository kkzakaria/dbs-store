import Link from "next/link";
import type { Metadata } from "next";
import { FaqSection } from "@/components/support/faq-section";
import { ContactForm } from "@/components/support/contact-form";

export const metadata: Metadata = {
  title: "Support — DBS Store",
  description:
    "Consultez notre FAQ ou contactez-nous. Nous sommes là pour vous aider avec vos commandes, livraisons et questions sur nos produits.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Accueil
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">Support</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">
        Centre d&apos;aide
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Trouvez des réponses à vos questions ou contactez notre équipe.
      </p>

      <div className="mt-10">
        <FaqSection />
      </div>

      <hr className="my-12 border-border" />

      <div className="mb-8">
        <ContactForm />
      </div>
    </div>
  );
}
