// app/privacy/page.js
import Link from "next/link";
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
  Baby,
} from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-2 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-muted/30 p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-4">
            Professional Terms of Service Framework
          </h1>
          <p className="text-lg font-medium mb-4">
            This demonstrates the type of professional legal frameworks we build
            into custom e-commerce platforms. Your store will include terms
            specifically tailored to your business type, products, and
            operational requirements.
          </p>
          <p className="text-sm text-muted-foreground">
            All our custom builds include legal documentation compliant with
            Kenyan commercial law and international e-commerce standards.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" /> 1. Information We Collect
          </h2>
          <p className="text-base leading-relaxed">
            We may collect the following types of information:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li className="text-base leading-relaxed">
              <strong>Personal Data:</strong> Name, email address, phone number,
              shipping address, and payment information that you voluntarily
              provide when making a purchase or creating an account.
            </li>
            <li className="text-base leading-relaxed">
              <strong>Derivative Data:</strong> Information our servers
              automatically collect when you access the site, such as your IP
              address, browser type, and access times.
            </li>
            <li className="text-base leading-relaxed">
              <strong>Financial Data:</strong> Payment details necessary to
              process your orders, though all payments are processed through
              secure third-party payment processors.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" /> 2. Use of Your Information
          </h2>
          <p className="text-base leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-base leading-relaxed">
              Process your purchases and returns
            </li>
            <li className="text-base leading-relaxed">
              Communicate with you about orders, products, services, and
              promotional offers
            </li>
            <li className="text-base leading-relaxed">
              Improve our website and customer service
            </li>
            <li className="text-base leading-relaxed">
              Comply with legal obligations under Kenyan law
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" /> 3. Disclosure of Your Information
          </h2>
          <p className="text-base leading-relaxed">
            We may share information we have collected about you in certain
            situations, including:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li className="text-base leading-relaxed">
              <strong>Third-Party Service Providers:</strong> We may share your
              information with third parties that perform services for us, such
              as payment processing, order fulfillment, and marketing
              assistance.
            </li>
            <li className="text-base leading-relaxed">
              <strong>Legal Requirements:</strong> We may disclose your
              information where required to do so by law or in response to valid
              requests by public authorities in Kenya.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5" /> 4. Data Security
          </h2>
          <p className="text-base leading-relaxed">
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. However, no internet
            transmission is ever completely secure or error-free.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> 5. Your Rights Under Kenyan Law
          </h2>
          <p className="text-base leading-relaxed">
            Under the Data Protection Act, 2019 of Kenya, you have certain
            rights regarding your personal data, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-base leading-relaxed">
              The right to access and obtain a copy of your personal data
            </li>
            <li className="text-base leading-relaxed">
              The right to request correction of inaccurate or incomplete data
            </li>
            <li className="text-base leading-relaxed">
              The right to object to processing of your personal data
            </li>
            <li className="text-base leading-relaxed">
              The right to request deletion of your personal data
            </li>
          </ul>
          <p className="text-base leading-relaxed mt-4">
            To exercise these rights, please contact us using the information
            provided below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Baby className="h-5 w-5" /> 6. Children's Privacy
          </h2>
          <p className="text-base leading-relaxed">
            Our website is not intended for children under 13 years of age. We
            do not knowingly collect personal information from children under
            13.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> 7. Changes to This Privacy Policy
          </h2>
          <p className="text-base leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" /> 8. Contact Us
          </h2>
          <p className="text-base leading-relaxed">
            If you have questions or comments about this Privacy Policy, please
            contact us at:
          </p>
          <div className="bg-muted/30 p-6 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>
                Our Shop
                <br />
                Some Rd
                <br />
                Location, Kenya
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 flex-shrink-0" />
              <span>privacy@domain.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 flex-shrink-0" />
              <span>
                +254 XXX XXX XXX, +254 XXX XXX XXX or +254 XXX XXX XXX
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
