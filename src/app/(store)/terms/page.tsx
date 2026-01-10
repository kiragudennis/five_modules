// app/terms/page.js
import Link from "next/link";
import { FileText, Scale, Mail, Phone, MapPin } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-2 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <FileText className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-10">
        <div className="bg-muted/30 p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-4">
            Privacy Policy Framework for Custom E-commerce Stores
          </h1>
          <p className="text-lg font-medium">
            Our platform provides custom e-commerce solutions with built-in
            privacy frameworks compliant with Kenyan data protection laws and
            GDPR standards. The policies you see here demonstrate the
            professional legal frameworks we can build into your custom online
            store.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
              Kenya Data Protection Act, 2019
            </span>
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
              GDPR Compliant
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-800 dark:text-purple-300">
              Customizable for Your Business
            </span>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5" /> 1. Agreement to Terms
          </h2>
          <p className="text-base leading-relaxed">
            By accessing or using our website, you agree to be bound by these
            Terms of Service and all applicable laws and regulations in Kenya.
            If you do not agree with any of these terms, you are prohibited from
            using or accessing this site.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            2. Intellectual Property Rights
          </h2>
          <p className="text-base leading-relaxed">
            The content, organization, graphics, design, and other matters
            related to our site are protected under applicable copyrights,
            trademarks, and other proprietary laws. The "[SHOP]" name and logo
            are registered trademarks of [SHOP].
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
          <p className="text-base leading-relaxed">
            As a user of our website, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-base leading-relaxed">
              Provide accurate and complete information when creating an account
              or making a purchase
            </li>
            <li className="text-base leading-relaxed">
              Maintain the confidentiality of your account credentials
            </li>
            <li className="text-base leading-relaxed">
              Not use the website for any illegal purpose or in violation of any
              laws in Kenya
            </li>
            <li className="text-base leading-relaxed">
              Not reproduce, duplicate, or copy any content from the website
              without permission
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Products and Pricing</h2>
          <p className="text-base leading-relaxed">
            We reserve the right to change product prices at any time without
            notice. All prices are in Kenyan Shillings (KES) unless otherwise
            stated. We strive to display accurate product information but do not
            warrant that product descriptions or other content is accurate,
            complete, or error-free.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            5. Order Acceptance and Payment
          </h2>
          <p className="text-base leading-relaxed">
            Your receipt of an electronic or other form of order confirmation
            does not signify our acceptance of your order. We reserve the right
            to accept or decline your order for any reason. Payment must be
            received before we can process and ship your order.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Returns and Refunds</h2>
          <p className="text-base leading-relaxed">
            Please review our{" "}
            <Link
              href="/return"
              className="text-primary underline hover:no-underline"
            >
              Return Policy
            </Link>{" "}
            for detailed information about returns and refunds. By making a
            purchase, you agree to the terms outlined in our Return Policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Shipping</h2>
          <p className="text-base leading-relaxed">
            Please review our{" "}
            <Link
              href="/shipping"
              className="text-primary underline hover:no-underline"
            >
              Shipping Policy
            </Link>{" "}
            for information about shipping methods, delivery times, and shipping
            costs.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Governing Law</h2>
          <p className="text-base leading-relaxed">
            These Terms shall be governed by and construed in accordance with
            the laws of Kenya. Any dispute arising from these Terms or your use
            of the website shall be subject to the exclusive jurisdiction of the
            courts of Kenya.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
          <p className="text-base leading-relaxed">
            [SHOP] shall not be liable for any damages that result from the use
            of, or inability to use, the materials on this site or the
            performance of the products, even if we have been advised of the
            possibility of such damages.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Changes to Terms</h2>
          <p className="text-base leading-relaxed">
            We may revise these Terms of Service at any time without notice. By
            using this website, you are agreeing to be bound by the then current
            version of these Terms of Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" /> 11. Contact Information
          </h2>
          <p className="text-base leading-relaxed">
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="bg-muted/30 p-6 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>
                OUR SHOP
                <br />
                SOME Rd
                <br />
                LOCATION, Kenya
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 flex-shrink-0" />
              <span>legal@domain.com</span>
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
