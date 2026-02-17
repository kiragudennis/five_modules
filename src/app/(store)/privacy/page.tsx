// app/privacy/page.js
import {
  Shield,
  Lock,
  Mail,
  Phone,
  MapPin,
  Database,
  ShieldCheck,
  Bell,
  Users,
  Calendar,
  Zap,
  Lightbulb,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Blessed Two Electronics Nairobi",
  description:
    "Privacy policy for Blessed Two Electronics. Learn how we collect, use, and protect your personal information when you shop for lighting solutions in Kenya.",
  keywords: [
    "privacy policy",
    "data protection Kenya",
    "GDPR compliance",
    "customer data privacy",
    "electronics privacy",
  ],
  openGraph: {
    title: "Privacy Policy | Blessed Two Electronics",
    description:
      "Our commitment to protecting your personal information and ensuring data security.",
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-2 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          Blessed Two Electronics - Last Updated: {currentDate}
        </p>
      </div>

      <div className="space-y-8">
        {/* Introduction */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200">
          <h1 className="text-3xl font-bold mb-4 text-blue-900 dark:text-blue-100">
            Your Privacy Matters at Blessed Two Electronics
          </h1>
          <p className="text-lg font-medium mb-4">
            We are committed to protecting your privacy and ensuring the
            security of your personal information as you shop for quality
            lighting solutions.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Kenya Data Protection Act Compliant
            </span>
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
              <Lock className="w-3 h-3 mr-1" />
              Secure Payment Processing
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-800 dark:text-purple-300">
              <Zap className="w-3 h-3 mr-1" />
              Lighting Specialist Since 2010
            </span>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" /> 1. Information We
            Collect
          </h2>
          <p className="text-base leading-relaxed">
            To provide you with the best lighting solutions and service, we
            collect:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li className="text-base leading-relaxed">
              <strong>Contact Information:</strong> Name, email, phone number,
              and delivery address for order processing
            </li>
            <li className="text-base leading-relaxed">
              <strong>Installation Details:</strong> Location information for
              professional installation services
            </li>
            <li className="text-base leading-relaxed">
              <strong>Business Information:</strong> For trade customers, we
              collect business registration details for credit accounts
            </li>
            <li className="text-base leading-relaxed">
              <strong>Technical Information:</strong> Browser type, IP address,
              and device information for website optimization
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" /> 2. How We Use Your
            Information
          </h2>
          <div className="bg-blue-50/50 rounded-lg p-4">
            <p className="text-base leading-relaxed">
              We use your information specifically to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li className="text-base leading-relaxed">
                Process your lighting product orders and arrange delivery
              </li>
              <li className="text-base leading-relaxed">
                Schedule professional installation services
              </li>
              <li className="text-base leading-relaxed">
                Send warranty registration and product updates
              </li>
              <li className="text-base leading-relaxed">
                Provide customer support for your lighting solutions
              </li>
              <li className="text-base leading-relaxed">
                Send relevant offers on lighting products (only with your
                consent)
              </li>
              <li className="text-base leading-relaxed">
                Comply with Kenyan tax and business regulations
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" /> 3. Information Sharing
          </h2>
          <p className="text-base leading-relaxed">
            We respect your privacy and only share information when necessary:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li className="text-base leading-relaxed">
              <strong>Delivery Partners:</strong> We share delivery addresses
              with our trusted logistics partners to ensure timely delivery of
              your lighting products
            </li>
            <li className="text-base leading-relaxed">
              <strong>Installation Technicians:</strong> Location details are
              shared with our certified electricians for installation services
            </li>
            <li className="text-base leading-relaxed">
              <strong>Payment Processors:</strong> We use secure payment
              gateways that comply with PCI DSS standards
            </li>
            <li className="text-base leading-relaxed">
              <strong>Legal Requirements:</strong> We may disclose information
              when required by Kenyan law or to protect our rights
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" /> 4. Data Security
          </h2>
          <div className="bg-green-50/50 rounded-lg p-4">
            <p className="text-base leading-relaxed">
              As specialists in electrical solutions, we understand the
              importance of security:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li className="text-base leading-relaxed">
                SSL encryption for all data transmissions
              </li>
              <li className="text-base leading-relaxed">
                Secure payment processing with M-Pesa and card payments
              </li>
              <li className="text-base leading-relaxed">
                Regular security audits of our systems
              </li>
              <li className="text-base leading-relaxed">
                Limited employee access to customer data
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> 5. Your Rights
            Under Kenyan Law
          </h2>
          <p className="text-base leading-relaxed">
            Under the Data Protection Act, 2019, you have the right to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Access & Correction</h4>
              <p className="text-sm text-gray-600">
                Request access to your data or correct any inaccuracies
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Data Portability</h4>
              <p className="text-sm text-gray-600">
                Request your data in a machine-readable format
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Withdraw Consent</h4>
              <p className="text-sm text-gray-600">
                Opt-out of marketing communications at any time
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Deletion Rights</h4>
              <p className="text-sm text-gray-600">
                Request deletion of your personal data
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" /> 6. Cookies &
            Tracking
          </h2>
          <p className="text-base leading-relaxed">
            We use cookies to improve your shopping experience:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li className="text-base leading-relaxed">
              <strong>Essential Cookies:</strong> Required for the website to
              function
            </li>
            <li className="text-base leading-relaxed">
              <strong>Analytics Cookies:</strong> Help us understand how
              customers use our site
            </li>
            <li className="text-base leading-relaxed">
              <strong>Preference Cookies:</strong> Remember your lighting
              preferences and cart items
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            You can control cookies through your browser settings. However,
            disabling some cookies may affect your shopping experience.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" /> 7. Policy Updates
          </h2>
          <p className="text-base leading-relaxed">
            We may update this privacy policy to reflect changes in our
            practices or legal requirements. We will notify you of significant
            changes by posting a notice on our website and updating the
            effective date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" /> 8. Contact Our Privacy
            Team
          </h2>
          <p className="text-base leading-relaxed">
            For privacy-related questions or to exercise your rights, contact
            us:
          </p>
          <div className="bg-blue-50/50 p-6 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">Blessed Two Electronics</p>
                <p className="text-sm text-gray-600">
                  Duruma Road, Nairobi
                  <br />
                  Kenya
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-600">
                  privacy@blessedtwoelectronics.co.ke
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">Phone/WhatsApp</p>
                <p className="text-sm text-gray-600">+254 727 833 691</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            We typically respond to privacy inquiries within 48 hours during
            business days.
          </p>
        </section>
      </div>
    </div>
  );
}
