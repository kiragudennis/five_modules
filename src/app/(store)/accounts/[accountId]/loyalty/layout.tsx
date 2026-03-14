// app/account/[accountId]loyalty/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty Rewards Program | Blessed Two Electricals",
  description:
    "Earn loyalty points with every purchase at Blessed Two Electricals. Redeem points for discounts on lighting products, get exclusive offers, and enjoy tier benefits.",
  keywords: [
    "loyalty program lighting",
    "reward points Nairobi",
    "customer rewards",
    "discounts lighting",
    "loyalty benefits",
    "points redemption",
  ],
  openGraph: {
    title: "Loyalty Rewards Program | Blessed Two Electricals",
    description:
      "Earn and redeem points for discounts on quality lighting solutions.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoyaltyPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqs = [
    {
      question: "How do I earn loyalty points?",
      answer:
        "You earn 1 point for every KES 10 spent on lighting products. Higher tiers earn points faster with bonus multipliers.",
    },
    {
      question: "How can I redeem my points?",
      answer:
        "Redeem points in multiples of 100 for discount coupons. 100 points = KES 10 discount during checkout.",
    },
    {
      question: "Do loyalty points expire?",
      answer:
        "No, your loyalty points never expire. They remain in your account until you choose to redeem them.",
    },
    {
      question: "What are the loyalty tiers?",
      answer:
        "We have four tiers: Bronze (0+ points), Silver (1,000+ points), Gold (5,000+ points), and Platinum (15,000+ points). Higher tiers earn more points per shilling and get additional benefits.",
    },
  ];

  return (
    <main>
      {/* Add FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      {/* Add Loyalty Program Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LoyaltyProgram",
            name: "Blessed Two Electricals Loyalty Rewards",
            description: "Customer loyalty program for lighting products",
            provider: {
              "@type": "LocalBusiness",
              name: "Blessed Two Electricals",
            },
            programName: "Lighting Rewards Program",
            termsOfService: "https://www.blessedtwoelectricals.com/terms",
          }),
        }}
      />
      {children}
    </main>
  );
}
