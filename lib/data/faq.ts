export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  title: string;
  items: FaqItem[];
};

export const FAQ_DATA: FaqCategory[] = [
  {
    title: "Commandes",
    items: [
      {
        question: "Comment passer une commande ?",
        answer:
          "Parcourez notre catalogue, ajoutez les produits souhaités à votre panier, puis cliquez sur « Commander ». Remplissez vos informations de livraison et confirmez votre commande. Vous recevrez un email de confirmation.",
      },
      {
        question: "Comment suivre ma commande ?",
        answer:
          "Connectez-vous à votre compte et rendez-vous dans « Mes commandes ». Vous y trouverez le statut de chaque commande (en attente, confirmée, expédiée, livrée).",
      },
      {
        question: "Puis-je annuler ma commande ?",
        answer:
          "Vous pouvez demander l'annulation d'une commande tant qu'elle n'a pas été expédiée. Contactez-nous via le formulaire ci-dessous en précisant votre numéro de commande.",
      },
    ],
  },
  {
    title: "Livraison",
    items: [
      {
        question: "Quelles sont les zones de livraison ?",
        answer:
          "Nous livrons dans toute la Côte d'Ivoire, principalement à Abidjan et dans les grandes villes. Les délais peuvent varier selon votre localisation.",
      },
      {
        question: "Quels sont les délais de livraison ?",
        answer:
          "La livraison à Abidjan prend généralement 24 à 48 heures après confirmation de la commande. Pour les autres villes, comptez 3 à 5 jours ouvrés.",
      },
      {
        question: "Quels sont les frais de livraison ?",
        answer:
          "La livraison est actuellement gratuite pour toutes les commandes sur DBS Store.",
      },
    ],
  },
  {
    title: "Paiement",
    items: [
      {
        question: "Quels sont les modes de paiement acceptés ?",
        answer:
          "Nous acceptons actuellement le paiement à la livraison (COD). Vous payez en espèces au livreur lors de la réception de votre colis.",
      },
      {
        question: "Pourquoi uniquement le paiement à la livraison ?",
        answer:
          "Le paiement à la livraison vous permet de vérifier votre commande avant de payer. Les paiements en ligne (Mobile Money, carte bancaire) seront disponibles prochainement.",
      },
    ],
  },
  {
    title: "Compte",
    items: [
      {
        question: "Comment créer un compte ?",
        answer:
          "Cliquez sur « Connexion » puis « Créer un compte ». Renseignez votre email et un mot de passe. Vous recevrez un code de vérification par email pour activer votre compte.",
      },
      {
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer:
          "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Entrez votre adresse email et suivez les instructions pour réinitialiser votre mot de passe.",
      },
    ],
  },
  {
    title: "Produits",
    items: [
      {
        question: "Les produits sont-ils authentiques ?",
        answer:
          "Oui, tous nos produits sont 100 % authentiques et proviennent de fournisseurs agréés. Nous garantissons l'authenticité de chaque article vendu sur DBS Store.",
      },
      {
        question: "Les produits sont-ils garantis ?",
        answer:
          "Oui, tous nos produits bénéficient d'une garantie constructeur. La durée varie selon le produit et la marque. Les détails sont indiqués sur chaque fiche produit.",
      },
    ],
  },
];
